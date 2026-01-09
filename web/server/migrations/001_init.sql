-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  repoPath TEXT NOT NULL,
  branchName TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Diffs table (stores git diff snapshots)
CREATE TABLE IF NOT EXISTS diffs (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  diffText TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Threads table (conversation threads)
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  body TEXT NOT NULL,
  isPrivate INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (threadId) REFERENCES threads(id) ON DELETE CASCADE
);

-- Anchors table (diff line references)
CREATE TABLE IF NOT EXISTS anchors (
  id TEXT PRIMARY KEY,
  commentId TEXT NOT NULL,
  filePath TEXT NOT NULL,
  hunkIndex INTEGER NOT NULL,
  startLine INTEGER NOT NULL,
  endLine INTEGER NOT NULL,
  excerpt TEXT NOT NULL,
  FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  taskId TEXT PRIMARY KEY,
  summary TEXT,
  rationale TEXT,
  risks TEXT,
  rollback TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_diffs_taskId ON diffs(taskId);
CREATE INDEX IF NOT EXISTS idx_threads_taskId ON threads(taskId);
CREATE INDEX IF NOT EXISTS idx_comments_threadId ON comments(threadId);
CREATE INDEX IF NOT EXISTS idx_anchors_commentId ON anchors(commentId);
