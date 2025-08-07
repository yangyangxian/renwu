import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Button } from "@/components/ui-kit/Button";
import { Plus, Save } from "lucide-react";


interface SaveTaskViewPopoverProps {
  onSaveNew: () => void;
  onOverride: () => void;
  onOpenDialog: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const SaveTaskViewPopover: React.FC<SaveTaskViewPopoverProps> = ({
  onSaveNew,
  onOverride,
  onOpenDialog,
  disabled,
  children,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => { setOpen(false); onOpenDialog(); }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4 align-middle -ml-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            Save as new task view
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOpen(false); onOverride(); }}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4 align-middle" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            Save (override current)
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
