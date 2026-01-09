import { useState } from 'react';
import './ExportModal.css';

interface ExportModalProps {
  markdown: string;
  onClose: () => void;
}

export function ExportModal({ markdown, onClose }: ExportModalProps) {
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
          <h2>PR Draft Export</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-actions">
          <button className="primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <span className="save-note">
            Also saved to docs/pr-drafts/
          </span>
        </div>

        <div className="export-preview">
          <pre className="markdown-content mono">{markdown}</pre>
        </div>
      </div>
    </div>
  );
}
