import { db, generateId } from './index.js';
import type { Task, TaskStatus, CreateTaskRequest, TaskDetail, ThreadWithComments, CommentWithAnchor, Anchor, Decision } from './types.js';

export function getAllTasks(): Task[] {
  return db.prepare(`
    SELECT id, title, description, repoPath, branchName, status, createdAt, updatedAt
    FROM tasks
    ORDER BY updatedAt DESC
  `).all() as Task[];
}

export function getTaskById(id: string): Task | null {
  return db.prepare(`
    SELECT id, title, description, repoPath, branchName, status, createdAt, updatedAt
    FROM tasks
    WHERE id = ?
  `).get(id) as Task | null;
}

export function getTaskDetail(id: string): TaskDetail | null {
  const task = getTaskById(id);
  if (!task) return null;

  // Get threads with comments and anchors
  const threads = db.prepare(`
    SELECT id, taskId, createdAt FROM threads WHERE taskId = ? ORDER BY createdAt ASC
  `).all(id) as ThreadWithComments[];

  for (const thread of threads) {
    const comments = db.prepare(`
      SELECT id, threadId, body, isPrivate, createdAt FROM comments WHERE threadId = ? ORDER BY createdAt ASC
    `).all(thread.id) as CommentWithAnchor[];

    for (const comment of comments) {
      comment.isPrivate = Boolean(comment.isPrivate);
      const anchor = db.prepare(`
        SELECT id, commentId, filePath, hunkIndex, startLine, endLine, excerpt
        FROM anchors WHERE commentId = ?
      `).get(comment.id) as Anchor | undefined;
      comment.anchor = anchor || null;
    }
    thread.comments = comments;
  }

  // Get decision
  const decision = db.prepare(`
    SELECT taskId, summary, rationale, risks, rollback, updatedAt
    FROM decisions WHERE taskId = ?
  `).get(id) as Decision | null;

  return { ...task, threads, decision };
}

export function createTask(data: CreateTaskRequest): Task {
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tasks (id, title, description, repoPath, branchName, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(id, data.title, data.description || null, data.repoPath, data.branchName || null, now, now);

  // Initialize empty decision
  db.prepare(`
    INSERT INTO decisions (taskId, updatedAt) VALUES (?, ?)
  `).run(id, now);

  return getTaskById(id)!;
}

export function updateTaskStatus(id: string, status: TaskStatus): Task | null {
  const now = new Date().toISOString();
  db.prepare(`UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?`).run(status, now, id);
  return getTaskById(id);
}

export function touchTask(id: string): void {
  const now = new Date().toISOString();
  db.prepare(`UPDATE tasks SET updatedAt = ? WHERE id = ?`).run(now, id);
}
