import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { TaskStatus } from "@fullstack/common";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioItem } from "@/components/ui-kit/Dropdown-menu";
import { Badge } from "@/components/ui-kit/Badge";
import { Label } from "@/components/ui-kit/Label";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import DateSelector from "@/components/common/DateSelector";
import { useTaskStore } from "@/stores/useTaskStore";
import { statusLabels, statusColors, statusIcons, allStatuses } from "@/components/taskspage/taskStatusConfig";

interface TaskDetailProps {
  taskId: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { tasks, updateTaskById } = useTaskStore();
  const task = tasks.find(t => t.id === taskId);
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(task?.dueDate);

  useEffect(() => {
    setLocalDueDate(task?.dueDate);
  }, [task?.dueDate]);

  if (!task) return <div className="text-muted-foreground">Select a task to view details.</div>;
  return (
    <div className="flex flex-col gap-2">
      {/* Title */}
      <div className="flex flex-col gap-2 mb-4">
        <Label className="text-base font-bold">{task.title}</Label>
      </div>
      {/* Project */}
      <div className="flex items-center gap-3 min-h-[36px]">
        <Label className="font-medium min-w-[100px]">Project:</Label>
        <Label>{task.projectName || 'Personal'}</Label>
      </div>
      {/* Due Date */}
      <div className="flex items-center gap-3 min-h-[36px]">
        <Label className="font-medium min-w-[100px]">Due date:</Label>
        <DateSelector
          value={localDueDate}
          onChange={async (newDate) => {
            setLocalDueDate(newDate);
            if (taskId && newDate) {
              await updateTaskById(taskId, { dueDate: newDate });
            }
          }}
          label={undefined}
          buttonClassName=""
        />
      </div>
      {/* Assigned User */}
      {task.assignedTo && (
        <div className="flex items-center gap-3 min-h-[36px] mb-1">
          <Label className="font-medium min-w-[100px]">Assigned to:</Label>
          <Avatar className="size-6">
            <AvatarFallback className="text-base text-primary">
              {task.assignedTo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Label>{task.assignedTo.name}</Label>
        </div>
      )}
      {/* Status (Badge Dropdown Trigger) */}
      <div className="flex items-center gap-3 mb-1">
        <Label className="font-medium min-w-[100px]">Status:</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              variant="outline"
              className={`border flex items-center px-1.5 py-0.5 text-xs font-medium cursor-pointer ${statusColors[task.status]}`}
            >
              {statusIcons[task.status]}
              {statusLabels[task.status]}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            {allStatuses.map((status: TaskStatus) => (
              <DropdownMenuRadioItem
                key={status}
                value={status}
                onSelect={async () => {
                  if (taskId) {
                    await updateTaskById(taskId, { status: status as TaskStatus });
                  }
                }}
                className="flex items-center cursor-pointer pl-8 relative"
              >
                {task.status === status && (
                  <Check className="w-4 h-4 text-primary absolute left-2" />
                )}
                <div className="flex items-center gap-2">
                  {statusIcons[status as TaskStatus]}
                  {statusLabels[status as TaskStatus]}
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Description */}
      <div className="flex flex-col gap-1 min-h-[48px] mt-2">
        <Label className="font-medium min-w-[100px]">Description:</Label>
        <div className="text-base whitespace-pre-line text-foreground bg-muted/40 rounded p-3">
          {task.description || <Label className="text-muted-foreground">No description provided.</Label>}
        </div>
      </div>
      {/* Metadata */}
      <div className="flex items-center gap-3 min-h-[28px] text-xs text-muted-foreground">
        <Label className="font-medium min-w-[100px]">Created:</Label>
        <Label>
          {task.createdAt
            ? format(new Date(task.createdAt), "yyyy-MM-dd HH:mm")
            : "--"}
        </Label>
      </div>
      <div className="flex items-center gap-3 min-h-[28px] text-xs text-muted-foreground">
        <Label className="font-medium min-w-[100px]">Updated:</Label>
        <Label>
          {task.updatedAt
            ? format(new Date(task.updatedAt), "yyyy-MM-dd HH:mm")
            : "--"}
        </Label>
      </div>
    </div>
  );
};

export default TaskDetail;
