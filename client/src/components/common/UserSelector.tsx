import React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
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
  return (
    <Popover>
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

      <PopoverContent className="w-auto p-1" align="start" sideOffset={6}>
        <div className="min-w-[140px] max-h-[280px] overflow-auto">
          <div className="flex flex-col">
            {options.map(opt => (
              <RadixPopover.Close asChild key={opt.value}>
                <Button
                  type="button"
                  onClick={() => onSelect(opt.value)}
                  variant="ghost"
                  className="w-full justify-start p-1 px-[6px] hover:bg-muted rounded-none cursor-pointer flex items-center gap-3"
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-base text-primary">{opt.avatarText ?? String(opt.label).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Label className="text-sm text-secondary-foreground cursor-pointer">{opt.label}</Label>
                </Button>
              </RadixPopover.Close>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelector;
