import { useTasks } from '@/hooks/useTasks';
import { TaskFilterMenu } from '@/components/taskspage/TaskFilterMenu';
import BoardView from '@/components/taskspage/BoardView';
import React, { useState, useEffect } from 'react';
import { TaskResDto } from '@fullstack/common';

export function ProjectTasksTab({ projectId }: { projectId: string }) {
  const { tasks, submitTask, deleteTask } = useTasks(projectId);

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">
      {/* <div className="flex-1 overflow-y-auto rounded-xl"> */}
        <BoardView
          tasks={tasks}
          onTaskClick={taskId => {}}
          onTaskDelete={deleteTask}
          onTaskStatusChange={async (taskId, newStatus) => {
            const task = tasks.find(t => String(t.id) === String(taskId));
            if (!task) return;
            await submitTask({
              ...task,
              status: newStatus,
            });
          }}
        />
      {/* </div> */}
    </div>
  );
}
