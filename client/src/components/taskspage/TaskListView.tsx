import { ArrowDownUp } from "lucide-react";
import { useEffect, useState, useMemo, Fragment } from "react";
import { TaskResDto, TaskStatus } from "@fullstack/common";
import TaskCard from "./TaskCard";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuRadioGroup } from "@/components/ui-kit/Dropdown-menu";
import { Button } from "@/components/ui-kit/Button";
import { Badge } from "@/components/ui-kit/Badge";
import TaskDetail from "./TaskDetail";
import { statusLabels, statusColors, statusIcons } from "@/consts/taskStatusConfig"
import { Label } from "@/components/ui-kit/Label";
import { usePermissionStore } from '@/stores/usePermissionStore';
import { PermissionAction, PermissionResourceType } from '@fullstack/common';
import { useAuth } from '@/providers/AuthProvider';

interface TaskListViewProps {
  tasks: TaskResDto[];

  showAssignedTo?: boolean; 
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, showAssignedTo }) => {
  const { hasPermission } = usePermissionStore();
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const allStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE, TaskStatus.CLOSE];
  const defaultStatuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>(defaultStatuses);
  const [sortField, setSortField] = useState<'dueDate' | 'updateDate' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Automatically set sortOrder when sortField changes
  const handleSortFieldChange = (val: string) => {
    const field = val as 'dueDate' | 'updateDate' | 'title';
    setSortField(field);
    if (field === 'dueDate') {
      setSortOrder('asc');
    } else if (field === 'updateDate') {
      setSortOrder('desc');
    }
  };

  // Filter by status (multi-select)
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(task => {
      if (statusFilter.length === 0) return true;
      return statusFilter.includes(task.status);
    });
  }, [tasks, statusFilter]);

  // Sort by selected field and order
  const sortedTasks = useMemo(() => {
    const tasksCopy = filteredTasks.slice();
    tasksCopy.sort((a, b) => {
      let result = 0;
      if (sortField === 'dueDate') {
        if (!a.dueDate && !b.dueDate) result = 0;
        else if (!a.dueDate) result = 1;
        else if (!b.dueDate) result = -1;
        else result = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'updateDate') {
        if (!a.updatedAt && !b.updatedAt) result = 0;
        else if (!a.updatedAt) result = 1;
        else if (!b.updatedAt) result = -1;
        else result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === 'title') {
        result = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? result : -result;
    });
    return tasksCopy;
  }, [filteredTasks, sortField, sortOrder]);

  // Select the first task by default when tasks change
  useEffect(() => {
    if (sortedTasks && sortedTasks.length > 0) {
      if (!selectedTaskId || !sortedTasks.some(t => t.id === selectedTaskId)) {
        setSelectedTaskId(sortedTasks[0].id);
      }
    } else {
      setSelectedTaskId(null);
    }
  }, [sortedTasks]);

  return (
    <div className="flex h-full w-full overflow-auto">
      {/* Left: Task List */}
      <div className="w-1/3 min-w-[260px] max-w-[290px] rounded-l-lg border border-input dark:border-[1.5px] bg-white-black overflow-y-auto shadow-xs">
        {/* Status Filter and Sort Icon */}
        <div className="sticky bg-white-black top-0 z-10 py-1 border-b border-border flex items-center justify-between rounded-t-md">
          {/* Status Filter DropdownMenu */}
          <div className="max-w-[220px]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex justify-start items-center focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent px-[3px] ml-2">
                  {statusFilter.map(status => (
                    <Badge key={status} variant="outline" className={`border flex items-center gap-[2px] ${statusColors[status]} px-[6px] py-0.5 text-[11px] font-medium`}>
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
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    {statusIcons[status as TaskStatus]}
                    {statusLabels[status as TaskStatus]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Sort Dropdown - Icon Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="py-2 mr-[2px] focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent" aria-label="Sort">
                <ArrowDownUp className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mr-2 w-[160px] py-1 rounded-md shadow-lg border border-border bg-popover">
              {/* Sort Field Group */}
              <div className="px-2 pb-1 text-[12px] text-muted-foreground">Sort By</div>
              <DropdownMenuRadioGroup value={sortField} onValueChange={handleSortFieldChange}>
                <DropdownMenuRadioItem value="dueDate" className="cursor-pointer text-xs">Due Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updateDate" className="cursor-pointer text-xs">Update Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title" className="cursor-pointer text-xs">Title</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <div className="px-2 pt-2 pb-1 text-xs text-muted-foreground">Order</div>
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val: string) => setSortOrder(val as 'asc' | 'desc')}>
                <DropdownMenuRadioItem value="asc" className="cursor-pointer text-xs">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc" className="cursor-pointer text-xs">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {sortedTasks.length ? (
          sortedTasks.map((task, idx) => {
            const showDeleteButton = hasPermission(
              PermissionAction.DELETE_OTHERS_TASK,
              {
                resourceType: PermissionResourceType.TASK,
                loggedUserId: user?.id!,
                projectId: task.projectId!,
                assignedUserId: task.assignedTo?.id!
              }
            );
            return (
              <Fragment key={task.id}>
                <div onClick={() => setSelectedTaskId(task.id)}>
                  <TaskCard
                    taskId={task.id}
                    title={task.title}
                    description={task.description}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    assignedTo={showAssignedTo ? task.assignedTo : undefined}
                    className={`cursor-pointer rounded-none hover:border-l-primary hover:scale-100 bg-white-black py-3 pl-4 min-h-22 border-border shadow-none
                      ${selectedTaskId === task.id ? 'border-l-primary bg-primary/5 dark:bg-muted' : ''}`}
                    showDeleteButton={showDeleteButton}
                  />
                </div>
                {idx < sortedTasks.length - 1 && (
                  <div className="border-b border-border" />
                )}
              </Fragment>
            );
          })
        ) : (
          <Label className="p-4 text-muted-foreground">No tasks found.</Label>
        )}
      </div>
      {/* Right: Task Details */}
      <div className="flex-1 p-5 overflow-y-auto shadow-xs bg-white-black rounded-r-lg border border-input dark:border-[1.5px] border-l-0 dark:border-l-0">
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
