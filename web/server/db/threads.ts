import { db, generateId } from './index.js';
import type { Thread, Anchor, CreateCommentRequest, CommentWithAnchor, ThreadWithComments } from './types.js';
import { touchTask } from './tasks.js';

export function createThread(taskId: string): Thread {
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO threads (id, taskId, createdAt) VALUES (?, ?, ?)`).run(id, taskId, now);
  touchTask(taskId);

  return { id, taskId, createdAt: now };
}

export function getThread(id: string): ThreadWithComments | null {
  const thread = db.prepare(`
    SELECT id, taskId, createdAt FROM threads WHERE id = ?
  `).get(id) as Thread | undefined;

  if (!thread) return null;

  const comments = db.prepare(`
    SELECT id, threadId, body, isPrivate, createdAt FROM comments WHERE threadId = ? ORDER BY createdAt ASC
  `).all(id) as CommentWithAnchor[];

  for (const comment of comments) {
    comment.isPrivate = Boolean(comment.isPrivate);
    const anchor = db.prepare(`
      SELECT id, commentId, filePath, hunkIndex, startLine, endLine, excerpt
      FROM anchors WHERE commentId = ?
    `).get(comment.id) as Anchor | undefined;
    comment.anchor = anchor || null;
  }

  return { ...thread, comments };
}

export function addComment(threadId: string, data: CreateCommentRequest): CommentWithAnchor {
  const commentId = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO comments (id, threadId, body, isPrivate, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(commentId, threadId, data.body, data.isPrivate ? 1 : 0, now);

  let anchor: Anchor | null = null;

  if (data.anchor) {
    const anchorId = generateId();
    db.prepare(`
      INSERT INTO anchors (id, commentId, filePath, hunkIndex, startLine, endLine, excerpt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      anchorId,
      commentId,
      data.anchor.filePath,
      data.anchor.hunkIndex,
      data.anchor.startLine,
      data.anchor.endLine,
      data.anchor.excerpt
    );
    anchor = { id: anchorId, commentId, ...data.anchor };
  }

  // Touch parent task
  const thread = db.prepare('SELECT taskId FROM threads WHERE id = ?').get(threadId) as { taskId: string } | undefined;
  if (thread) {
    touchTask(thread.taskId);
  }

  return {
    id: commentId,
    threadId,
    body: data.body,
    isPrivate: data.isPrivate || false,
    createdAt: now,
    anchor,
  };
}
