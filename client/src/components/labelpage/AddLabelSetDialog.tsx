import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui-kit/Dialog';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Label as UILabel } from '@/components/ui-kit/Label';
import { apiClient } from '@/utils/APIClient';
import { withToast } from '@/utils/toastUtils';
import { useLabelStore } from '@/stores/useLabelStore';
import { Plus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui-kit/Select';
import { createLabelInSet, createLabelSet, getMyLabelSets } from '@/apiRequests/apiEndpoints';

interface AddLabelSetDialogProps {
  onCreated?: (id: string) => void;
  triggerClassName?: string;
  projectId?: string;
}

export const AddLabelSetDialog: React.FC<AddLabelSetDialogProps> = ({ onCreated, triggerClassName, projectId }) => {
  const { fetchLabelSets } = useLabelStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personalSets, setPersonalSets] = useState<any[]>([]);
  const [selectedPersonalSetId, setSelectedPersonalSetId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
      setMode('create');
      setSelectedPersonalSetId('');
      setPersonalSets([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Load personal sets when switching into import mode
  useEffect(() => {
    if (!open) return;
    if (mode !== 'import') return;
    // Only meaningful on project dialog
    if (!projectId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<any[]>(getMyLabelSets());
        const rows = Array.isArray(res) ? res : [];
        if (!cancelled) setPersonalSets(rows);
      } catch (e) {
        if (!cancelled) setPersonalSets([]);
      }
    })();
    return () => { cancelled = true; };
  }, [open, mode, projectId]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await withToast(async () => {
        const created = await apiClient.post(createLabelSet(), { labelSetName: name.trim(), projectId });
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

  const handleImport = useCallback(async () => {
    if (!projectId) { setError('Project is required'); return; }
    if (!selectedPersonalSetId) { setError('Please select a personal label set'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await withToast(async () => {
        const source = personalSets.find(s => s.id === selectedPersonalSetId);
        if (!source) throw new Error('Selected label set not found');

        // 1) create project label set
        const createdSet = await apiClient.post(createLabelSet(), {
          labelSetName: (source.labelSetName || source.name || 'Imported set') as string,
          labelSetDescription: source.labelSetDescription || undefined,
          projectId,
        });
        const newSetId = (createdSet as any)?.id;
        if (!newSetId) throw new Error('Failed to create project label set');

        // 2) copy labels into the new set (create new labels under project)
        const sourceLabels = Array.isArray(source.labels) ? source.labels : [];
        for (const l of sourceLabels) {
          await apiClient.post(createLabelInSet(newSetId), {
            labelName: l.labelName || l.name || '',
            description: l.labelDescription || l.description || undefined,
            color: l.labelColor || l.color || undefined,
          });
        }

        await fetchLabelSets(projectId);
        setOpen(false);
      }, { success: 'Imported label set', error: 'Failed to import label set' });
    } catch (e: any) {
      setError(e?.message || 'Failed to import label set');
    } finally {
      setSubmitting(false);
    }
  }, [projectId, selectedPersonalSetId, personalSets, fetchLabelSets]);

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
          <DialogTitle className="text-base">{mode === 'create' ? 'New label set' : 'Add personal label set'}</DialogTitle>
        </DialogHeader>
        {mode === 'create' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <UILabel htmlFor="label-set-name" className="text-[13px] font-medium">Name</UILabel>
              <Input id="label-set-name" ref={inputRef} placeholder="Label set name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {projectId && (
              <button
                type="button"
                className="text-xs text-primary underline underline-offset-4 text-left cursor-pointer"
                onClick={() => { setError(null); setMode('import'); }}
              >
                Add an existing personal label set
              </button>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter className="flex justify-end gap-2 mt-1">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <UILabel className="text-[13px] font-medium">Personal label set</UILabel>
              <Select value={selectedPersonalSetId} onValueChange={setSelectedPersonalSetId}>
                <SelectTrigger>
                  <SelectValue placeholder={personalSets.length ? 'Select a label set' : 'No personal label sets'} />
                </SelectTrigger>
                <SelectContent>
                  {personalSets.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.labelSetName || s.name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              className="text-xs underline underline-offset-4 text-left cursor-pointer"
              onClick={() => { setError(null); setMode('create'); setTimeout(() => inputRef.current?.focus(), 50); }}
            >
              Back to create new label set
            </button>

            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter className="flex justify-end gap-2 mt-1">
              <DialogClose asChild>
                <Button variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="button" size="sm" disabled={submitting || !selectedPersonalSetId} onClick={handleImport}>
                {submitting ? 'Adding...' : 'Add to project'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddLabelSetDialog;
