export type OptimisticTaskStatuses<TStatus extends string> = Record<string, TStatus>;

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