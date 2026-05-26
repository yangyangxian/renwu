export type OptimisticTaskStatuses<TStatus extends string> = Record<string, TStatus>;
export type OptimisticTaskDeletions = Record<string, true>;

type TaskWithStatus<TStatus extends string = string> = {
  id: string;
  status: TStatus;
};

export function mergeOptimisticTaskStatuses<TTask extends TaskWithStatus>(
  tasks: TTask[],
  optimisticStatuses: OptimisticTaskStatuses<TTask['status']>,
): TTask[] {
  if (Object.keys(optimisticStatuses).length === 0) {
    return tasks;
  }

  let hasChanges = false;
  const mergedTasks = tasks.map((task) => {
    const optimisticStatus = optimisticStatuses[String(task.id)];

    if (!optimisticStatus || optimisticStatus === task.status) {
      return task;
    }

    hasChanges = true;
    return {
      ...task,
      status: optimisticStatus,
    };
  });

  return hasChanges ? mergedTasks : tasks;
}

export function mergeOptimisticTaskDeletions<TTask extends { id: string }>(
  tasks: TTask[],
  optimisticDeletedTaskIds: OptimisticTaskDeletions,
): TTask[] {
  const deletedTaskIds = Object.keys(optimisticDeletedTaskIds);

  if (deletedTaskIds.length === 0) {
    return tasks;
  }

  const mergedTasks = tasks.filter((task) => !optimisticDeletedTaskIds[String(task.id)]);
  return mergedTasks.length === tasks.length ? tasks : mergedTasks;
}

export function pruneResolvedOptimisticTaskStatuses<TTask extends TaskWithStatus>(
  tasks: TTask[],
  optimisticStatuses: OptimisticTaskStatuses<TTask['status']>,
): OptimisticTaskStatuses<TTask['status']> {
  const optimisticEntries = Object.entries(optimisticStatuses);

  if (optimisticEntries.length === 0) {
    return optimisticStatuses;
  }

  const currentStatusesByTaskId = new Map(tasks.map((task) => [String(task.id), task.status]));
  const remainingEntries = optimisticEntries.filter(([taskId, optimisticStatus]) => {
    const currentStatus = currentStatusesByTaskId.get(taskId);

    if (currentStatus === undefined) {
      return false;
    }

    return currentStatus !== optimisticStatus;
  });

  if (remainingEntries.length === optimisticEntries.length) {
    return optimisticStatuses;
  }

  return Object.fromEntries(remainingEntries) as OptimisticTaskStatuses<TTask['status']>;
}

export function pruneResolvedOptimisticTaskDeletions<TTask extends { id: string }>(
  tasks: TTask[],
  optimisticDeletedTaskIds: OptimisticTaskDeletions,
): OptimisticTaskDeletions {
  const optimisticEntries = Object.entries(optimisticDeletedTaskIds);

  if (optimisticEntries.length === 0) {
    return optimisticDeletedTaskIds;
  }

  const currentTaskIds = new Set(tasks.map((task) => String(task.id)));
  const remainingEntries = optimisticEntries.filter(([taskId]) => currentTaskIds.has(taskId));

  if (remainingEntries.length === optimisticEntries.length) {
    return optimisticDeletedTaskIds;
  }

  return Object.fromEntries(remainingEntries) as OptimisticTaskDeletions;
}