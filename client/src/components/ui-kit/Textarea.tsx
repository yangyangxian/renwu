import { cn } from "@/lib/utils"
import { Button } from "./Button";
import { useState, useEffect, useLayoutEffect } from "react";
import { useRef } from "react";

type TextareaProps = Omit<React.ComponentProps<"textarea">, "value" | "onChange" | "onSubmit" | "onCancel"> & {
  autoSize?: boolean;
  onCancel?: () => void;
  onSubmit?: (value: string) => void;
  initialValue?: string;
};

function Textarea({ className, onBlur, autoSize = false, onCancel, onSubmit, initialValue = "", ...props }: TextareaProps) {
  const [editedValue, setEditedValue] = useState<string>(initialValue);
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  // If initialValue changes (e.g. new project), update state
  useEffect(() => {
    setEditedValue(initialValue);
  }, [initialValue]);

  // Handle changes: update local editedValue only
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cancel on Escape
    if (e.key === "Escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      }
      return;
    }
    // Tab for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // Insert tab character using execCommand (deprecated but still works)
      if (document.execCommand) {
        document.execCommand('insertText', false, '\t');
      } else {
        // Fallback for modern browsers
        const value = textarea.value;
        const newValue = value.substring(0, start) + '\t' + value.substring(end);
        // Directly set the value
        textarea.value = newValue;
        // Set cursor position
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        // Trigger input event to notify React
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
      }
      return;
    }
  };

  return (
    <>
      <textarea
        data-slot="textarea"
        ref={localRef}
        value={editedValue}
        className={cn(
          "flex-1 resize-none border-input text-primary placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent p-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-32 max-h-[60vh]",
          className
        )}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
      {(onSubmit || onCancel) && (
        <div className="flex justify-end gap-2 mt-2 mr-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onSubmit && (
            <Button type="button" onClick={() => onSubmit(editedValue)}>
              Save
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export { Textarea };
