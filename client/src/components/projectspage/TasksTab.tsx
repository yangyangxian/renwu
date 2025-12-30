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
  tasks?: TaskResDto[];
}

export function ProjectTasksTab({
  onTaskClick,
  view = TaskViewMode.BOARD,
  onViewChange,
  onAddTask,
  tasks = [],
}: ProjectTasksTabProps) {
  const filteredTasks = tasks;

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
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
