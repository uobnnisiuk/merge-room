import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import type { CreateTaskRequest } from '../api/types';
import './TaskList.css';

export function TaskList() {
  const navigate = useNavigate();
  const { tasks, tasksLoading, tasksError, fetchTasks, createTask } = useTaskStore();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    repoPath: '',
    branchName: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const task = await createTask(formData);
      setShowCreate(false);
      setFormData({ title: '', description: '', repoPath: '', branchName: '' });
      navigate(`/task/${task.id}`);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="task-list-page">
      <header className="page-header">
        <h1>merge-room</h1>
        <p className="subtitle">Pre-PR workspace for code decisions</p>
      </header>

      <div className="actions">
        <button className="primary" onClick={() => setShowCreate(true)}>
          + New Task
        </button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Task</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Add user authentication"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="repoPath">Repository Path *</label>
                <input
                  id="repoPath"
                  type="text"
                  value={formData.repoPath}
                  onChange={(e) => setFormData({ ...formData, repoPath: e.target.value })}
                  placeholder="e.g., /Users/you/projects/myapp"
                  required
                />
                <span className="hint">Absolute path to local git repository</span>
              </div>

              <div className="form-group">
                <label htmlFor="branchName">Branch Name</label>
                <input
                  id="branchName"
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="e.g., feature/auth"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the changes..."
                  rows={3}
                />
              </div>

              {createError && <div className="error-message">{createError}</div>}

              <div className="form-actions">
                <button type="button" className="secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasksLoading && <div className="loading">Loading tasks...</div>}
      {tasksError && <div className="error-message">{tasksError}</div>}

      <div className="task-grid">
        {tasks.map((task) => (
          <div key={task.id} className="task-card" onClick={() => navigate(`/task/${task.id}`)}>
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`status-badge status-${task.status}`}>{task.status}</span>
            </div>
            {task.description && <p className="task-desc">{task.description}</p>}
            <div className="task-meta">
              <span className="mono">{task.branchName || 'no branch'}</span>
              <span className="date">{formatDate(task.updatedAt)}</span>
            </div>
          </div>
        ))}

        {!tasksLoading && tasks.length === 0 && (
          <div className="empty-state">
            <p>No tasks yet. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
