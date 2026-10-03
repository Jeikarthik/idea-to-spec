'use strict';

const fs = require('fs');
const path = require('path');

/** Read and parse JSON from stdin. Returns {} when stdin is a TTY, empty, or unparseable. */
function readStdinJson() {
  if (process.stdin.isTTY) return {};
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    return {};
  }
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/** Write via temp file + rename so readers never observe a half-written file. */
function writeFileAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  for (let attempt = 0; ; attempt++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      // Windows can briefly refuse the rename while another process holds the target open.
      if (attempt >= 20 || !['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) {
        try { fs.unlinkSync(tmp); } catch { /* already gone */ }
        throw err;
      }
      sleepSync(25);
    }
  }
}

/**
 * Run fn while holding an exclusive cross-process lock (an atomic mkdir).
 * Locks older than staleMs are treated as abandoned by a crashed process and broken.
 */
function withLock(lockDir, fn, { timeoutMs = 15000, staleMs = 30000 } = {}) {
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      try {
        if (Date.now() - fs.statSync(lockDir).mtimeMs > staleMs) {
          fs.rmSync(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch { /* lock vanished between checks; retry */ }
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for lock ${lockDir}`);
      }
      sleepSync(50);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function timestamp(now = new Date()) {
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

module.exports = { readStdinJson, readText, writeFileAtomic, withLock, sleepSync, today, timestamp };
