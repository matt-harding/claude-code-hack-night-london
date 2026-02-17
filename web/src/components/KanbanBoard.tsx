import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { type Task, type Status, STATUSES, STATUS_LABELS, STATUS_COLORS, getTaskStatus } from "./types";
import { TaskCard } from "./TaskCard";

interface KanbanBoardProps {
  tasks: Task[];
  onMove: (taskId: string, status: Status) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanBoard({ tasks, onMove, onDelete }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId as Status;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const currentStatus = getTaskStatus(task);
    if (currentStatus === newStatus) return;

    onMove(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {STATUSES.map((status) => {
          const columnTasks = tasks.filter((t) => getTaskStatus(t) === status);
          return (
            <div key={status} className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
                <span className="kanban-column-title">{STATUS_LABELS[status]}</span>
                <span className="kanban-column-count">{columnTasks.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column-tasks ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                  >
                    {columnTasks.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="kanban-empty">No tasks</div>
                    ) : (
                      columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? "dragging" : ""}
                            >
                              <TaskCard task={task} variant="kanban" onMove={onMove} onDelete={onDelete} />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
