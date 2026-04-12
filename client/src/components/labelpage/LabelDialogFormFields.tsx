import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

import LabelBadge from '@/components/common/LabelBadge';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Label as UILabel } from '@/components/ui-kit/Label';
import { Textarea } from '@/components/ui-kit/Textarea';

export const COMMON_LABEL_COLORS = [
  '#991b1b', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a', '#059669',
  '#0d9488', '#0ea5e9', '#2563eb', '#1d4ed8', '#7c3aed', '#9333ea', '#db2777', '#475569',
  '#64748b', '#94a3b8', '#475569', '#0f172a',
];

export const randomLabelColor = () => {
  const ch = () => (40 + Math.floor(Math.random() * 160)).toString(16).padStart(2, '0');
  return `#${ch()}${ch()}${ch()}`;
};

interface LabelDialogFormFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  error?: string | null;
  nameInputRef?: React.RefObject<HTMLInputElement | null>;
  nameInputId: string;
}

export default function LabelDialogFormFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  color,
  onColorChange,
  error,
  nameInputRef,
  nameInputId,
}: LabelDialogFormFieldsProps) {
  const [draftColor, setDraftColor] = useState(color);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorFieldWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftColor(color);
  }, [color]);

  useEffect(() => {
    if (!colorPickerOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!colorFieldWrapperRef.current?.contains(event.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setColorPickerOpen(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [colorPickerOpen]);

  return (
    <>
      <div className="rounded-md border bg-muted/20 px-4 py-6 flex items-center justify-center">
        <LabelBadge text={name.trim() || 'Label preview'} color={color} />
      </div>

      <div className="flex flex-col gap-2">
        <UILabel htmlFor={nameInputId} className="text-[13px] font-medium">Name</UILabel>
        <Input
          id={nameInputId}
          ref={nameInputRef}
          placeholder="Label name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          aria-invalid={!!error && !name.trim()}
        />
      </div>

      {onDescriptionChange && (
        <div className="flex flex-col gap-2">
          <UILabel htmlFor={`${nameInputId}-description`} className="text-[13px] font-medium">
            Description <span className="text-muted-foreground font-normal">(optional)</span>
          </UILabel>
          <Textarea
            id={`${nameInputId}-description`}
            initialValue={description ?? ''}
            onValueChange={onDescriptionChange}
            hideMarkdownHelper
            showButtons={false}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <UILabel className="text-[13px] font-medium">Color</UILabel>
        <div className="flex items-center gap-3" ref={colorFieldWrapperRef}>
          <Button
            type="button"
            variant="outline"
            className="w-9 h-9 p-0 rounded-md shadow-xs border relative"
            style={{ background: color }}
            onClick={() => onColorChange(randomLabelColor())}
            title="Randomize color"
          >
            <RotateCcw className="w-4 h-4" style={{ color: '#fff' }} />
          </Button>
          <div className="relative">
            <Input
              id={`${nameInputId}-color`}
              value={draftColor}
              onFocus={() => setColorPickerOpen(true)}
              onChange={(event) => {
                let nextValue = event.target.value;
                if (!nextValue.startsWith('#')) nextValue = `#${nextValue}`;
                setDraftColor(nextValue);
                if (/^#[0-9A-Fa-f]{6}$/.test(nextValue)) {
                  onColorChange(nextValue);
                }
              }}
              className="font-mono w-35"
              placeholder="#AABBCC"
              aria-invalid={!!error && !/^#[0-9A-Fa-f]{6}$/.test(draftColor)}
            />
            {colorPickerOpen && (
              <div className="absolute z-50 top-full left-0 mt-2 w-max rounded-md border bg-popover shadow-md p-3">
                <div className="grid grid-cols-5 gap-2">
                  {COMMON_LABEL_COLORS.map((candidateColor) => {
                    const active = candidateColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={candidateColor}
                        type="button"
                        onClick={() => {
                          onColorChange(candidateColor);
                          setColorPickerOpen(false);
                        }}
                        className={`h-7 w-7 rounded-md border flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-ring/50 ${active ? 'ring-2 ring-ring/70' : ''}`}
                        style={{ background: candidateColor }}
                        aria-label={candidateColor}
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
  );
}