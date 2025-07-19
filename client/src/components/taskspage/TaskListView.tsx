import React, { useState } from "react";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import { useTaskStore } from "@/stores/useTaskStore";
import TaskCard from "./TaskCard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui-kit/Dropdown-menu";
import { Button } from "@/components/ui-kit/Button";
import { Badge } from "@/components/ui-kit/Badge";
import { Loader2, CheckCircle, XCircle, Square } from "lucide-react";

interface TaskListViewProps {
  tasks: TaskResDto[];
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const allStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CLOSE];
  const defaultStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(defaultStatuses);
  const selectedTask = tasks?.find(t => t.id === selectedTaskId);

  // Filter by status (multi-select)
  const filteredTasks = (tasks || []).filter(task => {
    if (statusFilter.length === 0) return true;
    return statusFilter.includes(task.status);
  });
  // Sort by due date (soonest first, undefined last)
  const sortedTasks = filteredTasks.slice().sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

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
    [TaskStatus.CLOSE]: <XCircle className="w-4 h-4 text-red-400 mr-2" />,
  };

  return (
    <div className="flex h-full w-full p-2 overflow-auto">
      {/* Left: Task List */}
      <div className="w-1/3 min-w-[260px] max-w-[300px] rounded-l-md border border-border bg-white-black overflow-y-auto shadow-xs">
        {/* Status Filter DropdownMenu */}
        <div className="sticky top-0 z-10 bg-gradient-to-b from-white/95 to-white dark:from-black/90 dark:to-muted/90 py-2 border-b border-border flex items-center justify-start gap-2 rounded-t-md">
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
                  className={`cursor-pointer rounded-none hover:border-l-primary hover:scale-100 bg-white dark:bg-muted py-3 pl-4 min-h-22 border-border
                    ${selectedTaskId === task.id ? 'border-l-primary bg-primary/5' : ''}`}
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
      <div className="flex-1 p-6 overflow-y-auto shadow-xs rounded-r-md border border-border border-l-0 overflow-auto">
        {selectedTask ? (
          <div>
            <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
            <div className="mb-4 text-muted-foreground">{selectedTask.description}</div>
            <div className="mb-2">Due: {selectedTask.dueDate ? selectedTask.dueDate : 'No due date'}</div>
            <div className="mb-2">Status: {selectedTask.status}</div>
            <div className="mb-2">Project: {selectedTask.projectName || 'Personal'}</div>
            {selectedTask.assignedTo && (
              <div className="mb-2">Assigned to: {selectedTask.assignedTo.name}</div>
            )}
            {/* Add more details/actions as needed */}
          </div>
        ) : (
          <div className="text-muted-foreground">Select a task to view details.</div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
