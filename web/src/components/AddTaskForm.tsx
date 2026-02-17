import { useState } from "react";
import { Plus } from "lucide-react";

interface AddTaskFormProps {
  onAdd: (title: string, priority: "low" | "medium" | "high", dueDate: string | null) => void;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), priority, dueDate || null);
    setTitle("");
    setDueDate("");
  };

  return (
    <div className="add-form">
      <input
        type="text"
        className="add-input"
        placeholder="Add a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <div className="add-options">
        <select
          className="priority-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          className="date-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button className="add-btn" onClick={handleSubmit} disabled={!title.trim()}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}
