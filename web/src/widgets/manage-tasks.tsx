import "@/index.css";
import { useEffect, useRef } from "react";
import { mountWidget, useLayout, useDisplayMode, useWidgetState } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers";
import { Maximize2, Minimize2 } from "lucide-react";
import { type Task, type Status, getTaskStatus } from "../components/types";
import { LoadingScreen } from "../components/LoadingScreen";
import { AddTaskForm } from "../components/AddTaskForm";
import { KanbanBoard } from "../components/KanbanBoard";
import { TaskList } from "../components/TaskList";

function ManageTasks() {
  const { output, isPending } = useToolInfo<"manage-tasks">();
  const { callToolAsync } = useCallTool("manage-tasks");
  const { theme } = useLayout();
  const isDark = theme === "dark";
  const [displayMode, requestDisplayMode] = useDisplayMode();

  const [widgetState, setWidgetState] = useWidgetState<{ tasks: Task[] }>();
  const mutationCounter = useRef(0);

  const safeTasks = (prev: { tasks?: Task[] } | null | undefined): Task[] =>
    prev?.tasks ?? [];

  // Sync widget state when server output changes
  useEffect(() => {
    if (output?.tasks) {
      setWidgetState(() => ({ tasks: output.tasks as Task[] }));
    }
  }, [output?.tasks]);

  if (isPending || widgetState?.tasks === undefined) {
    return <LoadingScreen isDark={isDark} />;
  }

  const tasks = widgetState.tasks;
  const todoCount = tasks.filter((t) => getTaskStatus(t) === "todo").length;
  const inProgressCount = tasks.filter((t) => getTaskStatus(t) === "in_progress").length;
  const doneCount = tasks.filter((t) => getTaskStatus(t) === "done").length;

  const syncWithServer = async (args: Parameters<typeof callToolAsync>[0]) => {
    const id = ++mutationCounter.current;
    const result = await callToolAsync(args);
    if (id === mutationCounter.current && result?.structuredContent?.tasks) {
      setWidgetState(() => ({ tasks: result.structuredContent.tasks as Task[] }));
    }
  };

  const handleAdd = (title: string, priority: "low" | "medium" | "high", dueDate: string | null) => {
    setWidgetState((prev) => ({
      tasks: [
        {
          id: `temp-${Date.now()}`,
          title,
          completed: false,
          priority,
          dueDate,
          createdAt: new Date().toISOString(),
          status: "todo",
        },
        ...safeTasks(prev),
      ],
    }));
    syncWithServer({ actions: [{ type: "add", title, priority, dueDate: dueDate ?? undefined }] });
  };

  const handleMove = (taskId: string, status: Status) => {
    setWidgetState((prev) => ({
      tasks: safeTasks(prev).map((t) =>
        t.id === taskId ? { ...t, status, completed: status === "done" } : t
      ),
    }));
    syncWithServer({ actions: [{ type: "move", taskId, status }] });
  };

  const handleDelete = (taskId: string) => {
    setWidgetState((prev) => ({
      tasks: safeTasks(prev).filter((t) => t.id !== taskId),
    }));
    syncWithServer({ actions: [{ type: "delete", taskId }] });
  };

  const isFullscreen = displayMode === "fullscreen";

  return (
    <div
      className={`todo-container ${isDark ? "dark" : "light"} ${isFullscreen ? "fullscreen" : ""}`}
      data-llm={`${todoCount} todo, ${inProgressCount} in progress, ${doneCount} done`}
    >
        Heyddddddddd
      <div className="todo-header">
        <h2><span className="brand-icon">&#9889;</span> Claude Hack Night</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="todo-stats">
            <span className="stat" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>{todoCount}</span>
            <span className="stat pending-stat">{inProgressCount}</span>
            <span className="stat completed-stat">{doneCount}</span>
          </div>
          <button
            className="display-mode-btn"
            onClick={() => requestDisplayMode(isFullscreen ? "inline" : "fullscreen")}
            aria-label="Toggle display mode"
            title={isFullscreen ? "Minimize" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <AddTaskForm onAdd={handleAdd} />

      {isFullscreen ? (
        <KanbanBoard tasks={tasks} onMove={handleMove} onDelete={handleDelete} />
      ) : (
        <TaskList tasks={tasks} onMove={handleMove} onDelete={handleDelete} />
      )}
    </div>
  );
}

export default ManageTasks;

mountWidget(<ManageTasks />);
