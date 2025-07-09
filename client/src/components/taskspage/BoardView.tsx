import React, { useState } from "react";
import { DndContext, closestCorners, useDraggable, useDroppable, DragOverlay, useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui-kit/Card";
import TaskCard from "@/components/taskspage/TaskCard";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import { Label } from "@/components/ui-kit/Label";

interface BoardViewProps {
  tasks: TaskResDto[];
  onTaskClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const statusColumns = [
  { key: TaskStatus.TODO, label: "To do", titleBg: "bg-amber-400 dark:bg-amber-600" },
  { key: TaskStatus.IN_PROGRESS, label: "In Progress", titleBg: "bg-blue-500 dark:bg-blue-700" },
  { key: TaskStatus.DONE, label: "In Review", titleBg: "bg-green-500 dark:bg-green-700" },
  { key: TaskStatus.CLOSE, label: "Done", titleBg: "bg-gray-400 dark:bg-gray-500" }
];

function DraggableTaskCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging, transform} = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 1, cursor: 'grab' }}
    >
      {children}
    </div>
  );
}

function DroppableColumn({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-200 ${className ?? ''} ${isOver ? 'shadow-2xl' : ""} `}
      style={{}}
    >
      {children}
    </div>
  );
}

const BoardView: React.FC<BoardViewProps> = ({ tasks, onTaskClick, onTaskDelete, onTaskStatusChange }) => {
  // Group tasks by status
  const tasksByStatus: Record<string, TaskResDto[]> = {};
  statusColumns.forEach(col => {
    tasksByStatus[col.key] = tasks.filter(t => t.status === col.key);
  });

  // Track currently dragged task id
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = activeId ? tasks.find(t => String(t.id) === activeId) : null;

  // Handle drag events
  const handleDragStart = (event: any) => {
    setActiveId(String(event.active.id));
  };
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !active) return;
    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    // Find the current status of the task
    const currentTask = tasks.find(t => String(t.id) === taskId);
    if (!currentTask) return;
    if (currentTask.status !== newStatus && onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
  };
  const handleDragCancel = () => setActiveId(null);

  const sensors = useSensors(useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // drag will only activate after moving 3px
      },
    })
  );

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 h-full">
        {statusColumns.map((col) => (
          <DroppableColumn key={col.key} id={String(col.key)} className="h-full w-full min-h-[200px]">
            <Card className="h-full flex flex-col w-full">
              <CardHeader
                className={`py-[10px] px-3 flex items-center ${col.titleBg} sticky top-0 z-10`}
              >
                <CardTitle className="font-extralight text-white">{col.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex flex-col overflow-y-auto gap-3">
                {tasksByStatus[col.key].length === 0 ? (
                  <Label className="text-sm">No tasks</Label>
                ) : (
                  tasksByStatus[col.key]
                    .slice() // avoid mutating original
                    .sort((a, b) => {
                      if (a.dueDate && b.dueDate) {
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      } else if (a.dueDate) {
                        return -1;
                      } else if (b.dueDate) {
                        return 1;
                      } else {
                        return 0;
                      }
                    })
                    .map((task, idx) => (
                      <DraggableTaskCard key={task.id || idx} id={String(task.id)}>
                        <TaskCard
                          title={task.title}
                          description={task.description}
                          dueDate={task.dueDate}
                          projectName={task.projectName}
                          status={task.status}
                          onClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
                          onDelete={onTaskDelete ? () => onTaskDelete(task.id) : undefined}
                        />
                      </DraggableTaskCard>
                    ))
                )}
              </CardContent>
            </Card>
          </DroppableColumn>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCard
            title={activeTask.title}
            description={activeTask.description}
            dueDate={activeTask.dueDate}
            projectName={activeTask.projectName}
            status={activeTask.status}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardView;
