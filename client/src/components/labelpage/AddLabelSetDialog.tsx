import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui-kit/Dialog';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Label as UILabel } from '@/components/ui-kit/Label';
import { apiClient } from '@/utils/APIClient';
import { withToast } from '@/utils/toastUtils';
import { useLabelStore } from '@/stores/useLabelStore';
import { Plus } from 'lucide-react';

interface AddLabelSetDialogProps {
  onCreated?: (id: string) => void;
  triggerClassName?: string;
  projectId?: string;
}

export const AddLabelSetDialog: React.FC<AddLabelSetDialogProps> = ({ onCreated, triggerClassName, projectId }) => {
  const { fetchLabelSets } = useLabelStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await withToast(async () => {
        const created = await apiClient.post('/api/labels/sets', { labelSetName: name.trim(), projectId });
        if (onCreated && created && (created as any).id) onCreated((created as any).id);

        await fetchLabelSets(projectId);
        setOpen(false);
      }, { success: 'Label set created', error: 'Failed to create label set' });
    } catch (e: any) {
      setError(e?.message || 'Failed to create label set');
    } finally {
      setSubmitting(false);
    }
  }, [name, onCreated, fetchLabelSets, projectId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add label set"
          className={`!p-1 w-5 h-5 flex items-center justify-center rounded-sm bg-gray-200 dark:bg-muted/70 hover:bg-gray-200/70 text-muted-foreground ${triggerClassName || ''}`}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base">New label set</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <UILabel htmlFor="label-set-name" className="text-[13px] font-medium">Name</UILabel>
            <Input id="label-set-name" ref={inputRef} placeholder="Label set name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLabelSetDialog;
