import { useMemo, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { parseDiff, extractExcerpt } from '../utils/diffParser';
import type { ThreadWithComments } from '../api/types';
import './ThreadPanel.css';

interface ThreadPanelProps {
  taskId: string;
  threads: ThreadWithComments[];
  isPrivateMode: boolean;
}

export function ThreadPanel({ taskId, threads, isPrivateMode }: ThreadPanelProps) {
  const { createThreadWithComment, addComment, anchorSelection, setAnchorSelection, diff } = useTaskStore();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parsedDiff = useMemo(() => {
    if (!diff?.diffText) return null;
    return parseDiff(diff.diffText);
  }, [diff?.id, diff?.diffText]);

  const normalizeExcerpt = (value: string) => value.trim().replace(/\r\n/g, '\n');

  const isAnchorStale = (anchor: { filePath: string; hunkIndex: number; startLine: number; endLine: number; excerpt: string; }) => {
    if (!parsedDiff) return false;
    const file = parsedDiff.files.find((diffFile) =>
      diffFile.newPath === anchor.filePath || diffFile.oldPath === anchor.filePath
    );
    if (!file) return true;
    const currentExcerpt = extractExcerpt(file, anchor.hunkIndex, anchor.startLine, anchor.endLine);
    if (!currentExcerpt) return true;
    return normalizeExcerpt(currentExcerpt) !== normalizeExcerpt(anchor.excerpt);
  };

  // Filter threads based on mode
  const filteredThreads = threads.filter((thread) =>
    isPrivateMode
      ? thread.comments.some((c) => c.isPrivate)
      : thread.comments.some((c) => !c.isPrivate)
  );

  const handleCreateThread = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await createThreadWithComment(taskId, newComment, isPrivateMode, anchorSelection ?? undefined);
      setNewComment('');
    } catch (err) {
      alert('Failed to create comment: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (threadId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await addComment(threadId, replyText, isPrivateMode);
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      alert('Failed to add reply: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="thread-panel">
      <div className="new-comment-box">
        {anchorSelection && (
          <div className="anchor-preview">
            <div className="anchor-header">
              <span className="mono">{anchorSelection.filePath}</span>
              <span className="anchor-lines">
                lines {anchorSelection.startLine}-{anchorSelection.endLine}
              </span>
              <button className="clear-anchor" onClick={() => setAnchorSelection(null)}>
                ×
              </button>
            </div>
            <pre className="anchor-excerpt mono">{anchorSelection.excerpt}</pre>
          </div>
        )}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            isPrivateMode
              ? 'Add private AI notes (not included in export)...'
              : anchorSelection
              ? 'Comment on selected code...'
              : 'Start a new discussion...'
          }
          rows={3}
        />
        <div className="comment-actions">
          <span className="mode-indicator">
            {isPrivateMode ? '🔒 Private' : '💬 Public'}
          </span>
          <button
            className="primary"
            onClick={handleCreateThread}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      <div className="threads-list">
        {filteredThreads.length === 0 ? (
          <div className="empty-threads">
            <p>
              {isPrivateMode
                ? 'No private notes yet. Add notes here that will not be exported.'
                : 'No discussion threads yet. Select code or start a general discussion.'}
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div key={thread.id} className="thread">
              {thread.comments
                .filter((c) => (isPrivateMode ? c.isPrivate : !c.isPrivate))
                .map((comment, index) => (
                  <div key={comment.id} className={`comment ${index === 0 ? 'first' : ''}`}>
                    {index === 0 && comment.anchor && (
                      <div className="comment-anchor">
                        <div className="comment-anchor-header">
                          <span className="mono">{comment.anchor.filePath}</span>
                          <span className="anchor-range">
                            L{comment.anchor.startLine}-{comment.anchor.endLine}
                          </span>
                          {isAnchorStale(comment.anchor) && (
                            <span
                              className="stale-label"
                              title="Diff refreshed; this reference may be outdated."
                            >
                              STALE
                            </span>
                          )}
                        </div>
                        <pre className="anchor-code mono">{comment.anchor.excerpt}</pre>
                      </div>
                    )}
                    <div className="comment-body">{comment.body}</div>
                    <div className="comment-meta">
                      <span className="comment-time">{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                ))}

              {replyingTo === thread.id ? (
                <div className="reply-box">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    autoFocus
                  />
                  <div className="reply-actions">
                    <button className="secondary" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </button>
                    <button
                      className="primary"
                      onClick={() => handleReply(thread.id)}
                      disabled={submitting || !replyText.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button className="reply-btn" onClick={() => setReplyingTo(thread.id)}>
                  Reply
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
