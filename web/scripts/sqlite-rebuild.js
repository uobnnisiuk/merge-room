#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { createRequire } from 'module';

const execPath = process.execPath;
const nodeRoot = path.resolve(path.dirname(execPath), '..');
const includePath = path.join(nodeRoot, 'include', 'node');

const env = { ...process.env };
if (existsSync(includePath)) {
  env.NPM_CONFIG_NODEDIR = nodeRoot;
  env.npm_config_nodedir = nodeRoot;
  console.log(`[sqlite:rebuild] Using local Node headers at ${nodeRoot}`);
} else {
  console.log('[sqlite:rebuild] Local Node headers not found; falling back to node-gyp download.');
}

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve('better-sqlite3/package.json');
const packageDir = path.dirname(packageJsonPath);

const result = spawnSync('npm', ['run', 'build-release'], {
  stdio: 'inherit',
  env,
  cwd: packageDir,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
