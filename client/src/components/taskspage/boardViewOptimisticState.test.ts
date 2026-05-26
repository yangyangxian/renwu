import { describe, expect, it } from 'vitest';
import { TaskStatus, type TaskResDto } from '@fullstack/common';

import {
  mergeOptimisticTaskDeletions,
  mergeOptimisticTaskStatuses,
  pruneResolvedOptimisticTaskDeletions,
  pruneResolvedOptimisticTaskStatuses,
} from './boardViewOptimisticState';

function createTask(id: string, status: TaskStatus): TaskResDto {
  return {
    id,
    createdBy: { id: 'creator' } as TaskResDto['createdBy'],
    title: `Task ${id}`,
    description: '',
    dueDate: '',
    status,
    assignedTo: { id: 'assignee' } as TaskResDto['assignedTo'],
    labels: [],
    createdAt: '',
    updatedAt: '',
    projectId: '',
    projectName: '',
  } as TaskResDto;
}

describe('boardViewOptimisticState', () => {
  it('applies optimistic status overrides immediately so the card renders in the target column', () => {
    const tasks = [
      createTask('task-1', TaskStatus.TODO),
      createTask('task-2', TaskStatus.DONE),
    ];

    const merged = mergeOptimisticTaskStatuses(tasks, {
      'task-1': TaskStatus.IN_PROGRESS,
    });

    expect(merged.map(task => ({ id: task.id, status: task.status }))).toEqual([
      { id: 'task-1', status: TaskStatus.IN_PROGRESS },
      { id: 'task-2', status: TaskStatus.DONE },
    ]);
  });

  it('removes only the overrides that have been confirmed by incoming task data', () => {
    const tasks = [
      createTask('task-1', TaskStatus.IN_PROGRESS),
      createTask('task-2', TaskStatus.TODO),
    ];

    const remaining = pruneResolvedOptimisticTaskStatuses(tasks, {
      'task-1': TaskStatus.IN_PROGRESS,
      'task-2': TaskStatus.DONE,
    });

    expect(remaining).toEqual({
      'task-2': TaskStatus.DONE,
    });
  });

  it('hides optimistically deleted tasks immediately from the rendered board columns', () => {
    const tasks = [
      createTask('task-1', TaskStatus.TODO),
      createTask('task-2', TaskStatus.DONE),
    ];

    const merged = mergeOptimisticTaskDeletions(tasks, {
      'task-1': true,
    });

    expect(merged.map((task) => task.id)).toEqual(['task-2']);
  });

  it('drops optimistic delete markers once incoming task data no longer contains the deleted task', () => {
    const tasks = [
      createTask('task-2', TaskStatus.DONE),
    ];

    const remaining = pruneResolvedOptimisticTaskDeletions(tasks, {
      'task-1': true,
      'task-2': true,
    });

    expect(remaining).toEqual({
      'task-2': true,
    });
  });
});