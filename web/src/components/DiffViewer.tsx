import { useState, useCallback } from 'react';
import { parseDiff, extractExcerpt, type DiffFile, type DiffHunk } from '../utils/diffParser';
import { useTaskStore } from '../store/taskStore';
import type { Diff } from '../api/types';
import './DiffViewer.css';

interface DiffViewerProps {
  diff: Diff | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

interface Selection {
  file: DiffFile;
  fileIndex: number;
  hunkIndex: number;
  startLine: number;
  endLine: number;
}

export function DiffViewer({ diff, loading, error, onRefresh }: DiffViewerProps) {
  const { setAnchorSelection } = useTaskStore();
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ fileIndex: number; hunkIndex: number; line: number } | null>(null);

  const toggleFile = (index: number) => {
    const newCollapsed = new Set(collapsedFiles);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedFiles(newCollapsed);
  };

  const handleMouseDown = useCallback((fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => {
    setSelectionStart({ fileIndex, hunkIndex, line: lineIndex });
    setSelection({
      file,
      fileIndex,
      hunkIndex,
      startLine: lineIndex,
      endLine: lineIndex,
    });
  }, []);

  const handleMouseOver = useCallback((fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => {
    if (!selectionStart) return;
    if (selectionStart.fileIndex !== fileIndex || selectionStart.hunkIndex !== hunkIndex) return;

    const start = Math.min(selectionStart.line, lineIndex);
    const end = Math.max(selectionStart.line, lineIndex);

    setSelection({
      file,
      fileIndex,
      hunkIndex,
      startLine: start,
      endLine: end,
    });
  }, [selectionStart]);

  const handleMouseUp = useCallback(() => {
    setSelectionStart(null);
  }, []);

  const handleQuoteSelection = useCallback(() => {
    if (!selection) return;

    const excerpt = extractExcerpt(
      selection.file,
      selection.hunkIndex,
      selection.startLine,
      selection.endLine
    );

    setAnchorSelection({
      filePath: selection.file.newPath,
      hunkIndex: selection.hunkIndex,
      startLine: selection.startLine,
      endLine: selection.endLine,
      excerpt,
    });

    setSelection(null);
  }, [selection, setAnchorSelection]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setSelectionStart(null);
  }, []);

  if (loading && !diff) {
    return (
      <div className="diff-viewer-empty">
        <p>Loading diff...</p>
      </div>
    );
  }

  if (error && !diff) {
    return (
      <div className="diff-viewer-empty">
        <p className="error">{error}</p>
        <button className="primary" onClick={onRefresh}>
          Refresh Diff
        </button>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="diff-viewer-empty">
        <p>No diff loaded yet.</p>
        <button className="primary" onClick={onRefresh}>
          Fetch Diff
        </button>
      </div>
    );
  }

  const parsed = parseDiff(diff.diffText);

  if (parsed.files.length === 0) {
    return (
      <div className="diff-viewer-empty">
        <p>No changes detected in working tree.</p>
        <button className="secondary" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    );
  }

  const isLineSelected = (fileIndex: number, hunkIndex: number, lineIndex: number): boolean => {
    if (!selection) return false;
    return (
      selection.fileIndex === fileIndex &&
      selection.hunkIndex === hunkIndex &&
      lineIndex >= selection.startLine &&
      lineIndex <= selection.endLine
    );
  };

  return (
    <div className="diff-viewer" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {selection && (
        <div className="selection-toolbar">
          <span>
            {selection.endLine - selection.startLine + 1} line(s) selected in {selection.file.newPath}
          </span>
          <div className="selection-actions">
            <button className="primary" onClick={handleQuoteSelection}>
              Quote in Comment
            </button>
            <button className="secondary" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="diff-meta">
        <span>
          {parsed.files.length} file(s) changed
        </span>
        <span className="diff-time">
          Fetched: {new Date(diff.createdAt).toLocaleTimeString()}
        </span>
      </div>

      {parsed.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="diff-section">
          {section.title !== 'Changes' && (
            <div className="section-header">{section.title}</div>
          )}
          {section.files.map((file, localFileIndex) => {
            const globalFileIndex = parsed.sections
              .slice(0, sectionIndex)
              .reduce((acc, s) => acc + s.files.length, 0) + localFileIndex;

            return (
              <FileView
                key={globalFileIndex}
                file={file}
                fileIndex={globalFileIndex}
                isCollapsed={collapsedFiles.has(globalFileIndex)}
                onToggle={() => toggleFile(globalFileIndex)}
                onMouseDown={handleMouseDown}
                onMouseOver={handleMouseOver}
                isLineSelected={isLineSelected}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface FileViewProps {
  file: DiffFile;
  fileIndex: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onMouseDown: (fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => void;
  onMouseOver: (fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => void;
  isLineSelected: (fileIndex: number, hunkIndex: number, lineIndex: number) => boolean;
}

function FileView({
  file,
  fileIndex,
  isCollapsed,
  onToggle,
  onMouseDown,
  onMouseOver,
  isLineSelected,
}: FileViewProps) {
  const getFileStatus = () => {
    if (file.isNew) return 'new';
    if (file.isDeleted) return 'deleted';
    if (file.isBinary) return 'binary';
    return 'modified';
  };

  return (
    <div className="diff-file">
      <div className="file-header" onClick={onToggle}>
        <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
        <span className={`file-status file-status-${getFileStatus()}`}>
          {getFileStatus()}
        </span>
        <span className="file-path mono">{file.newPath}</span>
      </div>

      {!isCollapsed && (
        <div className="file-content">
          {file.hunks.map((hunk, hunkIndex) => (
            <HunkView
              key={hunkIndex}
              hunk={hunk}
              hunkIndex={hunkIndex}
              fileIndex={fileIndex}
              file={file}
              onMouseDown={onMouseDown}
              onMouseOver={onMouseOver}
              isLineSelected={isLineSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HunkViewProps {
  hunk: DiffHunk;
  hunkIndex: number;
  fileIndex: number;
  file: DiffFile;
  onMouseDown: (fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => void;
  onMouseOver: (fileIndex: number, file: DiffFile, hunkIndex: number, lineIndex: number) => void;
  isLineSelected: (fileIndex: number, hunkIndex: number, lineIndex: number) => boolean;
}

function HunkView({
  hunk,
  hunkIndex,
  fileIndex,
  file,
  onMouseDown,
  onMouseOver,
  isLineSelected,
}: HunkViewProps) {
  return (
    <div className="diff-hunk">
      {hunk.lines.map((line, lineIndex) => {
        const selected = isLineSelected(fileIndex, hunkIndex, lineIndex);

        return (
          <div
            key={lineIndex}
            className={`diff-line diff-line-${line.type} ${selected ? 'selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              if (line.type !== 'hunk' && line.type !== 'info') {
                onMouseDown(fileIndex, file, hunkIndex, lineIndex);
              }
            }}
            onMouseOver={() => {
              if (line.type !== 'hunk' && line.type !== 'info') {
                onMouseOver(fileIndex, file, hunkIndex, lineIndex);
              }
            }}
          >
            <span className="line-number">
              {line.oldLineNumber ?? ''}
            </span>
            <span className="line-number">
              {line.newLineNumber ?? ''}
            </span>
            <span className="line-prefix">
              {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
            </span>
            <span className="line-content mono">{line.content}</span>
          </div>
        );
      })}
    </div>
  );
}
