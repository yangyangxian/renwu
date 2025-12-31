import React, { useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, FilterIcon, Folder } from 'lucide-react';
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

export interface TaskFilterDropdownProps {
  value: TaskDateRange;
  onChange: (value: TaskDateRange) => void;

  /** Optional project filter (same options as TaskFilterMenu's Select). */
  showProjectSelect?: boolean;
  selectedProject?: string;
  onSelectedProjectChange?: (projectId: string) => void;

  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

const RANGE_OPTIONS: Array<{ value: TaskDateRange; label: string }> = [
  { value: TaskDateRange.LAST_3_MONTHS, label: 'Last 3 months' },
  { value: TaskDateRange.LAST_1_YEAR, label: 'Last 1 year' },
  { value: TaskDateRange.ALL_TIME, label: 'All Time' },
];

export function TaskFilterDropdown({
  value,
  onChange,
  showProjectSelect,
  selectedProject,
  onSelectedProjectChange,
  disabled,
  className,
  triggerClassName,
}: TaskFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [projectExpanded, setProjectExpanded] = useState(true);
  const [dateRangeExpanded, setDateRangeExpanded] = useState(true);
  const { projects } = useProjectStore();

  const label = useMemo(() => {
    return RANGE_OPTIONS.find((o) => o.value === value)?.label ?? 'Date range';
  }, [value]);

  const projectLabel = useMemo(() => {
    if (!showProjectSelect) return '';
    if (!selectedProject || selectedProject === 'all') return 'All tasks';
    if (selectedProject === 'personal') return 'Personal tasks';
    return projects.find((p) => p.id === selectedProject)?.name ?? 'Project';
  }, [projects, selectedProject, showProjectSelect]);

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

        <DropdownMenuContent className="min-w-64 p-2">
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
