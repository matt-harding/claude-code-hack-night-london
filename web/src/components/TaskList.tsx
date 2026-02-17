import { type Task, type Status } from "./types";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onMove: (taskId: string, status: Status) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({ tasks, onMove, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <div className="empty">No tasks yet. Add one above!</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onMove={onMove} onDelete={onDelete} />
      ))}
    </div>
  );
}
