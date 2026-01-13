import { useState } from 'react';
import './ExportModal.css';

interface ExportModalProps {
  title: string;
  markdown: string;
  filePath: string | null;
  fileError: string | null;
  onClose: () => void;
}

export function ExportModal({ title, markdown, filePath, fileError, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy: ' + (err as Error).message);
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-actions">
          <button className="primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          {filePath ? (
            <span className="save-note save-success">
              Saved to docs/pr-drafts/
            </span>
          ) : fileError ? (
            <span className="save-note save-error">
              File save failed: {fileError}
            </span>
          ) : (
            <span className="save-note">
              Markdown generated (file not saved)
            </span>
          )}
        </div>

        <div className="export-preview">
          <pre className="markdown-content mono">{markdown}</pre>
        </div>
      </div>
    </div>
  );
}
