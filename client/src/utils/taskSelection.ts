interface ResolveSelectedTaskIdOptions {
  currentSelectedTaskId: string | null;
  taskIds: string[];
  selectionScopeChanged: boolean;
}

export function resolveSelectedTaskId({ currentSelectedTaskId, taskIds, selectionScopeChanged }: ResolveSelectedTaskIdOptions): string | null {
  if (taskIds.length === 0) {
    return null;
  }

  if (selectionScopeChanged) {
    return taskIds[0];
  }

  if (!currentSelectedTaskId || !taskIds.includes(currentSelectedTaskId)) {
    return taskIds[0];
  }

  return currentSelectedTaskId;
}