import { cn } from "@/lib/utils"
import { useState, useEffect, useLayoutEffect } from "react";

function Textarea({ className, onChange, onBlur, autoSize = false, onCancel, ...props }: React.ComponentProps<"textarea"> & {
  autoSize?: boolean;
  onCancel?: () => void;
}) {
  const [originalValue, setOriginalValue] = useState<string>("");

  // Store original value when component mounts or value prop changes
  useEffect(() => {
    setOriginalValue(props.value?.toString() || "");
  }, [props.value]);

  // Auto-grow function (only used when autoSize is true)
  const autoGrow = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Auto-grow on mount and when value changes (before paint)
  useLayoutEffect(() => {
    if (props.ref?.current) {
      autoGrow(props.ref?.current);
    }
  }, [props.value]);

  // Handle changes with conditional auto-grow
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e);
    autoGrow(e.target);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {    
    // Handle ESC key to cancel changes and revert to original value
    if (e.key === "Escape") {
      e.preventDefault();
      const textarea = e.currentTarget;
      
      // Revert to original value
      textarea.value = originalValue;
      
      // Trigger input event to notify React of the change
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
      
      // Call onCancel callback to handle UI state (like setEditingDesc(false))
      if (onCancel) {
        onCancel();
      }
      
      return;
    }
    
    // Handle Tab key for indentation
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
    }
  };

  return (
    <>
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input text-primary placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent p-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      onBlur={onBlur}
      {...props}
    />
    </>
  );
}

export { Textarea };
