import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui-kit/Dialog';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Label as UILabel } from '@/components/ui-kit/Label';
import { Textarea } from '@/components/ui-kit/Textarea';
import LabelBadge from '@/components/common/LabelBadge';
import { RotateCcw, Plus, Check } from 'lucide-react';
import { useLabelStore } from '@/stores/useLabelStore';

interface AddLabelDialogProps {
  onCreated?: (id: string) => void;
  triggerClassName?: string;
  /** If provided, create the new label inside this label set */
  labelSetId?: string;
  /** If provided, create the new label under this project */
  projectId?: string;
}

const randomColor = () => {
  // Avoid extremes (too light/dark) by constraining channels 40-200
  const ch = () => (40 + Math.floor(Math.random() * 160)).toString(16).padStart(2, '0');
  return `#${ch()}${ch()}${ch()}`;
};

export const AddLabelDialog: React.FC<AddLabelDialogProps> = ({ onCreated, triggerClassName, labelSetId, projectId }) => {
  const { createLabel, addLabelToSet } = useLabelStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(randomColor()); // applied (validated) color for preview/button
  const [draftColor, setDraftColor] = useState<string>(color); // raw input field value
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorFieldWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      // reset form when opened
      setName('');
      setDescription('');
      const initial = randomColor();
      setColor(initial);
      setDraftColor(initial);
      setError(null);
      // slight delay to ensure focus after animation
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [open]);

    // Close color panel on outside click
    useEffect(() => {
      if (!colorPickerOpen) return;
      const handler = (e: MouseEvent) => {
        if (!colorFieldWrapperRef.current) return;
        if (!colorFieldWrapperRef.current.contains(e.target as Node)) {
          setColorPickerOpen(false);
        }
      };
      const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setColorPickerOpen(false); };
      window.addEventListener('mousedown', handler);
      window.addEventListener('keydown', esc);
      return () => { window.removeEventListener('mousedown', handler); window.removeEventListener('keydown', esc); };
    }, [colorPickerOpen]);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Color must be a valid 6‑digit hex';
    return null;
  };

  const COMMON_COLORS = [
    '#991b1b', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669',
    '#0d9488', '#0ea5e9', '#2563eb', '#1d4ed8', '#7c3aed', '#9333ea', '#db2777', '#475569',
    '#64748b', '#94a3b8', '#475569', '#0f172a'
  ];

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
          className={`!p-1 w-5 h-5 flex items-center justify-center rounded-sm bg-gray-200 dark:bg-muted/70 hover:bg-gray-200/70 text-muted-foreground ${triggerClassName || ''}`}
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
            <div className="rounded-md border bg-muted/20 px-4 py-6 flex items-center justify-center">
              <LabelBadge text={name.trim() ? name.trim() : 'Label preview'} color={color} />
            </div>
            <div className="flex flex-col gap-2">
              <UILabel htmlFor="label-name" className="text-[13px] font-medium">Name</UILabel>
              <Input
                id="label-name"
                ref={nameInputRef}
                placeholder="Label name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!error && !name.trim()}
              />
            </div>
            <div className="flex flex-col gap-2">
              <UILabel htmlFor="label-description" className="text-[13px] font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></UILabel>
              <Textarea
                id="label-description"
                initialValue={description}
                onValueChange={(v)=> setDescription(v)}
                hideMarkdownHelper
                showButtons={false}
              />
            </div>
            <div className="flex flex-col gap-2">
              <UILabel className="text-[13px] font-medium">Color</UILabel>
              <div className="flex items-center gap-3" ref={colorFieldWrapperRef}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-9 h-9 p-0 rounded-md shadow-xs border relative"
                  style={{ background: color }}
                  onClick={() => {
                    const c = randomColor();
                    setColor(c);
                    setDraftColor(c);
                  }}
                  title="Randomize color"
                >
                  <RotateCcw className="w-4 h-4" style={{ color: '#fff' }} />
                </Button>
                <div className="relative">
                  <Input
                    id="label-color"
                    value={draftColor}
                    onFocus={() => setColorPickerOpen(true)}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('#')) val = '#' + val;
                      setDraftColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setColor(val);
                      }
                    }}
                    className="font-mono w-35"
                    placeholder="#AABBCC"
                    aria-invalid={!!error && !/^#[0-9A-Fa-f]{6}$/.test(draftColor)}
                  />
                  {colorPickerOpen && (
                    <div className="absolute z-50 top-full left-0 mt-2 w-max rounded-md border bg-popover shadow-md p-3">
                      <div className="grid grid-cols-5 gap-2">
                        {COMMON_COLORS.map(c => {
                          const active = c.toLowerCase() === color.toLowerCase();
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setColor(c); setDraftColor(c); setColorPickerOpen(false); }}
                              className={`h-7 w-7 rounded-md border flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-ring/50 ${active ? 'ring-2 ring-ring/70' : ''}`}
                              style={{ background: c }}
                              aria-label={c}
                            >
                              {active && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1" />
              </div>
            </div>
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
