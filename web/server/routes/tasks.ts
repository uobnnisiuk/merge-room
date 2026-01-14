import { Router, Request, Response } from 'express';
import * as tasksDb from '../db/tasks.js';
import * as diffsDb from '../db/diffs.js';
import * as threadsDb from '../db/threads.js';
import * as decisionsDb from '../db/decisions.js';
import * as anchorsDb from '../db/anchors.js';
import { getWorkingTreeDiff, isGitRepo } from '../services/git.js';
import { exportPRDraft, resolvePublicBaseUrl } from '../services/export.js';
import type { CreateTaskRequest, CreateCommentRequest, UpdateDecisionRequest, TaskStatus } from '../db/types.js';

const router = Router();

// GET /api/tasks - List all tasks
router.get('/', (_req: Request, res: Response) => {
  try {
    const tasks = tasksDb.getAllTasks();
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req: Request, res: Response) => {
  try {
    const data = req.body as CreateTaskRequest;

    if (!data.title || !data.repoPath) {
      res.status(400).json({ error: 'title and repoPath are required' });
      return;
    }

    // Validate repo path
    if (!isGitRepo(data.repoPath)) {
      res.status(400).json({ error: `Invalid git repository: ${data.repoPath}` });
      return;
    }

    const task = tasksDb.createTask(data);
    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/tasks/:id - Get task detail
router.get('/:id', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskDetail(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks/:id/refresh-diff - Refresh diff from git
router.post('/:id/refresh-diff', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const result = getWorkingTreeDiff(task.repoPath);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    const diff = diffsDb.saveDiff(task.id, result.output!);

    // Check and update staleness for existing anchors
    const staleCount = anchorsDb.checkAndUpdateStaleness(task.id, result.output!);
    if (staleCount > 0) {
      console.log(`[refresh-diff] ${staleCount} anchor(s) marked as stale for task ${task.id}`);
    }

    res.json(diff);
  } catch (err) {
    console.error('Error refreshing diff:', err);
    res.status(500).json({ error: 'Failed to refresh diff' });
  }
});

// GET /api/tasks/:id/diff - Get latest diff
router.get('/:id/diff', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const diff = diffsDb.getLatestDiff(task.id);
    if (!diff) {
      res.status(404).json({ error: 'No diff available. Refresh to fetch.' });
      return;
    }

    res.json(diff);
  } catch (err) {
    console.error('Error fetching diff:', err);
    res.status(500).json({ error: 'Failed to fetch diff' });
  }
});

// POST /api/tasks/:id/threads - Create new thread
router.post('/:id/threads', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const thread = threadsDb.createThread(task.id);
    res.status(201).json(thread);
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// POST /api/threads/:id/comments - Add comment to thread
router.post('/threads/:id/comments', (req: Request, res: Response) => {
  try {
    const thread = threadsDb.getThread(req.params.id);
    if (!thread) {
      res.status(404).json({ error: 'Thread not found' });
      return;
    }

    const data = req.body as CreateCommentRequest;
    if (!data.body) {
      res.status(400).json({ error: 'body is required' });
      return;
    }

    const comment = threadsDb.addComment(thread.id, data);
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PATCH /api/tasks/:id - Update task fields
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { prUrl } = req.body as { prUrl?: string | null };
    if (prUrl === undefined) {
      res.status(400).json({ error: 'prUrl is required' });
      return;
    }

    if (prUrl !== null && typeof prUrl !== 'string') {
      res.status(400).json({ error: 'prUrl must be a string or null' });
      return;
    }

    const normalizedPrUrl = typeof prUrl === 'string' ? prUrl.trim() || null : null;
    const updated = tasksDb.updateTaskPrUrl(task.id, normalizedPrUrl);
    res.json(updated);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { status } = req.body as { status: TaskStatus };
    const validStatuses: TaskStatus[] = ['draft', 'review', 'approved', 'archived'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    // If moving to approved, check decision completeness
    if (status === 'approved') {
      const decision = decisionsDb.getDecision(task.id);
      if (!decisionsDb.isDecisionComplete(decision)) {
        res.status(400).json({
          error: 'Cannot approve: Decision fields (summary, rationale, risks, rollback) must be filled',
        });
        return;
      }
    }

    const updated = tasksDb.updateTaskStatus(task.id, status);
    res.json(updated);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PUT /api/tasks/:id/decision - Update decision
router.put('/:id/decision', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const data = req.body as UpdateDecisionRequest;
    const decision = decisionsDb.updateDecision(task.id, data);
    res.json(decision);
  } catch (err) {
    console.error('Error updating decision:', err);
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

// POST /api/tasks/:id/export - Export PR draft
router.post('/:id/export', (req: Request, res: Response) => {
  try {
    const task = tasksDb.getTaskDetail(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { clientBaseUrl } = req.body as { clientBaseUrl?: string };
    const forwardedProto = req.headers['x-forwarded-proto'];
    const forwardedHost = req.headers['x-forwarded-host'];
    const protocol = Array.isArray(forwardedProto)
      ? forwardedProto[0]
      : forwardedProto?.split(',')[0] || req.protocol;
    const host = Array.isArray(forwardedHost)
      ? forwardedHost[0]
      : forwardedHost?.split(',')[0] || req.headers.host;
    const requestBaseUrl = host ? `${protocol}://${host}` : null;
    const publicBaseUrl = resolvePublicBaseUrl({
      envBaseUrl: process.env.PUBLIC_BASE_URL,
      clientBaseUrl,
      requestBaseUrl,
    });

    const result = exportPRDraft(task, { publicBaseUrl });
    res.json(result);
  } catch (err) {
    console.error('Error exporting:', err);
    res.status(500).json({ error: 'Failed to export PR draft' });
  }
});

export default router;
