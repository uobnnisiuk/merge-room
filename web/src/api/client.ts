import type {
  Task,
  TaskDetail,
  Diff,
  Thread,
  CommentWithAnchor,
  Decision,
  CreateTaskRequest,
  CreateCommentRequest,
  UpdateDecisionRequest,
  TaskStatus,
} from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Tasks
export async function getTasks(): Promise<Task[]> {
  return request('/tasks');
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTaskDetail(id: string): Promise<TaskDetail> {
  return request(`/tasks/${id}`);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return request(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Diffs
export async function refreshDiff(taskId: string): Promise<Diff> {
  return request(`/tasks/${taskId}/refresh-diff`, { method: 'POST' });
}

export async function getDiff(taskId: string): Promise<Diff> {
  return request(`/tasks/${taskId}/diff`);
}

// Threads & Comments
export async function createThread(taskId: string): Promise<Thread> {
  return request(`/tasks/${taskId}/threads`, { method: 'POST' });
}

export async function addComment(threadId: string, data: CreateCommentRequest): Promise<CommentWithAnchor> {
  return request(`/tasks/threads/${threadId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Decision
export async function updateDecision(taskId: string, data: UpdateDecisionRequest): Promise<Decision> {
  return request(`/tasks/${taskId}/decision`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Export
export interface ExportResult {
  markdown: string;
  filePath: string;
}

export async function exportPRDraft(taskId: string): Promise<ExportResult> {
  return request(`/tasks/${taskId}/export`, { method: 'POST' });
}
