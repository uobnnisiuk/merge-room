import { create } from 'zustand';
import * as api from '../api/client';
import type { Task, TaskDetail, Diff, TaskStatus, CreateTaskRequest, CreateCommentRequest, UpdateDecisionRequest } from '../api/types';

interface AnchorSelection {
  filePath: string;
  hunkIndex: number;
  startLine: number;
  endLine: number;
  excerpt: string;
}

interface TaskStore {
  // Task list
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskRequest) => Promise<Task>;

  // Current task detail
  currentTask: TaskDetail | null;
  currentTaskLoading: boolean;
  currentTaskError: string | null;
  fetchTaskDetail: (id: string) => Promise<void>;
  clearCurrentTask: () => void;

  // Diff
  diff: Diff | null;
  diffLoading: boolean;
  diffError: string | null;
  fetchDiff: (taskId: string) => Promise<void>;
  refreshDiff: (taskId: string) => Promise<void>;

  // Selection for anchoring
  anchorSelection: AnchorSelection | null;
  setAnchorSelection: (selection: AnchorSelection | null) => void;

  // Thread actions
  createThreadWithComment: (taskId: string, body: string, isPrivate: boolean, anchor?: AnchorSelection) => Promise<void>;
  addComment: (threadId: string, body: string, isPrivate: boolean) => Promise<void>;

  // Status & Decision
  updateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateDecision: (taskId: string, data: UpdateDecisionRequest) => Promise<void>;

  // Export
  exportMarkdown: string | null;
  exportPRDraft: (taskId: string) => Promise<string>;
  clearExport: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Task list
  tasks: [],
  tasksLoading: false,
  tasksError: null,

  fetchTasks: async () => {
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await api.getTasks();
      set({ tasks, tasksLoading: false });
    } catch (err) {
      set({ tasksError: (err as Error).message, tasksLoading: false });
    }
  },

  createTask: async (data: CreateTaskRequest) => {
    const task = await api.createTask(data);
    set({ tasks: [task, ...get().tasks] });
    return task;
  },

  // Current task
  currentTask: null,
  currentTaskLoading: false,
  currentTaskError: null,

  fetchTaskDetail: async (id: string) => {
    set({ currentTaskLoading: true, currentTaskError: null });
    try {
      const task = await api.getTaskDetail(id);
      set({ currentTask: task, currentTaskLoading: false });
    } catch (err) {
      set({ currentTaskError: (err as Error).message, currentTaskLoading: false });
    }
  },

  clearCurrentTask: () => {
    set({ currentTask: null, currentTaskError: null, diff: null, diffError: null, anchorSelection: null });
  },

  // Diff
  diff: null,
  diffLoading: false,
  diffError: null,

  fetchDiff: async (taskId: string) => {
    set({ diffLoading: true, diffError: null });
    try {
      const diff = await api.getDiff(taskId);
      set({ diff, diffLoading: false });
    } catch (err) {
      set({ diffError: (err as Error).message, diffLoading: false });
    }
  },

  refreshDiff: async (taskId: string) => {
    set({ diffLoading: true, diffError: null });
    try {
      const diff = await api.refreshDiff(taskId);
      set({ diff, diffLoading: false });
    } catch (err) {
      set({ diffError: (err as Error).message, diffLoading: false });
    }
  },

  // Anchor selection
  anchorSelection: null,
  setAnchorSelection: (selection) => set({ anchorSelection: selection }),

  // Thread actions
  createThreadWithComment: async (taskId, body, isPrivate, anchor) => {
    const thread = await api.createThread(taskId);
    const commentData: CreateCommentRequest = { body, isPrivate };
    if (anchor) {
      commentData.anchor = anchor;
    }
    await api.addComment(thread.id, commentData);
    // Refresh task detail
    await get().fetchTaskDetail(taskId);
    set({ anchorSelection: null });
  },

  addComment: async (threadId, body, isPrivate) => {
    await api.addComment(threadId, { body, isPrivate });
    const task = get().currentTask;
    if (task) {
      await get().fetchTaskDetail(task.id);
    }
  },

  // Status
  updateStatus: async (taskId, status) => {
    await api.updateTaskStatus(taskId, status);
    await get().fetchTaskDetail(taskId);
  },

  // Decision
  updateDecision: async (taskId, data) => {
    await api.updateDecision(taskId, data);
    await get().fetchTaskDetail(taskId);
  },

  // Export
  exportMarkdown: null,

  exportPRDraft: async (taskId) => {
    const result = await api.exportPRDraft(taskId);
    set({ exportMarkdown: result.markdown });
    return result.markdown;
  },

  clearExport: () => set({ exportMarkdown: null }),
}));
