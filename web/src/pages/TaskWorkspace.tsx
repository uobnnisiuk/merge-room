import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { DiffViewer } from '../components/DiffViewer';
import { ThreadPanel } from '../components/ThreadPanel';
import { DecisionPanel } from '../components/DecisionPanel';
import { ExportModal } from '../components/ExportModal';
import './TaskWorkspace.css';

export function TaskWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTask,
    currentTaskLoading,
    currentTaskError,
    fetchTaskDetail,
    clearCurrentTask,
    diff,
    diffLoading,
    diffError,
    fetchDiff,
    refreshDiff,
    exportMarkdown,
    exportFilePath,
    exportFileError,
    exportPRDraft,
    clearExport,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<'threads' | 'private'>('threads');
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskDetail(id);
      fetchDiff(id);
    }
    return () => clearCurrentTask();
  }, [id, fetchTaskDetail, fetchDiff, clearCurrentTask]);

  const handleRefreshDiff = async () => {
    if (id) {
      await refreshDiff(id);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    setExporting(true);
    try {
      await exportPRDraft(id);
      setShowExport(true);
    } catch (err) {
      alert('Export failed: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  if (currentTaskLoading) {
    return <div className="workspace-loading">Loading task...</div>;
  }

  if (currentTaskError) {
    return (
      <div className="workspace-error">
        <p>{currentTaskError}</p>
        <button className="secondary" onClick={() => navigate('/')}>
          Back to Tasks
        </button>
      </div>
    );
  }

  if (!currentTask) {
    return null;
  }

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className="task-info">
            <h1>{currentTask.title}</h1>
            <div className="task-meta">
              <span className={`status-badge status-${currentTask.status}`}>
                {currentTask.status}
              </span>
              <span className="mono">{currentTask.branchName || 'no branch'}</span>
              <span className="repo-path" title={currentTask.repoPath}>
                {currentTask.repoPath}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={handleRefreshDiff} disabled={diffLoading}>
            {diffLoading ? 'Refreshing...' : 'Refresh Diff'}
          </button>
          <button className="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export PR Draft'}
          </button>
        </div>
      </header>

      <div className="workspace-content">
        <div className="left-pane">
          <DiffViewer
            diff={diff}
            loading={diffLoading}
            error={diffError}
            onRefresh={handleRefreshDiff}
          />
        </div>

        <div className="right-pane">
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'threads' ? 'active' : ''}`}
              onClick={() => setActiveTab('threads')}
            >
              Threads
            </button>
            <button
              className={`tab ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Private AI Notes
            </button>
          </div>

          <div className="tab-content">
            <ThreadPanel
              taskId={currentTask.id}
              threads={currentTask.threads}
              isPrivateMode={activeTab === 'private'}
            />
          </div>

          <DecisionPanel taskId={currentTask.id} task={currentTask} />
        </div>
      </div>

      {showExport && exportMarkdown && (
        <ExportModal
          markdown={exportMarkdown}
          filePath={exportFilePath}
          fileError={exportFileError}
          onClose={() => {
            setShowExport(false);
            clearExport();
          }}
        />
      )}
    </div>
  );
}
