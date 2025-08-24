import React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { Avatar, AvatarFallback } from '@/components/ui-kit/Avatar';
import { Button } from '@/components/ui-kit/Button';

interface Option {
  value: string;
  label: string;
  avatarText?: string;
}

interface UserSelectPopoverProps {
  options: Option[];
  currentValue?: { id?: string | number; name?: string } | null;
  onSelect: (userId: string) => Promise<void> | void;
}

const UserSelectPopover: React.FC<UserSelectPopoverProps> = ({ options, currentValue, onSelect }) => {
  return (
    <div className="w-[260px] max-h-[280px] overflow-auto">
      <div className="flex flex-col">
        {options.map(opt => (
          <RadixPopover.Close asChild key={opt.value}>
            <Button
              type="button"
              onClick={() => onSelect(opt.value)}
              variant="ghost"
              className="w-full justify-start p-1 rounded hover:bg-muted flex items-center gap-3"
            >
              <Avatar className="size-5">
                <AvatarFallback className="text-base text-primary">{opt.avatarText ?? String(opt.label).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-secondary-foreground">{opt.label}</span>
            </Button>
          </RadixPopover.Close>
        ))}
      </div>
    </div>
  );
};

export default UserSelectPopover;
