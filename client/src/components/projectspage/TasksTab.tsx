import BoardView from '@/components/taskspage/BoardView';
import TaskListView from '@/components/taskspage/ListView';
import { useTaskStore } from '@/stores/useTaskStore';
import { TaskDateRange, TaskResDto, TaskViewMode } from '@fullstack/common';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui-kit/Tabs';
import { LayoutDashboard, List } from 'lucide-react';
import { Button } from '@/components/ui-kit/Button';
import { TaskFilterMenu } from '@/components/taskspage/TaskFilterMenu';
import { useEffect, useState } from 'react';

interface ProjectTasksTabProps {
  onTaskClick: (taskId: string) => void;
  view?: TaskViewMode;
  onViewChange?: (view: TaskViewMode) => void;
  onAddTask?: () => void;
}

export function ProjectTasksTab({
  onTaskClick,
  view = TaskViewMode.BOARD,
  onViewChange,
  onAddTask,
}: ProjectTasksTabProps) {
  const { projectTasks: tasks } = useTaskStore();
  const [filteredTasks, setFilteredTasks] = useState<TaskResDto[]>(tasks);

  // Controlled filter values (mirrors MyTasksPage but without project selector)
  const [dateRange, setDateRange] = useState<TaskDateRange>(TaskDateRange.LAST_3_MONTHS);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Keep filteredTasks in sync when tasks change (TaskFilterMenu will also call onFilter)
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      <div className="flex items-center pb-2 gap-3">
        <div>
          <TaskFilterMenu
            showProjectSelect={false}
            showDateRange={true}
            showSearch={true}
            tasks={tasks}
            onFilter={setFilteredTasks}
            // unused when showProjectSelect=false, but required by props
            selectedProject="all"
            dateRange={dateRange}
            searchTerm={searchTerm}
            onDateRangeChange={setDateRange}
            onSearchTermChange={setSearchTerm}
          />
        </div>

        <div className='flex items-center gap-2'>
          <Tabs value={view} onValueChange={(v) => onViewChange?.(v as TaskViewMode)}>
            <TabsList className="bg-white dark:bg-muted flex flex-row gap-0">
              <TabsTrigger
                value={TaskViewMode.BOARD}
                className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
              >
                <LayoutDashboard className="w-4 h-4" />
                Board
              </TabsTrigger>
              <TabsTrigger
                value={TaskViewMode.LIST}
                className="px-4 flex items-center gap-2 focus:z-10 data-[state=active]:bg-muted dark:data-[state=active]:bg-black"
              >
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="default"
            className="px-3 py-2 flex items-center gap-2 text-white bg-gradient-to-r from-purple-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 transition-transform duration-200 hover:scale-105"
            onClick={onAddTask}
          >
            <span className="sr-only">Add Task</span>
            <span className="flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Task
            </span>
          </Button>
        </div>
      </div>

      {view === TaskViewMode.BOARD ? (
        <BoardView
          tasks={filteredTasks}
          onTaskClick={onTaskClick}
          showAssignedTo={true}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          showAssignedTo={true}
        />
      )}
    </div>
  );
}
