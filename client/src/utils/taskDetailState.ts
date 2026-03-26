interface TaskLike {
  id: string;
}

interface ResolveRenderableTaskDetailOptions<TTask extends TaskLike> {
  requestedTaskId: string;
  currentTask?: TTask | null;
  previewTask?: TTask | null;
}

export function resolveRenderableTaskDetail<TTask extends TaskLike>({
  requestedTaskId,
  currentTask,
  previewTask,
}: ResolveRenderableTaskDetailOptions<TTask>): TTask | null {
  if (currentTask && currentTask.id === requestedTaskId) {
    return currentTask;
  }

  if (previewTask && previewTask.id === requestedTaskId) {
    return previewTask;
  }

  return null;
}