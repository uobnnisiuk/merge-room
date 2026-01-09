/**
 * Parses unified diff format into structured data
 */

export interface DiffLine {
  type: 'context' | 'add' | 'del' | 'header' | 'hunk' | 'info';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  startOld: number;
  countOld: number;
  startNew: number;
  countNew: number;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
  isNew: boolean;
  isDeleted: boolean;
  isBinary: boolean;
}

export interface ParsedDiff {
  files: DiffFile[];
  sections: DiffSection[];
}

export interface DiffSection {
  title: string;
  files: DiffFile[];
}

const FILE_HEADER_REGEX = /^diff --git a\/(.+) b\/(.+)$/;
const OLD_FILE_REGEX = /^--- (?:a\/)?(.+)$/;
const NEW_FILE_REGEX = /^\+\+\+ (?:b\/)?(.+)$/;
const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
const SECTION_HEADER_REGEX = /^# (.+)$/;

export function parseDiff(diffText: string): ParsedDiff {
  const lines = diffText.split('\n');
  const sections: DiffSection[] = [];
  let currentSection: DiffSection = { title: 'Changes', files: [] };
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section header (e.g., "# Staged Changes")
    const sectionMatch = line.match(SECTION_HEADER_REGEX);
    if (sectionMatch) {
      if (currentFile) {
        if (currentHunk) currentFile.hunks.push(currentHunk);
        currentSection.files.push(currentFile);
      }
      if (currentSection.files.length > 0 || sections.length === 0) {
        sections.push(currentSection);
      }
      currentSection = { title: sectionMatch[1], files: [] };
      currentFile = null;
      currentHunk = null;
      continue;
    }

    // Untracked file indicator
    if (line.startsWith('? ')) {
      const filePath = line.slice(2);
      if (currentFile) {
        if (currentHunk) currentFile.hunks.push(currentHunk);
        currentSection.files.push(currentFile);
      }
      currentFile = {
        oldPath: filePath,
        newPath: filePath,
        hunks: [{
          header: 'Untracked file',
          startOld: 0,
          countOld: 0,
          startNew: 0,
          countNew: 0,
          lines: [{ type: 'info', content: `Untracked: ${filePath}` }],
        }],
        isNew: true,
        isDeleted: false,
        isBinary: false,
      };
      currentSection.files.push(currentFile);
      currentFile = null;
      currentHunk = null;
      continue;
    }

    // File header
    const fileMatch = line.match(FILE_HEADER_REGEX);
    if (fileMatch) {
      if (currentFile) {
        if (currentHunk) currentFile.hunks.push(currentHunk);
        currentSection.files.push(currentFile);
      }
      currentFile = {
        oldPath: fileMatch[1],
        newPath: fileMatch[2],
        hunks: [],
        isNew: false,
        isDeleted: false,
        isBinary: false,
      };
      currentHunk = null;
      continue;
    }

    // Old file path
    const oldMatch = line.match(OLD_FILE_REGEX);
    if (oldMatch && currentFile) {
      if (oldMatch[1] === '/dev/null') {
        currentFile.isNew = true;
      }
      continue;
    }

    // New file path
    const newMatch = line.match(NEW_FILE_REGEX);
    if (newMatch && currentFile) {
      if (newMatch[1] === '/dev/null') {
        currentFile.isDeleted = true;
      }
      continue;
    }

    // Binary file indicator
    if (line.startsWith('Binary files') && currentFile) {
      currentFile.isBinary = true;
      continue;
    }

    // Hunk header
    const hunkMatch = line.match(HUNK_HEADER_REGEX);
    if (hunkMatch && currentFile) {
      if (currentHunk) currentFile.hunks.push(currentHunk);

      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[3], 10);

      currentHunk = {
        header: line,
        startOld: oldLine,
        countOld: parseInt(hunkMatch[2] || '1', 10),
        startNew: newLine,
        countNew: parseInt(hunkMatch[4] || '1', 10),
        lines: [{ type: 'hunk', content: line }],
      };
      continue;
    }

    // Diff lines
    if (currentHunk) {
      if (line.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          content: line.slice(1),
          newLineNumber: newLine++,
        });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({
          type: 'del',
          content: line.slice(1),
          oldLineNumber: oldLine++,
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
        });
      } else if (line.startsWith('\\')) {
        // "\ No newline at end of file"
        currentHunk.lines.push({ type: 'info', content: line });
      }
    }
  }

  // Finalize
  if (currentFile) {
    if (currentHunk) currentFile.hunks.push(currentHunk);
    currentSection.files.push(currentFile);
  }
  if (currentSection.files.length > 0 || currentSection.title !== 'Changes') {
    sections.push(currentSection);
  }

  // Flatten files for compatibility
  const allFiles = sections.flatMap(s => s.files);

  return { files: allFiles, sections };
}

/**
 * Get line numbers for display with proper global indexing
 */
export function getGlobalLineIndex(file: DiffFile, hunkIndex: number, lineIndex: number): number {
  let index = 0;
  for (let h = 0; h < hunkIndex; h++) {
    index += file.hunks[h].lines.length;
  }
  return index + lineIndex;
}

/**
 * Extract excerpt from diff for anchor
 */
export function extractExcerpt(file: DiffFile, hunkIndex: number, startLine: number, endLine: number): string {
  const hunk = file.hunks[hunkIndex];
  if (!hunk) return '';

  const lines: string[] = [];
  for (let i = startLine; i <= endLine && i < hunk.lines.length; i++) {
    const line = hunk.lines[i];
    const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
    lines.push(prefix + line.content);
  }
  return lines.join('\n');
}
