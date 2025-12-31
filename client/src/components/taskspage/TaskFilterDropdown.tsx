import React, { useMemo, useState } from 'react';
import { Check, FilterIcon } from 'lucide-react';
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

export interface TaskFilterDropdownProps {
  value: TaskDateRange;
  onChange: (value: TaskDateRange) => void;
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
  disabled,
  className,
  triggerClassName,
}: TaskFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    return RANGE_OPTIONS.find((o) => o.value === value)?.label ?? 'Date range';
  }, [value]);

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

        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Date range</DropdownMenuLabel>
          <DropdownMenuSeparator />
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
                className="flex items-center justify-between"
              >
                <span>{opt.label}</span>
                {active && <Check className="w-4 h-4 text-green-600" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
