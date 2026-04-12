import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, FilterIcon, Folder, Rows3 } from 'lucide-react';
import { TaskDateRange } from '@fullstack/common';
import { Button } from '@/components/ui-kit/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui-kit/Dropdown-menu';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { useLabelStore } from '@/stores/useLabelStore';

export interface TaskFilterDropdownProps {
  value: TaskDateRange;
  onChange: (value: TaskDateRange) => void;

  /** Optional project filter (same options as TaskFilterMenu's Select). */
  showProjectSelect?: boolean;
  selectedProject?: string;
  onSelectedProjectChange?: (projectId: string) => void;
  showLabelSetFilter?: boolean;
  selectedLabelSetId?: string | null;
  onSelectedLabelSetChange?: (labelSetId: string | null) => void;

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
  showProjectSelect,
  selectedProject,
  onSelectedProjectChange,
  showLabelSetFilter,
  selectedLabelSetId,
  onSelectedLabelSetChange,
  disabled,
  className,
  triggerClassName,
}: TaskFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [dateRangeExpanded, setDateRangeExpanded] = useState(true);
  const [labelSetExpanded, setLabelSetExpanded] = useState(true);
  const { projects } = useProjectStore();
  const { fetchLabelSets, getLabelSetsForProjectId } = useLabelStore();

  const normalizedLabelSetScopeProjectId = useMemo(() => {
    if (!showLabelSetFilter) return undefined;
    if (!selectedProject || selectedProject === 'all') return undefined;
    if (selectedProject === 'personal') return null;
    return selectedProject;
  }, [selectedProject, showLabelSetFilter]);

  const canFilterByLabelSet = showLabelSetFilter && selectedProject !== 'all';
  const scopedLabelSets = useMemo(
    () => getLabelSetsForProjectId(normalizedLabelSetScopeProjectId),
    [getLabelSetsForProjectId, normalizedLabelSetScopeProjectId]
  );

  useEffect(() => {
    if (!open || !canFilterByLabelSet) {
      return;
    }

    fetchLabelSets(normalizedLabelSetScopeProjectId ?? undefined, { setActiveScope: false });
  }, [canFilterByLabelSet, fetchLabelSets, normalizedLabelSetScopeProjectId, open]);

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
            <FilterIcon className="text-muted-foreground w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-64 p-1.5">
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
                      onSelectedProjectChange?.('all');
                      setOpen(false);
                    }}
                    className="flex items-center justify-between ml-2"
                  >
                    <span>All Tasks</span>
                    {selectedProject === 'all' && <Check className="w-4 h-4 text-green-600" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      onSelectedProjectChange?.('personal');
                      setOpen(false);
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
                        onSelectedProjectChange?.(p.id);
                        setOpen(false);
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
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onSelectedLabelSetChange?.(null);
                          setOpen(false);
                        }}
                        className="flex items-center justify-between ml-2"
                      >
                        <span>All label sets</span>
                        {selectedLabelSetId == null && <Check className="w-4 h-4 text-green-600" />}
                      </DropdownMenuItem>
                      {scopedLabelSets.map((labelSet) => (
                        <DropdownMenuItem
                          key={labelSet.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            onSelectedLabelSetChange?.(labelSet.id);
                            setOpen(false);
                          }}
                          className="flex items-center justify-between ml-2"
                        >
                          <span className="truncate">{labelSet.name}</span>
                          {selectedLabelSetId === labelSet.id && <Check className="w-4 h-4 text-green-600" />}
                        </DropdownMenuItem>
                      ))}
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
                      onChange(opt.value);
                      setOpen(false);
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
    </div>
  );
}
