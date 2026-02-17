export const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export const STATUSES = ["todo", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export const STATUS_COLORS: Record<Status, string> = {
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  done: "#22c55e",
};

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  status?: string;
}

export function getTaskStatus(task: Task): Status {
  const s = task.status;
  if (s && (STATUSES as readonly string[]).includes(s)) return s as Status;
  return task.completed ? "done" : "todo";
}

export function nextStatus(current: Status): Status | null {
  const idx = STATUSES.indexOf(current);
  return idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null;
}

export function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
