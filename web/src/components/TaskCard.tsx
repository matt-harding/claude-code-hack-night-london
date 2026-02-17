import { Trash2, Calendar } from "lucide-react";
import {
  type Task,
  type Status,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  getTaskStatus,
  formatDate,
} from "./types";
import { StatusPill } from "./StatusPill";

interface TaskCardProps {
  task: Task;
  variant?: "inline" | "kanban";
  onMove: (taskId: string, status: Status) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, variant = "inline", onMove, onDelete }: TaskCardProps) {
  const status = getTaskStatus(task);

  return (
    <div
      className={`task-item ${status === "done" ? "completed" : ""}`}
      data-llm={`Task: "${task.title}" - ${status}, ${task.priority} priority`}
    >
      <div className="task-content">
        <span className="task-title">{task.title}</span>
        <div className="task-meta">
          <span
            className="priority-badge"
            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.dueDate && (
            <span className="due-date">
              <Calendar size={10} /> {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        {variant === "inline" && (
          <StatusPill status={status} onChange={(s) => onMove(task.id, s)} />
        )}
        <button
          className="delete-btn"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
