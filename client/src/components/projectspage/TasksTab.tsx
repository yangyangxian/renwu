import BoardView from '@/components/taskspage/BoardView';
import TaskListView from '@/components/taskspage/ListView';
import TableView from '@/components/taskspage/TableView';
import { TaskResDto, TaskViewMode } from '@fullstack/common';

interface ProjectTasksTabProps {
  onTaskClick: (taskId: string) => void;
  view?: TaskViewMode;
  onViewChange?: (view: TaskViewMode) => void;
  onAddTask?: () => void;
  tasks?: TaskResDto[];
  selectionScopeKey?: string | null;
  scopeProjectId?: string | null;
}

export function ProjectTasksTab({
  onTaskClick,
  view = TaskViewMode.BOARD,
  onViewChange,
  onAddTask,
  tasks = [],
  selectionScopeKey = null,
  scopeProjectId = null,
}: ProjectTasksTabProps) {
  const filteredTasks = tasks;

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      {view === TaskViewMode.BOARD ? (
        <BoardView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          showAssignedTo={true}
          showProjectName={false}
        />
      ) : view === TaskViewMode.LIST ? (
        <TaskListView
          tasks={filteredTasks}
          showAssignedTo={true}
          selectionScopeKey={selectionScopeKey}
        />
      ) : (
        <TableView
          tasks={filteredTasks}
          scopeProjectId={scopeProjectId}
          storageScopeKey={`project:${scopeProjectId ?? 'unknown'}`}
          onOpenTask={onTaskClick}
        />
      )}
    </div>
  );
}
