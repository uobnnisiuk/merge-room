import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/taskStore';
import { DiffViewer } from '../components/DiffViewer';
import { ThreadPanel } from '../components/ThreadPanel';
import { DecisionPanel } from '../components/DecisionPanel';
import { ExportModal } from '../components/ExportModal';
import { ShareKitPanel } from '../components/ShareKitPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
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
    updateTaskPrUrl,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<'threads' | 'private'>('threads');
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [prUrlInput, setPrUrlInput] = useState('');
  const [savingPrUrl, setSavingPrUrl] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskDetail(id);
      fetchDiff(id);
    }
    return () => clearCurrentTask();
  }, [id, fetchTaskDetail, fetchDiff, clearCurrentTask]);

  useEffect(() => {
    setPrUrlInput(currentTask?.prUrl || '');
  }, [currentTask?.prUrl]);

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

  const handleSavePrUrl = async () => {
    if (!currentTask) return;
    setSavingPrUrl(true);
    try {
      await updateTaskPrUrl(currentTask.id, prUrlInput.trim() || null);
    } catch (err) {
      alert('Failed to save PR URL: ' + (err as Error).message);
    } finally {
      setSavingPrUrl(false);
    }
  };

  const handleOpenPr = () => {
    const url = prUrlInput.trim();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
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

  const exportLabel =
    currentTask.status === 'draft'
      ? 'Preview export'
      : currentTask.status === 'review'
      ? 'Export PR description'
      : 'Export PR description';

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
            {exporting ? 'Exporting...' : exportLabel}
          </button>
        </div>
      </header>

      <div className="workspace-content">
        <div className="left-pane">
          <ErrorBoundary
            fallbackTitle="Diff parsing error"
            rawContent={diff?.diffText}
            key={diff?.id}
          >
            <DiffViewer
              diff={diff}
              loading={diffLoading}
              error={diffError}
              onRefresh={handleRefreshDiff}
            />
          </ErrorBoundary>
        </div>

        <div className="right-pane">
          <div className="phase-banner">
            <div className="phase-title">
              {currentTask.status === 'draft' ? 'Diff Mirror / Discussion' : 'Ready / Exit'}
            </div>
            <div className="phase-text">
              {currentTask.status === 'draft'
                ? 'PR is for diff viewing only. Discuss in merge-room, not PR comments.'
                : 'PR description is the ledger. Paste export and request review when ready.'}
            </div>
          </div>

          <div className="pr-url-panel">
            <label htmlFor="pr-url">PR URL</label>
            <div className="pr-url-actions">
              <input
                id="pr-url"
                type="url"
                value={prUrlInput}
                onChange={(event) => setPrUrlInput(event.target.value)}
                placeholder="https://github.com/org/repo/pull/123"
              />
              <button
                className="secondary"
                onClick={handleSavePrUrl}
                disabled={savingPrUrl || prUrlInput.trim() === (currentTask.prUrl || '')}
              >
                {savingPrUrl ? 'Saving...' : 'Save'}
              </button>
              <button
                className="secondary"
                onClick={handleOpenPr}
                disabled={!prUrlInput.trim()}
              >
                Open PR
              </button>
            </div>
          </div>

          <ShareKitPanel task={currentTask} />

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
          title={currentTask.status === 'draft' ? 'Preview export' : 'PR description export'}
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
