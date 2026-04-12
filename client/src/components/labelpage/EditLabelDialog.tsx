import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui-kit/Button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui-kit/Dialog';
import { withToast } from '@/utils/toastUtils';
import { useLabelStore } from '@/stores/useLabelStore';
import LabelDialogFormFields, { randomLabelColor } from '@/components/labelpage/LabelDialogFormFields';

interface EditableLabel {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface EditLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: EditableLabel | null;
}

export default function EditLabelDialog({ open, onOpenChange, label }: EditLabelDialogProps) {
  const { updateLabel } = useLabelStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#64748b');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || !label) {
      return;
    }

    const nextColor = label.color && /^#[0-9A-Fa-f]{6}$/.test(label.color) ? label.color : randomLabelColor();
    setName(label.name);
    setDescription(label.description ?? '');
    setColor(nextColor);
    setError(null);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [label, open]);

  const validate = useCallback(() => {
    if (!label?.id) return 'Missing label';
    if (!name.trim()) return 'Name is required';
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Color must be a valid 6-digit hex';
    return null;
  }, [color, label?.id, name]);

  const handleSave = useCallback(async () => {
    const validationError = validate();
    if (validationError || !label) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await withToast(
        async () => updateLabel(label.id, { name: name.trim(), description: description.trim(), color }),
        { success: 'Label updated', error: 'Failed to update label' }
      );
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update label');
    } finally {
      setSubmitting(false);
    }
  }, [color, description, label, name, onOpenChange, updateLabel, validate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base">Edit label</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <LabelDialogFormFields
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            color={color}
            onColorChange={setColor}
            error={error}
            nameInputRef={nameInputRef}
            nameInputId="edit-label-name"
          />

          {error && <p className="text-xs text-destructive -mt-2">{error}</p>}

          <DialogFooter className="mt-2 flex items-center justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}