import { db } from './index.js';
import type { Decision, UpdateDecisionRequest } from './types.js';
import { touchTask } from './tasks.js';

export function getDecision(taskId: string): Decision | null {
  return db.prepare(`
    SELECT taskId, summary, rationale, risks, rollback, updatedAt
    FROM decisions WHERE taskId = ?
  `).get(taskId) as Decision | null;
}

export function updateDecision(taskId: string, data: UpdateDecisionRequest): Decision | null {
  const now = new Date().toISOString();

  // Build dynamic update
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.summary !== undefined) {
    fields.push('summary = ?');
    values.push(data.summary || null);
  }
  if (data.rationale !== undefined) {
    fields.push('rationale = ?');
    values.push(data.rationale || null);
  }
  if (data.risks !== undefined) {
    fields.push('risks = ?');
    values.push(data.risks || null);
  }
  if (data.rollback !== undefined) {
    fields.push('rollback = ?');
    values.push(data.rollback || null);
  }

  if (fields.length === 0) return getDecision(taskId);

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(taskId);

  db.prepare(`UPDATE decisions SET ${fields.join(', ')} WHERE taskId = ?`).run(...values);
  touchTask(taskId);

  return getDecision(taskId);
}

export function isDecisionComplete(decision: Decision | null): boolean {
  if (!decision) return false;
  return !!(decision.summary && decision.rationale && decision.risks && decision.rollback);
}
