import { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import type { TaskDetail, TaskStatus, UpdateDecisionRequest } from '../api/types';
import './DecisionPanel.css';

interface DecisionPanelProps {
  taskId: string;
  task: TaskDetail;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'archived', label: 'Archived' },
];

export function DecisionPanel({ taskId, task }: DecisionPanelProps) {
  const { updateStatus, updateDecision } = useTaskStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [formData, setFormData] = useState<UpdateDecisionRequest>({
    summary: '',
    rationale: '',
    risks: '',
    rollback: '',
  });
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (task.decision) {
      setFormData({
        summary: task.decision.summary || '',
        rationale: task.decision.rationale || '',
        risks: task.decision.risks || '',
        rollback: task.decision.rollback || '',
      });
    }
  }, [task.decision]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setStatusError(null);
    try {
      await updateStatus(taskId, newStatus);
    } catch (err) {
      setStatusError((err as Error).message);
    }
  };

  const handleSaveDecision = async () => {
    setSaving(true);
    try {
      await updateDecision(taskId, formData);
    } catch (err) {
      alert('Failed to save: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const isComplete = !!(
    formData.summary &&
    formData.rationale &&
    formData.risks &&
    formData.rollback
  );

  return (
    <div className="decision-panel">
      <div className="decision-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <h3>Decision</h3>
        {isComplete && <span className="complete-badge">Complete</span>}
      </div>

      {isExpanded && (
        <div className="decision-content">
          <div className="status-section">
            <label>Status</label>
            <div className="status-buttons">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`status-btn ${task.status === opt.value ? 'active' : ''} status-${opt.value}`}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={opt.value === 'approved' && !isComplete}
                  title={
                    opt.value === 'approved' && !isComplete
                      ? 'Fill all decision fields to approve'
                      : ''
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {statusError && <div className="status-error">{statusError}</div>}
            {task.status !== 'approved' && !isComplete && (
              <div className="status-hint">
                Complete all fields below to enable Approved status
              </div>
            )}
          </div>

          <div className="decision-fields">
            <div className="field">
              <label htmlFor="summary">
                Summary <span className="required">*</span>
              </label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Brief summary of what this change does..."
                rows={2}
              />
            </div>

            <div className="field">
              <label htmlFor="rationale">
                Rationale <span className="required">*</span>
              </label>
              <textarea
                id="rationale"
                value={formData.rationale}
                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                placeholder="Why is this change needed? What problem does it solve?"
                rows={2}
              />
            </div>

            <div className="field">
              <label htmlFor="risks">
                Risks <span className="required">*</span>
              </label>
              <textarea
                id="risks"
                value={formData.risks}
                onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                placeholder="What could go wrong? What edge cases exist?"
                rows={2}
              />
            </div>

            <div className="field">
              <label htmlFor="rollback">
                Rollback Plan <span className="required">*</span>
              </label>
              <textarea
                id="rollback"
                value={formData.rollback}
                onChange={(e) => setFormData({ ...formData, rollback: e.target.value })}
                placeholder="How to revert if something goes wrong?"
                rows={2}
              />
            </div>

            <button
              className="primary save-btn"
              onClick={handleSaveDecision}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Decision'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
