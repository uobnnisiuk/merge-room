import { useMemo, useState } from 'react';
import type { TaskDetail, ThreadWithComments } from '../api/types';
import './ShareKitPanel.css';

interface ShareKitPanelProps {
  task: TaskDetail;
}

function getTaskUrl(taskId: string): string {
  return `${window.location.origin}/task/${taskId}`;
}

function getAgendaItems(threads: ThreadWithComments[]): string[] {
  const items: string[] = [];
  for (const thread of threads) {
    const firstPublic = thread.comments.find((comment) => !comment.isPrivate);
    if (!firstPublic) continue;
    const firstLine = firstPublic.body.split('\n').find((line) => line.trim().length > 0) || '';
    if (!firstLine.trim()) continue;
    const trimmed = firstLine.trim();
    items.push(trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed);
  }
  return items;
}

function buildDecisionLines(task: TaskDetail): string[] {
  const decision = task.decision;
  if (!decision) return [];
  const lines = [
    decision.summary ? `Summary: ${decision.summary}` : null,
    decision.rationale ? `Rationale: ${decision.rationale}` : null,
    decision.risks ? `Risks: ${decision.risks}` : null,
    decision.rollback ? `Rollback: ${decision.rollback}` : null,
  ].filter(Boolean) as string[];
  return lines.slice(0, 4);
}

function buildDraftPack(task: TaskDetail): string {
  const lines: string[] = [];
  lines.push(task.title);
  lines.push(`Task: ${getTaskUrl(task.id)}`);
  if (task.prUrl) {
    lines.push(`Diff viewer: ${task.prUrl}`);
  }
  const agendaItems = getAgendaItems(task.threads);
  lines.push('Agenda:');
  if (agendaItems.length === 0) {
    lines.push('- (no agenda yet)');
  } else {
    for (const item of agendaItems) {
      lines.push(`- ${item}`);
    }
  }
  lines.push('Rule: Code detail discussion in merge-room, not PR comments');
  return lines.join('\n');
}

function buildReadyPack(task: TaskDetail): string {
  const lines: string[] = [];
  lines.push(task.title);
  lines.push(`PR: ${task.prUrl || '(add PR URL)'}`);
  lines.push(`Task: ${getTaskUrl(task.id)}`);

  const decisionLines = buildDecisionLines(task);
  lines.push('Decision:');
  if (decisionLines.length === 0) {
    lines.push('- (pending)');
  } else {
    for (const line of decisionLines) {
      lines.push(`- ${line}`);
    }
  }

  const agendaItems = getAgendaItems(task.threads);
  if (agendaItems.length > 0) {
    lines.push('Agenda:');
    for (const item of agendaItems) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join('\n');
}

export function ShareKitPanel({ task }: ShareKitPanelProps) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const isDraft = task.status === 'draft';
  const packLabel = isDraft
    ? 'Meeting Pack (Draft)'
    : task.status === 'review'
    ? 'Ready Pack (Review)'
    : 'Ready Pack';
  const buttonLabel = isDraft ? 'Copy Meeting Pack (Draft)' : 'Copy Ready Pack';

  const packText = useMemo(() => {
    return isDraft ? buildDraftPack(task) : buildReadyPack(task);
  }, [task, isDraft]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(packText);
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  return (
    <div className="share-kit">
      <div className="share-kit-header">
        <h3>Share Kit</h3>
        <span className="share-kit-subtitle">
          {packLabel}
        </span>
      </div>
      <div className="share-kit-actions">
        <button className="primary" onClick={handleCopy}>
          {buttonLabel}
        </button>
        {copyState === 'success' && <span className="share-kit-toast">Copied!</span>}
        {copyState === 'error' && <span className="share-kit-toast error">Copy failed</span>}
      </div>
      <pre className="share-kit-preview mono">{packText}</pre>
      {!isDraft && (
        <div className="share-kit-hint">
          Once ready, request review in GitHub after pasting the PR description.
        </div>
      )}
    </div>
  );
}
