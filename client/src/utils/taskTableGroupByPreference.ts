interface TaskTableGroupByOption {
  id: string;
}

interface ResolveTaskTableGroupBySelectionOptions {
  currentGroupByLabelSetId?: string | null;
  rememberedGroupByValue?: string | null;
  labelSets: TaskTableGroupByOption[];
  isDisabled?: boolean;
}

export function getTaskTableGroupByStorageKey(scopeKey: string) {
  return `task-table-group-by:${scopeKey}`;
}

export function resolveTaskTableGroupBySelection({
  currentGroupByLabelSetId = null,
  rememberedGroupByValue = null,
  labelSets,
  isDisabled = false,
}: ResolveTaskTableGroupBySelectionOptions): string | null {
  if (isDisabled || labelSets.length === 0) {
    return null;
  }

  const availableLabelSetIds = new Set(labelSets.map((labelSet) => labelSet.id));

  if (currentGroupByLabelSetId && availableLabelSetIds.has(currentGroupByLabelSetId)) {
    return currentGroupByLabelSetId;
  }

  if (rememberedGroupByValue && availableLabelSetIds.has(rememberedGroupByValue)) {
    return rememberedGroupByValue;
  }

  return labelSets[0]?.id ?? null;
}