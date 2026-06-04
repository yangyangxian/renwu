import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, FilterIcon, Folder, Rows3, Tag } from 'lucide-react';
import { TaskDateRange } from '@fullstack/common';
import { Button } from '@/components/ui-kit/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui-kit/Dropdown-menu';
import LabelBadge from '@/components/common/LabelBadge';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLabelStore } from '@/stores/useLabelStore';

export interface TaskFilterDropdownProps {
  value: TaskDateRange;
  onChange: (value: TaskDateRange) => void;
  hasActiveFilters?: boolean;

  /** Optional project filter (same options as TaskFilterMenu's Select). */
  showProjectSelect?: boolean;
  selectedProject?: string;
  onSelectedProjectChange?: (projectId: string) => void;
  showLabelFilter?: boolean;
  selectedLabelId?: string | null;
  selectedLabelIds?: string[] | null;
  onSelectedLabelChange?: (labelId: string | null) => void;
  onSelectedLabelIdsChange?: (labelIds: string[] | null) => void;
  showLabelSetFilter?: boolean;
  selectedLabelSetId?: string | null;
  onSelectedLabelSetChange?: (labelSetId: string | null, labelIds?: string[] | null) => void;
  selectedLabelSetLabelIds?: string[] | null;
  selectedLabelSetLabelIdsBySet?: Record<string, string[]> | null;
  onSelectedLabelSetLabelIdsBySetChange?: (labelIdsBySet: Record<string, string[]> | null) => void;

  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

const RANGE_OPTIONS: Array<{ value: TaskDateRange; label: string }> = [
  { value: TaskDateRange.ALL_TIME, label: 'All Time' },
  { value: TaskDateRange.LAST_3_MONTHS, label: 'Last 3 months' },
  { value: TaskDateRange.LAST_1_YEAR, label: 'Last 1 year' },
];

export function TaskFilterDropdown({
  value,
  onChange,
  hasActiveFilters = false,
  showProjectSelect,
  selectedProject,
  onSelectedProjectChange,
  showLabelFilter,
  selectedLabelId,
  selectedLabelIds,
  onSelectedLabelChange,
  onSelectedLabelIdsChange,
  showLabelSetFilter,
  selectedLabelSetId,
  onSelectedLabelSetChange,
  selectedLabelSetLabelIds,
  selectedLabelSetLabelIdsBySet,
  onSelectedLabelSetLabelIdsBySetChange,
  disabled,
  className,
  triggerClassName,
}: TaskFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [dateRangeExpanded, setDateRangeExpanded] = useState(true);
  const [labelExpanded, setLabelExpanded] = useState(true);
  const [labelSetExpanded, setLabelSetExpanded] = useState(true);
  const [cursorTooltip, setCursorTooltip] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const { projects } = useProjectStore();
  const { fetchLabels, fetchLabelSets, getLabelsForProjectId, getLabelSetsForProjectId } = useLabelStore();

  const normalizedLabelSetScopeProjectId = useMemo(() => {
    if (!showLabelSetFilter) return undefined;
    if (!selectedProject || selectedProject === 'all') return undefined;
    if (selectedProject === 'personal') return null;
    return selectedProject;
  }, [selectedProject, showLabelSetFilter]);

  const canFilterByLabel = showLabelFilter && selectedProject !== 'all';
  const canFilterByLabelSet = showLabelSetFilter && selectedProject !== 'all';
  const scopedLabels = useMemo(
    () => getLabelsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelsForProjectId, normalizedLabelSetScopeProjectId]
  );
  const scopedLabelSets = useMemo(
    () => getLabelSetsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelSetsForProjectId, normalizedLabelSetScopeProjectId]
  );
  const labelIdsInSets = useMemo(
    () => new Set(scopedLabelSets.flatMap((labelSet) => labelSet.labels.map((label) => label.id))),
    [scopedLabelSets]
  );
  const independentLabels = useMemo(
    () => scopedLabels.filter((label) => !labelIdsInSets.has(label.id)),
    [labelIdsInSets, scopedLabels]
  );
  const labelOptions = useMemo(() => {
    if (!selectedLabelId || independentLabels.some((label) => label.id === selectedLabelId)) {
      return independentLabels;
    }

    const selectedLegacyLabel = scopedLabels.find((label) => label.id === selectedLabelId);
    return selectedLegacyLabel ? [...independentLabels, selectedLegacyLabel] : independentLabels;
  }, [independentLabels, scopedLabels, selectedLabelId]);

  useEffect(() => {
    if (!open || !canFilterByLabel) {
      return;
    }

    fetchLabels(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
  }, [canFilterByLabel, fetchLabels, normalizedLabelSetScopeProjectId, open]);

  useEffect(() => {
    if (!open || !canFilterByLabelSet) {
      return;
    }

    fetchLabelSets(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
  }, [canFilterByLabelSet, fetchLabelSets, normalizedLabelSetScopeProjectId, open]);

  const handleProjectSelect = (nextProjectId: string) => {
    const resolvedProjectId = selectedProject === nextProjectId ? 'all' : nextProjectId;
    onSelectedProjectChange?.(resolvedProjectId);
    setOpen(false);
  };

  const handleLabelSelect = (nextLabelId: string) => {
    const currentLabelIds = selectedLabelIds?.length
      ? selectedLabelIds
      : selectedLabelId
        ? [selectedLabelId]
        : [];
    const nextLabelIds = currentLabelIds.includes(nextLabelId)
      ? currentLabelIds.filter((labelId) => labelId !== nextLabelId)
      : [...currentLabelIds, nextLabelId];

    onSelectedLabelChange?.(null);
    onSelectedLabelIdsChange?.(nextLabelIds.length > 0 ? nextLabelIds : null);
  };

  const handleLabelSetSelect = (nextLabelSetId: string) => {
    const selectedLabelSet = scopedLabelSets.find((labelSet) => labelSet.id === nextLabelSetId);
    if (!selectedLabelSet) {
      return;
    }

    const allLabelIds = selectedLabelSet.labels.map((label) => label.id);
    if (allLabelIds.length === 0) {
      return;
    }

    const currentLabelIds = selectedLabelSetLabelIdsBySet?.[nextLabelSetId]
      ?? (selectedLabelSetId === nextLabelSetId
        ? (selectedLabelSetLabelIds?.length ? selectedLabelSetLabelIds : allLabelIds)
        : []);
    const nextLabelIds = currentLabelIds.length === allLabelIds.length ? [] : allLabelIds;
    const nextBySet = { ...(selectedLabelSetLabelIdsBySet ?? {}) };

    if (nextLabelIds.length > 0) {
      nextBySet[nextLabelSetId] = nextLabelIds;
    } else {
      delete nextBySet[nextLabelSetId];
    }

    onSelectedLabelSetChange?.(null, null);
    onSelectedLabelSetLabelIdsBySetChange?.(Object.keys(nextBySet).length > 0 ? nextBySet : null);
  };

  const handleLabelSetLabelToggle = (labelSetId: string, labelId: string) => {
    const labelSet = scopedLabelSets.find((candidate) => candidate.id === labelSetId);
    if (!labelSet) {
      return;
    }

    const allLabelIds = labelSet.labels.map((label) => label.id);
    const currentLabelIds = selectedLabelSetLabelIdsBySet?.[labelSetId]
      ?? (selectedLabelSetId === labelSetId
        ? (selectedLabelSetLabelIds?.length ? selectedLabelSetLabelIds : allLabelIds)
        : []);
    const nextLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((currentLabelId) => currentLabelId !== labelId)
      : [...currentLabelIds, labelId];
    const nextBySet = { ...(selectedLabelSetLabelIdsBySet ?? {}) };

    if (nextLabelIds.length > 0) {
      nextBySet[labelSetId] = nextLabelIds;
    } else {
      delete nextBySet[labelSetId];
    }

    onSelectedLabelSetChange?.(null, null);
    onSelectedLabelSetLabelIdsBySetChange?.(Object.keys(nextBySet).length > 0 ? nextBySet : null);
  };

  const handleDateRangeSelect = (nextRange: TaskDateRange) => {
    const resolvedRange = value === nextRange ? TaskDateRange.ALL_TIME : nextRange;
    onChange(resolvedRange);
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              'bg-white dark:text-primary flex items-center justify-between h-9',
              triggerClassName
            )}
          >
            <FilterIcon
              className={cn(
                'w-4 h-4',
                hasActiveFilters
                  ? 'text-purple-500 fill-purple-500'
                  : 'text-muted-foreground'
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-72 p-1.5">
          {showProjectSelect && (
            <>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  setProjectExpanded(v => !v);
                }}
              >
                <span className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  Project
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    projectExpanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {projectExpanded && (
                <>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleProjectSelect('all');
                    }}
                    className="flex items-center justify-between ml-2"
                  >
                    <span>All Tasks</span>
                    {selectedProject === 'all' && <Check className="w-4 h-4 text-green-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleProjectSelect('personal');
                    }}
                    className="flex items-center justify-between ml-2"
                  >
                    <span>Personal Tasks(non-project)</span>
                    {selectedProject === 'personal' && <Check className="w-4 h-4 text-green-600" />}
                  </DropdownMenuItem>

                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        handleProjectSelect(p.id);
                      }}
                      className="flex items-center justify-between ml-2"
                    >
                      <span className="truncate">{p.name}</span>
                      {selectedProject === p.id && <Check className="w-4 h-4 text-green-600" />}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
            </>
          )}

          {showLabelFilter && (
            <>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  setLabelExpanded((value) => !value);
                }}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  Label
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    labelExpanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {labelExpanded && (
                <>
                  {!canFilterByLabel ? (
                    <DropdownMenuLabel className="ml-2 text-xs text-muted-foreground font-normal">
                      Select a concrete project or personal scope first.
                    </DropdownMenuLabel>
                  ) : labelOptions.length === 0 ? (
                    <DropdownMenuLabel className="ml-2 text-xs text-muted-foreground font-normal">
                      No labels available.
                    </DropdownMenuLabel>
                  ) : (
                    <>
                      {labelOptions.map((label) => {
                        const checked = (selectedLabelIds?.length ? selectedLabelIds : selectedLabelId ? [selectedLabelId] : []).includes(label.id);

                        return (
                          <DropdownMenuItem
                            key={label.id}
                            onSelect={(e) => {
                              e.preventDefault();
                              handleLabelSelect(label.id);
                            }}
                            className="flex items-center justify-between ml-2"
                          >
                            <LabelBadge text={label.name} color={label.color} className="pointer-events-none !px-2 !py-0.5" />
                            {checked && <Check className="w-4 h-4 text-green-600" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              <DropdownMenuSeparator />
            </>
          )}

          {showLabelSetFilter && (
            <>
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  setLabelSetExpanded((value) => !value);
                }}
              >
                <span className="flex items-center gap-2">
                  <Rows3 className="w-4 h-4 text-muted-foreground" />
                  Label set
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    labelSetExpanded ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>

              {labelSetExpanded && (
                <>
                  {!canFilterByLabelSet ? (
                    <DropdownMenuLabel className="ml-2 text-xs text-muted-foreground font-normal">
                      Select a concrete project or personal scope first.
                    </DropdownMenuLabel>
                  ) : scopedLabelSets.length === 0 ? (
                    <DropdownMenuLabel className="ml-2 text-xs text-muted-foreground font-normal">
                      No label sets available.
                    </DropdownMenuLabel>
                  ) : (
                    <>
                      {scopedLabelSets.map((labelSet) => {
                        const allLabelIds = labelSet.labels.map((label) => label.id);
                        const selectedLabelIdsForSet = selectedLabelSetLabelIdsBySet?.[labelSet.id]
                          ?? (selectedLabelSetId === labelSet.id
                            ? (selectedLabelSetLabelIds?.length ? selectedLabelSetLabelIds : allLabelIds)
                            : []);
                        const labelSetChecked = selectedLabelIdsForSet.length > 0;
                        const partiallyChecked = labelSetChecked && selectedLabelIdsForSet.length < allLabelIds.length;

                        return (
                          <DropdownMenuSub key={labelSet.id}>
                            <DropdownMenuSubTrigger
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleLabelSetSelect(labelSet.id);
                              }}
                              className="ml-2 gap-2 pr-2 [&>svg:last-child]:ml-2 [&>svg:last-child]:self-center"
                            >
                              <span className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-1">
                                <span
                                  className="min-w-0 flex-1 truncate"
                                  onPointerEnter={(event) => {
                                    setCursorTooltip({ x: event.clientX, y: event.clientY, visible: true });
                                  }}
                                  onPointerMove={(event) => {
                                    setCursorTooltip({ x: event.clientX, y: event.clientY, visible: true });
                                  }}
                                  onPointerLeave={() => {
                                    setCursorTooltip((current) => ({ ...current, visible: false }));
                                  }}
                                >
                                  {labelSet.name}
                                </span>
                                {labelSetChecked && (
                                  <Check className={cn('h-4 w-4 shrink-0 self-center text-green-600', partiallyChecked && 'opacity-50')} />
                                )}
                              </span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="min-w-56 p-1.5">
                              {labelSet.labels.length === 0 ? (
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                  No labels in this set.
                                </DropdownMenuLabel>
                              ) : (
                                labelSet.labels.map((label) => {
                                  const checked = selectedLabelIdsForSet.includes(label.id);

                                  return (
                                    <DropdownMenuItem
                                      key={label.id}
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleLabelSetLabelToggle(labelSet.id, label.id);
                                      }}
                                      className="flex items-center justify-between"
                                    >
                                      <LabelBadge text={label.name} color={label.color} className="pointer-events-none !px-2 !py-0.5" />
                                      {checked && <Check className="h-4 w-4 text-green-600" />}
                                    </DropdownMenuItem>
                                  );
                                })
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              <DropdownMenuSeparator />
            </>
          )}

          <button
            type="button"
            className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
            onClick={(e) => {
              e.preventDefault();
              setDateRangeExpanded(v => !v);
            }}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Date range
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                dateRangeExpanded ? 'rotate-180' : 'rotate-0'
              )}
            />
          </button>

          {dateRangeExpanded && (
            <>
              {RANGE_OPTIONS.map((opt) => {
                const active = opt.value === value;
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    onSelect={(e) => {
                      // Radix DropdownMenuItem triggers `onSelect` with a custom event.
                      // Prevent default so it doesn't interfere with our controlled state update.
                      e.preventDefault();
                      handleDateRangeSelect(opt.value);
                    }}
                    className="flex items-center justify-between ml-2"
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-4 h-4 text-green-600" />}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {cursorTooltip.visible && (
        <div
          className="pointer-events-none fixed z-60 max-w-64 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md"
          style={{ left: cursorTooltip.x, top: cursorTooltip.y }}
        >
          Click the label set to select or clear all labels in this set.
        </div>
      )}
    </div>
  );
}
