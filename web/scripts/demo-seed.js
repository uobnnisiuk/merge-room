/**
 * Demo seed script: creates a demo git repository with staged/unstaged changes
 * Usage: pnpm demo:seed
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_REPO_PATH = join(__dirname, '..', '..', 'docs', 'demo-repo');

function run(cmd, cwd = DEMO_REPO_PATH) {
  execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
}

function main() {
  console.log('[demo:seed] Creating demo repository at:', DEMO_REPO_PATH);

  // Clean existing
  if (existsSync(DEMO_REPO_PATH)) {
    console.log('[demo:seed] Removing existing demo-repo...');
    execSync(`rm -rf "${DEMO_REPO_PATH}"`);
  }

  // Create directory
  mkdirSync(DEMO_REPO_PATH, { recursive: true });

  // Initialize git repo
  run('git init');
  run('git config user.email "demo@example.com"');
  run('git config user.name "Demo User"');

  // Create initial files
  writeFileSync(join(DEMO_REPO_PATH, 'README.md'), `# Demo Project

This is a demo project for testing merge-room.
`);

  // Create src directory first
  mkdirSync(join(DEMO_REPO_PATH, 'src'), { recursive: true });

  writeFileSync(join(DEMO_REPO_PATH, 'src', 'index.js'), `// Main entry point
function main() {
  console.log('Hello, World!');
}

main();
`);

  writeFileSync(join(DEMO_REPO_PATH, 'src', 'utils.js'), `// Utility functions
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}
`);

  // Initial commit
  run('git add -A');
  run('git commit -m "Initial commit"');

  // Create changes for demo
  // 1. Modify existing file (unstaged)
  writeFileSync(join(DEMO_REPO_PATH, 'src', 'utils.js'), `// Utility functions
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}
`);

  // 2. Modify and stage another file
  appendFileSync(join(DEMO_REPO_PATH, 'README.md'), `
## Features

- Addition
- Subtraction
- Multiplication (new!)
- Division (new!)
`);
  run('git add README.md');

  // 3. Create a new untracked file
  writeFileSync(join(DEMO_REPO_PATH, 'src', 'math.js'), `// Advanced math functions
export function power(base, exponent) {
  return Math.pow(base, exponent);
}

export function sqrt(n) {
  return Math.sqrt(n);
}
`);

  console.log('[demo:seed] Demo repository created successfully!');
  console.log('[demo:seed] Path:', DEMO_REPO_PATH);
  console.log('[demo:seed] Status:');
  console.log('  - Staged: README.md (modified)');
  console.log('  - Unstaged: src/utils.js (modified)');
  console.log('  - Untracked: src/math.js (new file)');
  console.log('');
  console.log('Use this path when creating a Task in merge-room:');
  console.log(`  ${DEMO_REPO_PATH}`);
}

main();
