import { db } from './index.js';
import type { Anchor } from './types.js';

// Minimum excerpt length for reliable staleness detection
// Shorter excerpts are considered stale (too likely to match by coincidence)
const MIN_EXCERPT_LENGTH = 20;

/**
 * Normalize excerpt for comparison: trim whitespace, normalize line endings
 */
function normalizeExcerpt(excerpt: string): string {
  return excerpt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Check if an excerpt exists in the diff text
 */
function excerptExistsInDiff(excerpt: string, diffText: string): boolean {
  const normalizedExcerpt = normalizeExcerpt(excerpt);
  const normalizedDiff = normalizeExcerpt(diffText);

  // If excerpt is too short, we can't reliably detect staleness
  // Treat as stale to be safe
  if (normalizedExcerpt.length < MIN_EXCERPT_LENGTH) {
    return false;
  }

  return normalizedDiff.includes(normalizedExcerpt);
}

/**
 * Get all anchors for a task (via threads -> comments -> anchors)
 */
export function getAnchorsForTask(taskId: string): Anchor[] {
  const anchors = db.prepare(`
    SELECT a.id, a.commentId, a.filePath, a.hunkIndex, a.startLine, a.endLine, a.excerpt, a.stale
    FROM anchors a
    JOIN comments c ON a.commentId = c.id
    JOIN threads t ON c.threadId = t.id
    WHERE t.taskId = ?
  `).all(taskId) as Anchor[];

  return anchors.map(a => ({
    ...a,
    stale: Boolean(a.stale),
  }));
}

/**
 * Update stale status for a single anchor
 */
export function updateAnchorStale(anchorId: string, stale: boolean): void {
  db.prepare('UPDATE anchors SET stale = ? WHERE id = ?').run(stale ? 1 : 0, anchorId);
}

/**
 * Check and update staleness for all anchors of a task against new diff text
 * Returns the number of anchors marked as stale
 */
export function checkAndUpdateStaleness(taskId: string, diffText: string): number {
  const anchors = getAnchorsForTask(taskId);
  let staleCount = 0;

  for (const anchor of anchors) {
    const isStale = !excerptExistsInDiff(anchor.excerpt, diffText);

    if (isStale !== anchor.stale) {
      updateAnchorStale(anchor.id, isStale);
    }

    if (isStale) {
      staleCount++;
    }
  }

  return staleCount;
}
