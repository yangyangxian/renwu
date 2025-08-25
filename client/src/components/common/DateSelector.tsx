import React from "react";
import { Button } from "@/components/ui-kit/Button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui-kit/Popover";
import { Calendar } from "@/components/ui-kit/Calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui-kit/Label";

interface DateSelectorProps {
  value?: string;
  onChange: (date?: string) => void;
  label?: string;
  clearLabel?: string;
  className?: string;
  buttonClassName?: string;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  value,
  onChange,
  label = "",
  clearLabel = "Clear",
  className = "",
  buttonClassName = "",
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm">{label}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {value ? (
            <Button
              type="button"
              variant="outline"
              className={`h-8 text-left justify-between px-[10px] text-secondary-foreground text-sm ${buttonClassName}`}
              aria-label="Select due date"
              onClick={() => setOpen(true)}
            >
              <CalendarIcon className="size-4" />
              <Label className="cursor-pointer">
                {new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
              </Label>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={`h-7 w-7 flex items-center justify-center ${buttonClassName}`}
              aria-label="Select due date"
              onClick={() => setOpen(true)}
            >
              <CalendarIcon className="size-3" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col p-1">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={d => {
                if (d) {
                  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  onChange(iso);
                  setOpen(false);
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="self-end px-2 mr-3 text-sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {clearLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateSelector;
