import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui-kit/Dialog';
import { Button } from '@/components/ui-kit/Button';
import { Plus } from 'lucide-react';
import { useLabelStore } from '@/stores/useLabelStore';
import LabelDialogFormFields, { randomLabelColor } from '@/components/labelpage/LabelDialogFormFields';

interface AddLabelDialogProps {
  onCreated?: (id: string) => void;
  triggerClassName?: string;
  /** If provided, create the new label inside this label set */
  labelSetId?: string;
  /** If provided, create the new label under this project */
  projectId?: string;
}

export const AddLabelDialog: React.FC<AddLabelDialogProps> = ({ onCreated, triggerClassName, labelSetId, projectId }) => {
  const { createLabel, addLabelToSet } = useLabelStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(randomLabelColor());
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // reset form when opened
      setName('');
      setDescription('');
      const initial = randomLabelColor();
      setColor(initial);
      setError(null);
      // slight delay to ensure focus after animation
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open]);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Color must be a valid 6‑digit hex';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError(null);
    try {
      if (labelSetId) {
        const created = await addLabelToSet(labelSetId, { labelName: name, description: description.trim() || undefined, color, projectId });
        if (onCreated) onCreated((created as any).id);
      } else {
        const created = await createLabel({ labelName: name, description: description.trim() || undefined, color, projectId });
        if (onCreated) onCreated((created as any).id);
      }
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to create label');
    } finally {
      setSubmitting(false);
    }
  }, [name, description, color, createLabel, addLabelToSet, labelSetId, onCreated]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLFormElement> = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submitting) handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add new label"
            className={`p-1 w-5! h-5 flex items-center justify-center rounded-sm bg-primary-purple/60 dark:bg-muted/70 hover:bg-primary-purple hover:text-white text-white ${triggerClassName || ''}`}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base">New label</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-5" onKeyDown={handleKeyDown} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <>
            <LabelDialogFormFields
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              color={color}
              onColorChange={setColor}
              error={error}
              nameInputRef={nameInputRef}
              nameInputId="label-name"
            />
          </>
          {error && <p className="text-xs text-destructive -mt-2">{error}</p>}
          <DialogFooter className="mt-2 flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? 'Creating...' : 'Create label'}
              <span className="hidden sm:inline text-xs text-muted-foreground"></span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLabelDialog;
