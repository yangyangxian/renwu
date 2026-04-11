import { useEffect, useMemo } from 'react';

import { LabelSetResDto } from '@fullstack/common';
import { Rows3 } from 'lucide-react';

import { useWebStorage } from '@/hooks/useWebStorage';
import { Label } from '@/components/ui-kit/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-kit/Select';
import { useLabelStore } from '@/stores/useLabelStore';
import { useTaskViewStore } from '@/stores/useTaskViewStore';
import {
  getTaskTableGroupByStorageKey,
  resolveTaskTableGroupBySelection,
} from '@/utils/taskTableGroupByPreference';
import { getTaskTableGroupByTriggerWidth } from '@/utils/taskTableGroupBySizing';

interface TaskTableGroupByControlProps {
  scopeProjectId: string | 'all' | null;
  storageScopeKey: string;
}

function normalizeProjectScope(scopeProjectId: string | 'all' | null): string | null | undefined {
  if (scopeProjectId === 'all') return undefined;
  if (scopeProjectId === 'personal') return null;
  return scopeProjectId;
}

export default function TaskTableGroupByControl({ scopeProjectId, storageScopeKey }: TaskTableGroupByControlProps) {
  const {
    currentDisplayViewConfig,
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

  const resolvedGroupByLabelSetId = useMemo(() => {
    return resolveTaskTableGroupBySelection({
      currentGroupByLabelSetId: currentDisplayViewConfig.groupByLabelSetId,
      rememberedGroupByValue,
      labelSets,
      isDisabled,
    });
  }, [
    currentDisplayViewConfig.groupByLabelSetId,
    isDisabled,
    labelSets,
    rememberedGroupByValue,
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
  const selectValue = labelSets.some((labelSet) => labelSet.id === resolvedGroupByLabelSetId)
    ? resolvedGroupByLabelSetId ?? undefined
    : undefined;
  const triggerWidth = useMemo(
    () => getTaskTableGroupByTriggerWidth(labelSets.map((labelSet) => labelSet.name)),
    [labelSets]
  );

  return (
    <div className="flex items-center gap-2 rounded-md border border-none bg-background py-2 pl-5 pr-3">
      <Rows3 className="h-4 w-4 text-muted-foreground" />
      <Label className="mb-0 mr-2 text-sm font-medium">Group by</Label>
      <div className="w-fit min-w-[16ch]" style={{ width: triggerWidth }}>
        <Select
          disabled={isDisabled || !hasLabelSets}
          value={selectValue}
          onValueChange={(value) => {
            setRememberedGroupByValue(value);
            setCurrentDisplayViewConfig({
              ...currentDisplayViewConfig,
              groupByLabelSetId: value,
            });
          }}
        >
          <SelectTrigger className="w-full bg-background" size="sm">
            <SelectValue placeholder={hasLabelSets ? 'Select label set' : 'No label set'} />
          </SelectTrigger>
          <SelectContent>
            {labelSets.map((labelSet) => (
              <SelectItem key={labelSet.id} value={labelSet.id}>
                {labelSet.name}
              </SelectItem>
            ))}
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