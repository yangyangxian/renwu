import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import TaskCard from "./TaskCard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuRadioItem } from "@/components/ui-kit/Dropdown-menu";
import { Button } from "@/components/ui-kit/Button";
import { Badge } from "@/components/ui-kit/Badge";
import { Label } from "@/components/ui-kit/Label";
import { Loader2, CheckCircle, XCircle, Square, Calendar as CalendarIcon, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui-kit/Avatar";
import DateSelector from "@/components/common/DateSelector";

interface TaskListViewProps {
  tasks: TaskResDto[];
  onUpdateTask?: (taskId: string, updates: Partial<TaskResDto>) => void;
}

// Status label, color, and icon mapping for pills
const statusLabels: Record<TaskStatus, string> = {
[TaskStatus.TODO]: "To Do",
[TaskStatus.IN_PROGRESS]: "In Progress",
[TaskStatus.DONE]: "Done",
[TaskStatus.CLOSE]: "Closed",
};
const statusColors: Record<TaskStatus, string> = {
[TaskStatus.TODO]: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-50 dark:border-amber-800",
[TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
[TaskStatus.DONE]: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
[TaskStatus.CLOSE]: "bg-gray-200 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
};
const statusIcons: Record<TaskStatus, React.ReactNode> = {
[TaskStatus.TODO]: <Square className="w-4 h-4 text-yellow-500 mr-2" />,
[TaskStatus.IN_PROGRESS]: <Loader2 className="w-4 h-4 text-blue-500 mr-2 animate-spin-slow" />,
[TaskStatus.DONE]: <CheckCircle className="w-4 h-4 text-green-500 mr-2" />,
[TaskStatus.CLOSE]: <XCircle className="w-4 h-4 text-gray-400 mr-2" />,
};

// Clean status icons without margins for dropdown use
const statusIconsClean: Record<TaskStatus, React.ReactNode> = {
[TaskStatus.TODO]: <Square className="w-4 h-4 text-yellow-500" />,
[TaskStatus.IN_PROGRESS]: <Loader2 className="w-4 h-4 text-blue-500 animate-spin-slow" />,
[TaskStatus.DONE]: <CheckCircle className="w-4 h-4 text-green-500" />,
[TaskStatus.CLOSE]: <XCircle className="w-4 h-4 text-gray-400" />,
};
  
const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onUpdateTask }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const allStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CLOSE];
  const defaultStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(defaultStatuses);
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(undefined);
  const selectedTask = tasks?.find(t => t.id === selectedTaskId);

  // Sync localDueDate with selectedTask.dueDate when selectedTask changes
  React.useEffect(() => {
    setLocalDueDate(selectedTask?.dueDate);
  }, [selectedTask]);

  // Filter by status (multi-select)
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      if (statusFilter.length === 0) return true;
      return statusFilter.includes(task.status);
    });
  }, [tasks, statusFilter]);

  // Sort by due date (soonest first, undefined last)
  const sortedTasks = useMemo(() => {
    return filteredTasks.slice().sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks]);

    // Select the first task by default when tasks change
  React.useEffect(() => {
    if (sortedTasks && sortedTasks.length > 0) {
      setSelectedTaskId(sortedTasks[0].id);
    } else {
      setSelectedTaskId(null);
    }
  }, [sortedTasks]);

  return (
    <div className="flex h-full w-full p-2 overflow-auto">
      {/* Left: Task List */}
      <div className="w-1/3 min-w-[260px] max-w-[300px] rounded-l-lg border border-border bg-white-black overflow-y-auto shadow-xs">
        {/* Status Filter DropdownMenu */}
        <div className="sticky bg-white-black top-0 z-10 py-2 border-b border-border flex items-center justify-start gap-2 rounded-t-md">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent px-1 ml-2">
                {statusFilter.map(status => (
                  <Badge key={status} variant="outline" className={`border flex items-center gap-1 ${statusColors[status]} px-2 py-0.5 text-xs font-medium`}>
                    {statusLabels[status]}
                  </Badge>
                ))}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="ml-3 w-[180px]">
              {allStatuses.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked: boolean) => {
                    setStatusFilter((prev: TaskStatus[]) =>
                      checked
                        ? [...prev, status]
                        : prev.filter((s) => s !== status)
                    );
                  }}
                  onSelect={(e: any) => e.preventDefault()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {statusIcons[status as TaskStatus]}
                  {statusLabels[status as TaskStatus]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {sortedTasks.length ? (
          sortedTasks.map((task, idx) => (
            <React.Fragment key={task.id}>
              <div onClick={() => setSelectedTaskId(task.id)}>
                <TaskCard
                  taskId={task.id}
                  title={task.title}
                  description={task.description}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                  status={task.status}
                  className={`cursor-pointer rounded-none hover:border-l-primary hover:scale-100 bg-white-black py-3 pl-4 min-h-22 border-border
                    ${selectedTaskId === task.id ? 'border-l-primary bg-primary/5 dark:bg-muted' : ''}`}
                />
              </div>
              {idx < sortedTasks.length - 1 && (
                <div className="border-b border-muted dark:border-border" />
              )}
            </React.Fragment>
          ))
        ) : (
          <div className="p-4 text-muted-foreground">No tasks found.</div>
        )}
      </div>
      {/* Right: Task Details */}
      <div className="flex-1 p-6 overflow-y-auto shadow-xs bg-white-black rounded-r-lg border border-border border-l-0 overflow-auto">
        {selectedTask ? (
          <div className="flex flex-col gap-2">
            {/* Title */}
            <div className="flex flex-col gap-2 mb-4">
              <Label className="text-xl font-bold">{selectedTask.title}</Label>
            </div>
            {/* Project */}
            <div className="flex items-center gap-3 min-h-[36px]">
              <Label className="font-medium min-w-[100px]">Project:</Label>
              <Label>{selectedTask.projectName || 'Personal'}</Label>
            </div>
            {/* Due Date */}
            <div className="flex items-center gap-3 min-h-[36px]">
              <Label className="font-medium min-w-[100px]">Due date:</Label>
              <DateSelector
                value={localDueDate}
                onChange={(newDate) => {
                  setLocalDueDate(newDate);
                  if (selectedTask && onUpdateTask) {
                    onUpdateTask(selectedTask.id, { dueDate: newDate });
                  }
                }}
                label={undefined}
                buttonClassName=""
              />
            </div>
            {/* Assigned User */}
            {selectedTask.assignedTo && (
              <div className="flex items-center gap-3 min-h-[36px] mb-1">
                <Label className="font-medium min-w-[100px]">Assigned to:</Label>
                <Avatar className="size-6">
                  {/* If you have an image, use <AvatarImage src={selectedTask.assignedTo.avatarUrl} /> */}
                  <AvatarFallback className="text-base text-primary">
                    {selectedTask.assignedTo.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Label>{selectedTask.assignedTo.name}</Label>
              </div>
            )}
            {/* Status (Badge Dropdown Trigger) */}
            <div className="flex items-center gap-3 mb-1">
              <Label className="font-medium min-w-[100px]">Status:</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`border flex items-center gap-1 px-2 py-0.5 text-xs font-medium cursor-pointer ${statusColors[selectedTask.status]}`}
                  >
                    {statusIcons[selectedTask.status]}
                    {statusLabels[selectedTask.status]}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                  {allStatuses.map((status) => (
                    <DropdownMenuRadioItem
                      key={status}
                      value={status}
                      onSelect={() => {
                        if (selectedTask && onUpdateTask) {
                          onUpdateTask(selectedTask.id, { status: status as TaskStatus });
                        }
                      }}
                      className="flex items-center cursor-pointer pl-8 relative"
                    >
                      {selectedTask.status === status && (
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
                {selectedTask.description || <Label className="text-muted-foreground">No description provided.</Label>}
              </div>
            </div>
            {/* Metadata */}
            <div className="flex items-center gap-3 min-h-[28px] text-xs text-muted-foreground">
              <Label className="font-medium min-w-[100px]">Created:</Label>
              <Label>
                {selectedTask.createdAt
                  ? format(new Date(selectedTask.createdAt), "yyyy-MM-dd HH:mm")
                  : "--"}
              </Label>
            </div>
            <div className="flex items-center gap-3 min-h-[28px] text-xs text-muted-foreground">
              <Label className="font-medium min-w-[100px]">Updated:</Label>
              <Label>
                {selectedTask.updatedAt
                  ? format(new Date(selectedTask.updatedAt), "yyyy-MM-dd HH:mm")
                  : "--"}
              </Label>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground">Select a task to view details.</div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
