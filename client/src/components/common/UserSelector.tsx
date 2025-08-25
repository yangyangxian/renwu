import React, { useState, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui-kit/Popover';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { Button } from '@/components/ui-kit/Button';
import { Label } from '@/components/ui-kit/Label';

interface Option {
  value: string;
  label: string;
  avatarText?: string;
}

interface UserSelectorProps {
  options: Option[];
  currentValue?: { id?: string | number; name?: string } | null;
  onSelect: (userId: string) => Promise<void> | void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ options, currentValue, onSelect }) => {
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
        <Button type="button" variant="outline" className="text-left h-8 flex items-center justify-between px-[10px]">
            <Avatar className="size-6">
              <AvatarFallback className="text-base">
                {currentValue && currentValue.name ? String(currentValue.name).charAt(0).toUpperCase() : '-'}
              </AvatarFallback>
            </Avatar>
            <Label className='cursor-pointer'>{currentValue && currentValue.name ? currentValue.name : 'Unassigned'}</Label>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-1 w-auto">
        <div className="max-h-[280px] overflow-auto flex-col">
          {options.map(opt => (
            <Button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              variant="ghost"
              className="w-full px-[6px] hover:bg-muted cursor-pointer flex justify-start"
            >
              <Avatar className="size-6">
                <AvatarFallback className="text-base text-primary">{opt.avatarText ?? String(opt.label).charAt(0).toUpperCase()}</AvatarFallback>
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
