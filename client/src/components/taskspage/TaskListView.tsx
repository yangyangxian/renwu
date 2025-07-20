import { useEffect, useState, useMemo, Fragment } from "react";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import TaskCard from "./TaskCard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuRadioItem } from "@/components/ui-kit/Dropdown-menu";
import { Button } from "@/components/ui-kit/Button";
import { Badge } from "@/components/ui-kit/Badge";
import TaskDetail from "./TaskDetail";
import { statusLabels, statusColors, statusIcons } from "@/components/taskspage/taskStatusConfig"

interface TaskListViewProps {
  tasks: TaskResDto[];
  onUpdateTask?: (taskId: string, updates: Partial<TaskResDto>) => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, onUpdateTask }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const allStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CLOSE];
  const defaultStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(defaultStatuses);
  const selectedTask = tasks?.find(t => t.id === selectedTaskId);

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
  useEffect(() => {
    if (sortedTasks && sortedTasks.length > 0) {
      setSelectedTaskId(sortedTasks[0].id);
    } else {
      setSelectedTaskId(null);
    }
  }, [sortedTasks]);

  return (
    <div className="flex h-full w-full p-2 overflow-auto">
      {/* Left: Task List */}
      <div className="w-1/3 min-w-[260px] max-w-[300px] rounded-l-lg border border-input dark:border-[1.5px] bg-white-black overflow-y-auto shadow-xs">
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
            <Fragment key={task.id}>
              <div onClick={() => setSelectedTaskId(task.id)}>
                <TaskCard
                  taskId={task.id}
                  title={task.title}
                  description={task.description}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                  status={task.status}
                  className={`cursor-pointer rounded-none hover:border-l-primary hover:scale-100 bg-white-black py-3 pl-4 min-h-22 border-border shadow-none
                    ${selectedTaskId === task.id ? 'border-l-primary bg-primary/5 dark:bg-muted' : ''}`}
                />
              </div>
              {idx < sortedTasks.length - 1 && (
                <div className="border-b border-border" />
              )}
            </Fragment>
          ))
        ) : (
          <div className="p-4 text-muted-foreground">No tasks found.</div>
        )}
      </div>
      {/* Right: Task Details */}
      <div className="flex-1 p-6 overflow-y-auto shadow-xs bg-white-black rounded-r-lg border border-input dark:border-[1.5px] border-l-0 dark:border-l-0 overflow-auto">
        {selectedTaskId ? (
          <TaskDetail taskId={selectedTaskId} />
        ) : (
          <div className="text-muted-foreground">Select a task to view details.</div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
