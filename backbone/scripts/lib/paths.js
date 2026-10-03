'use strict';

const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_DOCS_DIR = 'backbone';

/** Project root: explicit override > CLAUDE_PROJECT_DIR > hook input cwd > process cwd. */
function projectDir({ override, input } = {}) {
  return path.resolve(
    override || process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd()
  );
}

/** Where Backbone writes its documents inside the project. Override with BACKBONE_DOCS_DIR. */
function docsDir(project) {
  return path.resolve(project, process.env.BACKBONE_DOCS_DIR || DEFAULT_DOCS_DIR);
}

function docPaths(docs) {
  return {
    state: path.join(docs, 'state.md'),
    claims: path.join(docs, 'claims.json'),
    lock: path.join(docs, '.lock'),
    disabled: path.join(docs, '.backbone-disabled'),
    architecture: path.join(docs, 'architecture.md'),
    masterPrd: path.join(docs, 'master-prd.md'),
    workPackages: path.join(docs, 'work-packages.md'),
    modulesDir: path.join(docs, 'modules'),
    decisionLog: path.join(docs, 'decision-log.md'),
    validation: path.join(docs, 'validation.md'),
    feedbackLog: path.join(docs, 'feedback-log.md'),
  };
}

function modulePrdPath(docs, name) {
  return path.join(docs, 'modules', `${name}.md`);
}

module.exports = { PLUGIN_ROOT, DEFAULT_DOCS_DIR, projectDir, docsDir, docPaths, modulePrdPath };
