import React, { useState, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui-kit/Popover';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { Button } from '@/components/ui-kit/Button';
import { Label } from '@/components/ui-kit/Label';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  avatarText?: string;
}

interface UserSelectorProps {
  options: Option[];
  currentValue?: { id?: string | number; name?: string } | null;
  onSelect: (userId: string) => Promise<void> | void;
  triggerClassName?: string;
  triggerLabelClassName?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({ options, currentValue, onSelect, triggerClassName, triggerLabelClassName }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(async (value: string) => {
    try {
      await onSelect(value);
    } finally {
      setOpen(false);
    }
  }, [onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('text-left h-8 flex items-center justify-between px-2.5', triggerClassName)}
        >
            <Avatar className="size-6">
              <AvatarFallback className="text-sm">
                {currentValue && currentValue.name ? String(currentValue.name).charAt(0).toUpperCase() : '-'}
              </AvatarFallback>
            </Avatar>
            <Label className={cn('cursor-pointer', triggerLabelClassName)}>{currentValue && currentValue.name ? currentValue.name : 'Unassigned'}</Label>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto overflow-hidden p-0">
        <div className="flex max-h-70 flex-col overflow-auto">
          {options.map(opt => (
            <Button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              variant="ghost"
              className="flex w-full justify-start rounded-none px-2 py-2 shadow-none hover:bg-muted cursor-pointer"
            >
              <Avatar className="size-6">
                <AvatarFallback className="text-sm text-primary">{opt.avatarText ?? String(opt.label).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Label className="text-sm text-secondary-foreground cursor-pointer">{opt.label}</Label>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelector;
