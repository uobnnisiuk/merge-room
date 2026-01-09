import { db, generateId } from './index.js';
import type { Diff } from './types.js';

export function getLatestDiff(taskId: string): Diff | null {
  return db.prepare(`
    SELECT id, taskId, diffText, createdAt
    FROM diffs
    WHERE taskId = ?
    ORDER BY createdAt DESC
    LIMIT 1
  `).get(taskId) as Diff | null;
}

export function saveDiff(taskId: string, diffText: string): Diff {
  const id = generateId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO diffs (id, taskId, diffText, createdAt)
    VALUES (?, ?, ?, ?)
  `).run(id, taskId, diffText, now);

  return { id, taskId, diffText, createdAt: now };
}

export function getAllDiffs(taskId: string): Diff[] {
  return db.prepare(`
    SELECT id, taskId, diffText, createdAt
    FROM diffs
    WHERE taskId = ?
    ORDER BY createdAt DESC
  `).all(taskId) as Diff[];
}
