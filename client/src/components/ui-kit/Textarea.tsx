
import { cn } from "@/lib/utils"
import { Button } from "./Button";
import { Info, Pencil } from "lucide-react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./Hover-card";
import { useWebStorage } from "@/hooks/useWebStorage";
import { useImperativeHandle, useRef } from "react";

type TextareaProps = Omit<React.ComponentProps<"textarea">, "value" | "onChange" | "onSubmit" | "onCancel"> & {
  autoSize?: boolean;
  onCancel?: () => void;
  onSubmit?: (value: string) => void;
  initialValue?: string;
  showButtons?: boolean;
  storageKey?: string; // unique key for localStorage, required for unique drafts
};

function getStorageKey(props: any) {
  // Only use localStorage if storageKey is provided
  if (props.storageKey) return `textarea-draft-${props.storageKey}`;
  return null;
}

function Textarea({ ref, className, onBlur, autoSize = false, onCancel, onSubmit, initialValue = "", showButtons = true, storageKey: storageKeyProp, ...props }: TextareaProps) {
  // Compute storage key for this instance
  const storageKey = getStorageKey({ ...props, storageKey: storageKeyProp });

  // Use generic localStorage hook for draft logic
  const [editedValue, setEditedValue, storage] = useWebStorage(
    storageKey,
    initialValue,
    storageKey ? { storageType: 'session' } : undefined
  );

  useImperativeHandle(ref, () => {
    return {
      get value() {
        return editedValue;
      },
      clearUnsavedCache() {
        clearCache();
      }
    };
  }, [editedValue]);

  function clearCache() {
    if (typeof window !== 'undefined' && storageKey) {
      storage.remove();
    }
  };

  // Detect unsaved changes: only if editedValue is different from initialValue and not empty
  const hasChanges = (
    editedValue !== initialValue &&
    editedValue.trim() !== ''
  );

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
    <div className={cn("flex flex-col h-full", className)}>
      <textarea
        data-slot="textarea"
        value={editedValue}
        className="flex-1 resize-none border-input text-primary placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 w-full rounded-md border bg-transparent p-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-[0.95rem] min-h-32"
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
      <div className="flex items-center justify-end gap-2 mt-4 mr-4">
        {hasChanges && (
          <span className="flex items-center gap-1 text-sm text-primary/80 select-none">
            <Pencil className="w-4 h-4" aria-label="You have unsaved changes" />
            <span className="font-medium text-xs text-primary/70">Unsaved changes</span>
          </span>
        )}
        <HoverCard openDelay={0}>
          <HoverCardTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
          </HoverCardTrigger>
          <HoverCardContent className="w-80 text-xs leading-relaxed">
            <div className="font-semibold text-sm mb-2">Markdown Syntax</div>
            <ul className="list-disc pl-5">
              <li><b>Bold:</b> <code>**bold**</code> or <code>__bold__</code></li>
              <li><b>Italic:</b> <code>*italic*</code> or <code>_italic_</code></li>
              <li><b>Link:</b> <code>[title](url)</code></li>
              <li><b>List:</b> <code>* item</code></li>
              <li><b>Number List:</b> <code> 1. item</code></li>
              <li><b>Heading:</b> <code># H1</code>, <code>## H2</code>, ...</li>
              <li><b>Code:</b> <code>`inline code`</code> or <code>```block```</code></li>
            </ul>
          </HoverCardContent>
        </HoverCard>
        {showButtons && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {showButtons && onSubmit && (
          <Button type="button" onClick={() => {
            clearCache();
            onSubmit(editedValue);
          }}>
            Save
          </Button>
        )}
      </div>
    </div>
  );
}

export { Textarea };
