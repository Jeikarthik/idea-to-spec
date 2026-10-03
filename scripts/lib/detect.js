'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const IGNORED_DIRS = new Set([
  '.git', 'node_modules', '.venv', 'venv', 'env', '__pycache__', 'dist', 'build', 'out', 'target',
  '.next', '.nuxt', '.svelte-kit', '.turbo', '.cache', 'coverage', 'vendor', '.idea', '.vscode',
  '.gradle', 'Pods', '.dart_tool', '.terraform', 'bin', 'obj',
]);

const MANIFESTS = [
  'package.json', 'pyproject.toml', 'requirements.txt', 'Pipfile', 'setup.py', 'Cargo.toml', 'go.mod',
  'pom.xml', 'build.gradle', 'build.gradle.kts', 'Gemfile', 'composer.json', 'pubspec.yaml', 'mix.exs',
  'deno.json', 'Package.swift',
];

const SOURCE_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.rb', '.go', '.rs', '.java', '.kt', '.kts',
  '.swift', '.cs', '.php', '.dart', '.ex', '.exs', '.scala', '.c', '.cc', '.cpp', '.h', '.hpp',
  '.vue', '.svelte', '.sql',
]);

const TEST_FILE_RE = /(\.(test|spec)\.[a-z]+$)|(_test\.(go|py|rb|exs)$)|(^test_.*\.py$)|(Tests?\.(cs|java|kt|swift)$)/i;
const TEST_DIR_NAMES = new Set(['test', 'tests', '__tests__', 'spec', 'specs', 'e2e']);
const MIGRATION_DIR_RE = /(^|\/)(migrations|migrate|alembic|prisma\/migrations|supabase\/migrations|db\/migrate)$/i;
const CONTAINER_DIRS = ['src', 'app', 'apps', 'packages', 'lib', 'services', 'modules', 'internal', 'cmd', 'pkg'];

function walk(root, { maxEntries = 5000, maxDepth = 6, skipDirs = [] } = {}) {
  const files = [];
  const dirs = [];
  const skip = new Set(skipDirs.map((d) => path.resolve(d)));
  let seen = 0;
  let truncated = false;
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length) {
    const { dir, depth } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (++seen > maxEntries) { truncated = true; break; }
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (e.isDirectory()) {
        if (IGNORED_DIRS.has(e.name) || skip.has(path.resolve(full))) continue;
        dirs.push(rel);
        if (depth + 1 < maxDepth) stack.push({ dir: full, depth: depth + 1 });
      } else if (e.isFile()) {
        files.push(rel);
      }
    }
    if (truncated) break;
  }
  return { files, dirs, truncated };
}

function git(project, args) {
  const r = spawnSync('git', args, { cwd: project, encoding: 'utf8', timeout: 5000, windowsHide: true });
  return r.status === 0 ? r.stdout.trim() : null;
}

function gitSummary(project, { full = false } = {}) {
  if (git(project, ['rev-parse', '--is-inside-work-tree']) !== 'true') return { repo: false };
  const count = git(project, ['rev-list', '--count', 'HEAD']);
  const summary = { repo: true, commits: count === null ? 0 : Number(count) };
  if (summary.commits > 0) {
    summary.first = git(project, ['log', '--reverse', '--format=%as', '--max-parents=0']);
    if (summary.first) summary.first = summary.first.split(/\r?\n/)[0];
    summary.last = git(project, ['log', '-1', '--format=%as']);
    if (full) {
      const log = git(project, ['log', '-30', '--format=%as %s']);
      summary.recent = log ? log.split(/\r?\n/) : [];
    }
  }
  return summary;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Key names only — values are never read out, so secrets cannot leak through the scan. */
function envExampleKeys(project) {
  for (const name of ['.env.example', '.env.sample', '.env.template']) {
    let text;
    try {
      text = fs.readFileSync(path.join(project, name), 'utf8');
    } catch {
      continue;
    }
    return {
      file: name,
      keys: text.split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && l.includes('='))
        .map((l) => l.replace(/^export\s+/, '').split('=')[0].trim()),
    };
  }
  return null;
}

/**
 * Scan a project for what is legitimately inferable from the repo: manifests, source layout,
 * tests, migrations, git history. Never infers validation history, market fit, or intent.
 */
function scanProject(project, { full = false, docsDir = null } = {}) {
  const { files, dirs, truncated } = walk(project, { skipDirs: docsDir ? [docsDir] : [] });
  const manifests = files.filter((f) => MANIFESTS.includes(path.posix.basename(f)) && f.split('/').length <= 3);
  const sourceFiles = files.filter((f) => SOURCE_EXT.has(path.posix.extname(f).toLowerCase()));
  const testFiles = files.filter((f) => TEST_FILE_RE.test(path.posix.basename(f)) || f.split('/').some((seg) => TEST_DIR_NAMES.has(seg)));
  const migrationDirs = dirs.filter((d) => MIGRATION_DIR_RE.test(d));
  const hasCsproj = files.some((f) => f.endsWith('.csproj'));

  const result = {
    project,
    existing: manifests.length > 0 || hasCsproj || sourceFiles.length >= 3,
    manifests: hasCsproj ? [...manifests, '*.csproj'] : manifests,
    sourceFiles: sourceFiles.length,
    testFiles: testFiles.length,
    migrationDirs,
    git: gitSummary(project, { full }),
    truncated,
  };

  if (full) {
    result.topLevel = fs.readdirSync(project, { withFileTypes: true })
      .filter((e) => !IGNORED_DIRS.has(e.name))
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort();
    result.candidateModules = dirs
      .filter((d) => {
        const parts = d.split('/');
        return parts.length === 2 && CONTAINER_DIRS.includes(parts[0]);
      })
      .sort();
    const pkg = readJson(path.join(project, 'package.json'));
    if (pkg) {
      result.packageJson = {
        name: pkg.name || null,
        scripts: pkg.scripts || {},
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        workspaces: pkg.workspaces || null,
      };
    }
    result.envExample = envExampleKeys(project);
    result.hasDotEnv = files.includes('.env');
    result.sampleTests = testFiles.slice(0, 25);
  }
  return result;
}

module.exports = { scanProject, walk, envExampleKeys, gitSummary };
