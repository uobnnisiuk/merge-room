export type TaskStatus = 'draft' | 'review' | 'approved' | 'archived';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  repoPath: string;
  branchName: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Diff {
  id: string;
  taskId: string;
  diffText: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  taskId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  threadId: string;
  body: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Anchor {
  id: string;
  commentId: string;
  filePath: string;
  hunkIndex: number;
  startLine: number;
  endLine: number;
  excerpt: string;
  stale: boolean;
}

export interface Decision {
  taskId: string;
  summary: string | null;
  rationale: string | null;
  risks: string | null;
  rollback: string | null;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  repoPath: string;
  branchName?: string;
}

export interface CreateCommentRequest {
  body: string;
  isPrivate?: boolean;
  anchor?: {
    filePath: string;
    hunkIndex: number;
    startLine: number;
    endLine: number;
    excerpt: string;
  };
}

export interface UpdateDecisionRequest {
  summary?: string;
  rationale?: string;
  risks?: string;
  rollback?: string;
}

export interface ThreadWithComments extends Thread {
  comments: CommentWithAnchor[];
}

export interface CommentWithAnchor extends Comment {
  anchor: Anchor | null;
}

export interface TaskDetail extends Task {
  threads: ThreadWithComments[];
  decision: Decision | null;
}
