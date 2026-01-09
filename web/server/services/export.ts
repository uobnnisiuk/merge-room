import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TaskDetail, CommentWithAnchor } from '../db/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PR_DRAFTS_DIR = path.resolve(__dirname, '../../../docs/pr-drafts');

export interface ExportResult {
  markdown: string;
  filePath: string;
}

/**
 * Generate PR draft markdown from task detail
 */
export function generatePRDraft(task: TaskDetail): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${task.title}`);
  lines.push('');

  // Description
  if (task.description) {
    lines.push('## Overview');
    lines.push('');
    lines.push(task.description);
    lines.push('');
  }

  // Decision section
  if (task.decision) {
    lines.push('## Decision');
    lines.push('');
    lines.push(`**Status:** ${task.status.toUpperCase()}`);
    lines.push('');

    if (task.decision.summary) {
      lines.push('### Summary');
      lines.push('');
      lines.push(task.decision.summary);
      lines.push('');
    }

    if (task.decision.rationale) {
      lines.push('### Rationale');
      lines.push('');
      lines.push(task.decision.rationale);
      lines.push('');
    }

    if (task.decision.risks) {
      lines.push('### Risks');
      lines.push('');
      lines.push(task.decision.risks);
      lines.push('');
    }

    if (task.decision.rollback) {
      lines.push('### Rollback Plan');
      lines.push('');
      lines.push(task.decision.rollback);
      lines.push('');
    }
  }

  // Collect all public comments with anchors (max 10)
  const publicComments: CommentWithAnchor[] = [];
  for (const thread of task.threads) {
    for (const comment of thread.comments) {
      if (!comment.isPrivate) {
        publicComments.push(comment);
      }
    }
  }

  // Sort by creation time and take first 10
  publicComments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const importantComments = publicComments.slice(0, 10);

  // Comments with anchors first
  const withAnchors = importantComments.filter(c => c.anchor);
  const withoutAnchors = importantComments.filter(c => !c.anchor);

  if (withAnchors.length > 0) {
    lines.push('## Code Discussion');
    lines.push('');

    for (const comment of withAnchors) {
      if (comment.anchor) {
        lines.push(`### ${comment.anchor.filePath} (lines ${comment.anchor.startLine}-${comment.anchor.endLine})`);
        lines.push('');
        lines.push('```diff');
        lines.push(comment.anchor.excerpt);
        lines.push('```');
        lines.push('');
        lines.push(comment.body);
        lines.push('');
      }
    }
  }

  if (withoutAnchors.length > 0) {
    lines.push('## Discussion Notes');
    lines.push('');

    for (const comment of withoutAnchors) {
      lines.push(`- ${comment.body}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`*Generated from merge-room task: ${task.id}*`);
  lines.push(`*Branch: ${task.branchName || 'N/A'}*`);
  lines.push(`*Repository: ${task.repoPath}*`);

  return lines.join('\n');
}

/**
 * Export task to markdown file
 */
export function exportPRDraft(task: TaskDetail): ExportResult {
  const markdown = generatePRDraft(task);

  // Ensure directory exists
  if (!fs.existsSync(PR_DRAFTS_DIR)) {
    fs.mkdirSync(PR_DRAFTS_DIR, { recursive: true });
  }

  const fileName = `${task.id}.md`;
  const filePath = path.join(PR_DRAFTS_DIR, fileName);

  fs.writeFileSync(filePath, markdown, 'utf-8');

  return { markdown, filePath };
}
