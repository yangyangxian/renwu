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
      <PopoverContent align="end" className="w-46 p-2">
        <div className="flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => { setOpen(false); onOverride(); }}
            disabled={disabled}
            className="flex items-center justify-start gap-2"
          >
            <Save className="h-4 w-4 shrink-0" />
            <span>Save current view</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setOpen(false); onOpenDialog(); }}
            className="flex items-center justify-start gap-2"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Save as a new view</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
