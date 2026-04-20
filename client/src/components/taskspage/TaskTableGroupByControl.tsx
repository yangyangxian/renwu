import { useEffect, useMemo } from 'react';

import { LabelSetResDto, TaskViewMode } from '@fullstack/common';
import { Rows3 } from 'lucide-react';

import { useWebStorage } from '@/hooks/useWebStorage';
import { Label } from '@/components/ui-kit/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-kit/Select';
import { useLabelStore } from '@/stores/useLabelStore';
import { useTaskViewStore } from '@/stores/useTaskViewStore';

const MIN_GROUP_BY_TRIGGER_CH = 16;
const MAX_GROUP_BY_TRIGGER_CH = 28;
const GROUP_BY_TRIGGER_PADDING_CH = 5;
export const TASK_TABLE_UNGROUPED_VALUE = '__ungrouped__';

interface TaskTableGroupByControlProps {
  scopeProjectId: string | 'all' | null;
  storageScopeKey: string;
}

interface TaskTableGroupByOption {
  id: string;
}

export function getTaskTableGroupByStorageKey(scopeKey: string) {
  return `task-table-group-by:${scopeKey}`;
}

export function resolveTaskTableGroupBySelection({
  currentGroupByLabelSetId = null,
  rememberedGroupByValue = null,
  labelSets,
  isDisabled = false,
  respectExplicitUngrouped = false,
}: {
  currentGroupByLabelSetId?: string | null;
  rememberedGroupByValue?: string | null;
  labelSets: TaskTableGroupByOption[];
  isDisabled?: boolean;
  respectExplicitUngrouped?: boolean;
}): string | null {
  if (isDisabled || labelSets.length === 0) {
    return null;
  }

  const availableLabelSetIds = new Set(labelSets.map((labelSet) => labelSet.id));

  if (currentGroupByLabelSetId && availableLabelSetIds.has(currentGroupByLabelSetId)) {
    return currentGroupByLabelSetId;
  }

  if (respectExplicitUngrouped && currentGroupByLabelSetId == null) {
    return null;
  }

  if (rememberedGroupByValue === TASK_TABLE_UNGROUPED_VALUE) {
    return null;
  }

  if (rememberedGroupByValue && availableLabelSetIds.has(rememberedGroupByValue)) {
    return rememberedGroupByValue;
  }

  return labelSets[0]?.id ?? null;
}

function normalizeProjectScope(scopeProjectId: string | 'all' | null): string | null | undefined {
  if (scopeProjectId === 'all') return undefined;
  if (scopeProjectId === 'personal') return null;
  return scopeProjectId;
}

