/**
 * E2E Smoke Test for merge-room
 * Verifies the core workflow: Task → Diff → Comment with Anchor → Decision → Export
 *
 * Usage: pnpm test:e2e
 */
import { spawn, execSync } from 'child_process';
import { strict as assert } from 'assert';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');
const WEB_DIR = join(__dirname, '..');
const DEMO_REPO_PATH = join(ROOT_DIR, 'docs', 'demo-repo');
const PR_DRAFTS_DIR = join(ROOT_DIR, 'docs', 'pr-drafts');

const API_PORT = 3101;
const API_BASE = `http://localhost:${API_PORT}/api`;

let serverProcess = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      if (res.ok) {
        console.log('[e2e] Server is ready');
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await sleep(500);
  }
  throw new Error('Server failed to start within timeout');
}

async function startServer() {
  console.log('[e2e] Starting server on port', API_PORT);

  serverProcess = spawn('node', ['--import', 'tsx', 'server/index.ts'], {
    cwd: WEB_DIR,
    env: { ...process.env, PORT: String(API_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log('[server]', msg);
  });

  serverProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('ExperimentalWarning')) {
      console.error('[server:err]', msg);
    }
  });

  await waitForServer();
}

function stopServer() {
  if (serverProcess) {
    console.log('[e2e] Stopping server');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

async function api(method, path, body = null, expectFailure = false) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (expectFailure) {
    // Return both status and data for negative tests
    return { status: res.status, ok: res.ok, data };
  }
  if (!res.ok) {
    throw new Error(`API ${method} ${path} failed: ${data.error || res.status}`);
  }
  return data;
}

async function runTests() {
  console.log('\n=== E2E Smoke Test ===\n');

  // Step 1: Create demo repo
  console.log('[e2e] Step 1: Creating demo repository...');
  execSync('node scripts/demo-seed.js', { cwd: WEB_DIR, stdio: 'inherit' });
  assert(existsSync(DEMO_REPO_PATH), 'Demo repo should exist');

  // Step 2: Start server
  console.log('\n[e2e] Step 2: Starting server...');
  await startServer();

  // Step 3: Create task
  console.log('\n[e2e] Step 3: Creating task...');
  const task = await api('POST', '/tasks', {
    title: 'E2E Test Task',
    description: 'Automated smoke test',
    repoPath: DEMO_REPO_PATH,
    branchName: 'master',
  });
  console.log('[e2e] Created task:', task.id);
  assert(task.id, 'Task should have an ID');
  assert.equal(task.status, 'draft', 'Initial status should be draft');

  // Step 4: Refresh diff
  console.log('\n[e2e] Step 4: Refreshing diff...');
  const diff = await api('POST', `/tasks/${task.id}/refresh-diff`);
  assert(diff.diffText, 'Diff should have text');
  assert(diff.diffText.includes('Staged Changes'), 'Diff should include staged changes');
  assert(diff.diffText.includes('Unstaged Changes'), 'Diff should include unstaged changes');
  console.log('[e2e] Diff fetched, length:', diff.diffText.length);

  // Step 5: Create thread with anchored comment
  console.log('\n[e2e] Step 5: Creating thread with anchored comment...');
  const thread = await api('POST', `/tasks/${task.id}/threads`);
  assert(thread.id, 'Thread should have an ID');

  const anchoredComment = await api('POST', `/tasks/threads/${thread.id}/comments`, {
    body: 'This change looks good. The multiply function is well implemented.',
    isPrivate: false,
    anchor: {
      filePath: 'src/utils.js',
      hunkIndex: 0,
      startLine: 1,
      endLine: 3,
      excerpt: '+export function multiply(a, b) {\n+  return a * b;\n+}',
    },
  });
  assert(anchoredComment.anchor, 'Comment should have anchor');
  console.log('[e2e] Created anchored comment:', anchoredComment.id);

  // Step 6: Add private note (should NOT appear in export)
  console.log('\n[e2e] Step 6: Adding private AI note...');
  const privateThread = await api('POST', `/tasks/${task.id}/threads`);
  await api('POST', `/tasks/threads/${privateThread.id}/comments`, {
    body: 'PRIVATE_NOTE_MARKER: This should not appear in export',
    isPrivate: true,
  });
  console.log('[e2e] Created private note');

  // Step 7: Negative approval test - try to approve without decision
  console.log('\n[e2e] Step 7: Testing negative approval (no decision)...');
  // First move task to review (allowed without decision)
  await api('PATCH', `/tasks/${task.id}/status`, { status: 'review' });
  // Try to approve without decision - should fail with 400
  const failedApproval = await api('PATCH', `/tasks/${task.id}/status`, { status: 'approved' }, true);
  assert.equal(failedApproval.ok, false, 'Approval without decision should fail');
  assert.equal(failedApproval.status, 400, 'Should return 400 for missing decision');
  assert(
    failedApproval.data.error.includes('Decision fields'),
    'Error should mention decision fields requirement'
  );
  console.log('[e2e] Negative approval test passed - correctly rejected');
  // Reset status back to draft for subsequent tests
  await api('PATCH', `/tasks/${task.id}/status`, { status: 'draft' });

  // Step 8: Update decision
  console.log('\n[e2e] Step 8: Updating decision...');
  const decision = await api('PUT', `/tasks/${task.id}/decision`, {
    summary: 'Add math utility functions for multiplication and division',
    rationale: 'These operations are commonly needed and will reduce code duplication',
    risks: 'Division by zero needs to be handled properly',
    rollback: 'Revert the commit and remove the new functions',
  });
  assert(decision.summary, 'Decision should have summary');
  console.log('[e2e] Decision updated');

  // Step 9: With decision filled, approval should now succeed
  console.log('\n[e2e] Step 9: Testing status transitions with decision...');
  const reviewTask = await api('PATCH', `/tasks/${task.id}/status`, { status: 'review' });
  assert.equal(reviewTask.status, 'review', 'Status should be review');

  const approvedTask = await api('PATCH', `/tasks/${task.id}/status`, { status: 'approved' });
  assert.equal(approvedTask.status, 'approved', 'Status should be approved');
  console.log('[e2e] Status transitions verified - approval succeeded with decision');

  // Step 10: Export PR draft
  console.log('\n[e2e] Step 10: Exporting PR draft...');
  const exportResult = await api('POST', `/tasks/${task.id}/export`);
  assert(exportResult.markdown, 'Export should have markdown');
  console.log('[e2e] Export generated, length:', exportResult.markdown.length);

  // Step 11: Verify export content
  console.log('\n[e2e] Step 11: Verifying export content...');
  const md = exportResult.markdown;

  // Decision fields should be present
  assert(md.includes('Add math utility functions'), 'Export should include summary');
  assert(md.includes('commonly needed'), 'Export should include rationale');
  assert(md.includes('Division by zero'), 'Export should include risks');
  assert(md.includes('Revert the commit'), 'Export should include rollback');

  // Anchor excerpt should be present
  assert(md.includes('src/utils.js'), 'Export should include anchored file path');
  assert(md.includes('multiply'), 'Export should include anchor excerpt content');

  // Private note should NOT be present
  assert(!md.includes('PRIVATE_NOTE_MARKER'), 'Export should NOT include private notes');

  console.log('[e2e] Export content verified');

  // Step 12: Verify export file exists
  console.log('\n[e2e] Step 12: Verifying export file...');
  const exportFilePath = join(PR_DRAFTS_DIR, `${task.id}.md`);
  assert(existsSync(exportFilePath), `Export file should exist at ${exportFilePath}`);
  const fileStat = statSync(exportFilePath);
  assert(fileStat.size > 0, 'Export file should not be empty');
  console.log('[e2e] Export file verified:', exportFilePath);

  console.log('\n=== All E2E Tests Passed ===\n');
}

async function main() {
  let exitCode = 0;

  try {
    await runTests();
  } catch (err) {
    console.error('\n[e2e] TEST FAILED:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    exitCode = 1;
  } finally {
    stopServer();
  }

  process.exit(exitCode);
}

main();