export default function TaskTableGroupByControl({ scopeProjectId, storageScopeKey }: TaskTableGroupByControlProps) {
  const {
    currentDisplayViewConfig,
    currentSelectedTaskView,
    setCurrentDisplayViewConfig,
  } = useTaskViewStore();
  const { fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();

  const isDisabled = scopeProjectId === 'all';
  const normalizedProjectId = normalizeProjectScope(scopeProjectId);
  const labelSets = getLabelSetsForProjectId(normalizedProjectId) as LabelSetResDto[];
  const [rememberedGroupByValue, setRememberedGroupByValue] = useWebStorage<string | null>(
    isDisabled ? null : getTaskTableGroupByStorageKey(storageScopeKey),
    null
  );

  const shouldRespectSavedUngroupedSelection = currentDisplayViewConfig.viewMode === TaskViewMode.TABLE
    && currentSelectedTaskView?.viewConfig?.viewMode === TaskViewMode.TABLE
    && currentSelectedTaskView?.viewConfig?.groupByLabelSetId == null;

  const resolvedGroupByLabelSetId = useMemo(() => {
    return resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: currentDisplayViewConfig.groupByLabelSetId,
      rememberedGroupByValue,
      labelSets,
      isDisabled,
      respectExplicitUngrouped: shouldRespectSavedUngroupedSelection,
    });
  }, [
    currentDisplayViewConfig.groupByLabelSetId,
    currentDisplayViewConfig.viewMode,
    currentSelectedTaskView?.viewConfig?.groupByLabelSetId,
    currentSelectedTaskView?.viewConfig?.viewMode,
    isDisabled,
    labelSets,
    rememberedGroupByValue,
    shouldRespectSavedUngroupedSelection,
  ]);

  useEffect(() => {
    if (isDisabled) {
      if (currentDisplayViewConfig.groupByLabelSetId) {
        setCurrentDisplayViewConfig({
          ...currentDisplayViewConfig,
          groupByLabelSetId: null,
        });
      }
      return;
    }

    fetchLabelSets(normalizedProjectId ?? undefined, { setActiveScope: false });
  }, [currentDisplayViewConfig, fetchLabelSets, isDisabled, normalizedProjectId, setCurrentDisplayViewConfig]);

  useEffect(() => {
    if (isDisabled || labelSets.length === 0) {
      if (currentDisplayViewConfig.groupByLabelSetId == null) return;

      setCurrentDisplayViewConfig({
        ...currentDisplayViewConfig,
        groupByLabelSetId: null,
      });
      return;
    }

    if (resolvedGroupByLabelSetId === currentDisplayViewConfig.groupByLabelSetId) return;
    if (resolvedGroupByLabelSetId == null && currentDisplayViewConfig.groupByLabelSetId == null) return;

    setCurrentDisplayViewConfig({
      ...currentDisplayViewConfig,
      groupByLabelSetId: resolvedGroupByLabelSetId,
    });
  }, [
    currentDisplayViewConfig,
    isDisabled,
    labelSets.length,
    resolvedGroupByLabelSetId,
    setCurrentDisplayViewConfig,
  ]);

  useEffect(() => {
    if (isDisabled) return;
    if (labelSets.length === 0) return;

    const nextRememberedGroupByValue = currentDisplayViewConfig.groupByLabelSetId;
    if (!nextRememberedGroupByValue) return;
    if (rememberedGroupByValue === nextRememberedGroupByValue) return;

    setRememberedGroupByValue(nextRememberedGroupByValue);
  }, [
    currentDisplayViewConfig.groupByLabelSetId,
    isDisabled,
    labelSets.length,
    rememberedGroupByValue,
    setRememberedGroupByValue,
  ]);

  const hasLabelSets = labelSets.length > 0;
  const selectValue = hasLabelSets
    ? (resolvedGroupByLabelSetId && labelSets.some((labelSet) => labelSet.id === resolvedGroupByLabelSetId)
      ? resolvedGroupByLabelSetId
      : TASK_TABLE_UNGROUPED_VALUE)
    : undefined;
  const triggerWidth = useMemo(
    () => {
      const longestOptionLength = ['Ungrouped', ...labelSets.map((labelSet) => labelSet.name)].reduce((maxLength, optionLabel) => {
        return Math.max(maxLength, optionLabel.trim().length);
      }, 0);

      const width = Math.min(
        Math.max(longestOptionLength + GROUP_BY_TRIGGER_PADDING_CH, MIN_GROUP_BY_TRIGGER_CH),
        MAX_GROUP_BY_TRIGGER_CH
      );

      return `${width}ch`;
    },
    [labelSets]
  );

  return (
    <div className="mx-2 flex items-center gap-2 w-fit rounded-md border border-none bg-background py-2 pl-5 pr-5 dark:bg-muted/65">
      <Rows3 className="h-4 w-4 text-muted-foreground" />
      <Label className="mb-0 mr-2 text-sm">Group by</Label>
      <div className="w-fit min-w-[16ch]" style={{ width: triggerWidth }}>
        <Select
          disabled={isDisabled || !hasLabelSets}
          value={selectValue}
          onValueChange={(value) => {
            const nextGroupByLabelSetId = value === TASK_TABLE_UNGROUPED_VALUE ? null : value;
            setRememberedGroupByValue(value);
            setCurrentDisplayViewConfig({
              ...currentDisplayViewConfig,
              groupByLabelSetId: nextGroupByLabelSetId,
            });
          }}
        >
          <SelectTrigger className="w-full h-7.5! border-border bg-background text-foreground shadow-none dark:text-white">
            <SelectValue placeholder={hasLabelSets ? 'Select label set' : 'No label set'} />
          </SelectTrigger>
          <SelectContent>
            {labelSets.map((labelSet) => (
              <SelectItem key={labelSet.id} value={labelSet.id} className="text-sm">
                {labelSet.name}
              </SelectItem>
            ))}
            <SelectItem value={TASK_TABLE_UNGROUPED_VALUE} className="text-sm">Ungrouped</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isDisabled && (
        <span className="text-xs text-muted-foreground">
          Select a concrete project or personal scope to group by label set.
        </span>
      )}
      {!isDisabled && !hasLabelSets && (
        <span className="text-xs text-muted-foreground">
          Create a label set to enable grouping.
        </span>
      )}
    </div>
  );
}
