import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui-kit/Button';
import { Input } from '@/components/ui-kit/Input';
import { Plus, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuLabel } from '@/components/ui-kit/Dropdown-menu';
import LabelBadge from '@/components/common/LabelBadge';
import { useLabelStore } from '@/stores/useLabelStore';
import { cn } from '@/lib/utils';
import { Label } from '../ui-kit/Label';

/**
 * LabelSelector Component
 * Reusable dropdown-based multi-selection UI for labels and label sets.
 * Features:
 *  - Groups independent labels and label sets (with submenu per set)
 *  - Search across label names (independent + set members)
 *  - Draft selection applied only on close (deferCommit=true) to avoid layout jumps
 *
 * Props:
 *  value: string[]                Current committed label IDs
 *  onChange: (next: string[])     Callback when committed selection changes
 *  className?: string             Optional wrapper class
 *  triggerClassName?: string      Optional className for trigger button
 *  deferCommit?: boolean          If true, uses draft selection until dropdown closes
 *  showBadges?: boolean           If true, renders selected badges before trigger
 */
export interface LabelSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
  triggerClassName?: string;
  deferCommit?: boolean;
  showBadges?: boolean;
  emptyText?: string;
  /**
   * If provided: show labels/sets for this project id.
   * If null: show personal (non-project) labels/sets.
  * If undefined: treat as personal (non-project) labels/sets.
   */
  projectId?: string | null;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  value,
  onChange,
  className,
  triggerClassName,
  deferCommit = true,
  showBadges = true,
  emptyText = 'Add Label',
  projectId,
}) => {
  const { fetchLabelSets, fetchLabels, getLabelsForProjectId, getLabelSetsForProjectId } = useLabelStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string[]>(value);

  // Normalize: treat '' as personal (null) to avoid scope bugs.
  const normalizedProjectId = projectId && projectId.trim() ? projectId : null;

  const scopedLabels = useMemo(() => getLabelsForProjectId(normalizedProjectId), [getLabelsForProjectId, normalizedProjectId]);
  const scopedLabelSets = useMemo(() => getLabelSetsForProjectId(normalizedProjectId), [getLabelSetsForProjectId, normalizedProjectId]);

  // sync draft when menu opens
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    // Load the correct scope, but don't flip the global active scope.
    fetchLabels(normalizedProjectId ?? undefined, { setActiveScope: false });
    fetchLabelSets(normalizedProjectId ?? undefined, { setActiveScope: false });
  }, [open, normalizedProjectId, fetchLabels, fetchLabelSets]);

  // Ensure selected badges can render even before opening the dropdown.
  useEffect(() => {
    if (!value || value.length === 0) return;
    const hasAny = (scopedLabels?.length ?? 0) > 0 || (scopedLabelSets?.length ?? 0) > 0;
    if (hasAny) return;
    fetchLabels(normalizedProjectId ?? undefined, { setActiveScope: false });
    fetchLabelSets(normalizedProjectId ?? undefined, { setActiveScope: false });
  }, [value, scopedLabels, scopedLabelSets, normalizedProjectId, fetchLabels, fetchLabelSets]);

  // NOTE: We rely on the store's scope-aware caches; avoid filtering by projectId
  // on each label/set because some endpoints don't populate projectId consistently.
  const filteredLabelSets = scopedLabelSets || [];

  const labelIdsInSets = new Set<string>(filteredLabelSets.flatMap(s => (s.labels || []).map((l: any) => l.id)));
  const independentLabels = (scopedLabels || []).filter(l => !labelIdsInSets.has((l as any).id));
  const normalizedSearch = search.trim().toLowerCase();
  const matchesIndependent = normalizedSearch
    ? independentLabels.filter(l => ((l as any).name || (l as any).labelName || '').toLowerCase().includes(normalizedSearch))
    : independentLabels;
  const filteredSetsRaw = filteredLabelSets.map(set => ({
    ...set,
    labels: normalizedSearch
      ? (set.labels || []).filter((l: any) => ((l.name || l.labelName || '') as string).toLowerCase().includes(normalizedSearch))
      : (set.labels || []),
  }));
  const matchesSets = normalizedSearch ? filteredSetsRaw.filter(s => (s.labels || []).length > 0) : filteredSetsRaw;

  const currentSelection = deferCommit ? draft : value;

  // Map labelId -> labelSetId (only for labels in the currently visible sets)
  const labelIdToSetId = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const map = new Map<string, string>();
    for (const s of (matchesSets || [])) {
      for (const l of (s.labels || [])) {
        if (l?.id) map.set(l.id, s.id);
      }
    }
    labelIdToSetId.current = map;
  }, [matchesSets]);

  const toggleDraft = (id: string) => {
    setDraft(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        const next = prev.filter(l => l !== id);
        if (!deferCommit) {
          try { onChange(next); } catch (e) { /* swallow */ }
        }
        return next;
      }

      // If this label belongs to a set, enforce "only one label per set"
      const setId = labelIdToSetId.current.get(id);
      let next = [...prev, id];
      if (setId) {
        const toRemove = new Set<string>();
        for (const existingId of prev) {
          if (existingId === id) continue;
          const existingSetId = labelIdToSetId.current.get(existingId);
          if (existingSetId && existingSetId === setId) {
            toRemove.add(existingId);
          }
        }
        if (toRemove.size > 0) {
          next = next.filter(x => !toRemove.has(x));
        }
      }
      if (!deferCommit) {
        try { onChange(next); } catch (e) { /* swallow */ }
      }
      return next;
    });
  };

  const commitAndClose = () => {
    try { onChange(draft); } catch (e) { /* swallow */ }
    setOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {showBadges && value.map(id => {
        const lbl = (scopedLabels || []).find(l => l.id === id) || (scopedLabelSets || []).flatMap(s => s.labels || []).find((l: any) => l.id === id);
        if (!lbl) return null;
        return (
          <LabelBadge
            key={id}
            text={(lbl as any).name || (lbl as any).labelName}
            color={(lbl as any).color || (lbl as any).labelColor}
            className="flex items-center"
          />
        );
      })}
      <DropdownMenu open={open} onOpenChange={(o: boolean) => {
        if (!o) {
          try { onChange(draft); } catch (e) { /* swallow */ }
        }
        setOpen(o);
      }}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={value.length === 0 ? cn('h-7 !px-2', triggerClassName) : cn('h-6 gap-1 !px-1', triggerClassName)}
          >
            <Plus className="w-3 h-3" />
            {value.length === 0 && <Label className='text-[13px] cursor-pointer'>{emptyText}</Label>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-3 w-60">
          <div className="flex items-center mb-2 gap-2">
            <Input
              placeholder="Search labels..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs px-2"
            />
            <Button type="button" variant="ghost" size="icon" onClick={commitAndClose} className="ml-auto h-6 w-6 p-0 flex items-center justify-center"><X className="w-3 h-3" /></Button>
          </div>
          <DropdownMenuLabel className="text-sm uppercase px-1 pt-2">Labels</DropdownMenuLabel>
          <div className="max-h-40 overflow-auto space-y-1 pr-1 mb-2">
            {matchesIndependent.length === 0 && <p className="text-xs text-muted-foreground px-2">No labels</p>}
            {matchesIndependent.map(l => {
              const id = (l as any).id;
              const name = (l as any).name || (l as any).labelName;
              const color = (l as any).color || (l as any).labelColor;
              const active = currentSelection.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleDraft(id)}
                  className={`w-full text-left rounded-md px-2 py-1 text-sm flex items-center justify-between transition hover:bg-muted cursor-pointer`}
                >
                  <span className="flex items-center gap-2 flex-1 min-w-0">
                    <LabelBadge text="" color={color} className="!px-3 !py-1.5" />
                    <span className="truncate">{name}</span>
                  </span>
                  {active && <Check className="w-4 h-4 ml-2 text-green-600" />}
                </button>
              );
            })}
          </div>
          {(matchesSets || []).length > 0 && <DropdownMenuLabel className="text-sm uppercase px-1 pt-2">Label Sets</DropdownMenuLabel>}
          {(matchesSets || []).map(set => (
            <DropdownMenuSub key={set.id}>
              <DropdownMenuSubTrigger className="pt-2 pb-1">
                <Label className="gap-2">
                  {set.name || 'Untitled Set'}
                </Label>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1 min-w-[12rem]">
                <div className="max-h-60 overflow-auto">
                  {(set.labels || []).length === 0 && !normalizedSearch && <p className="text-sm text-muted-foreground px-2 py-1">Empty set</p>}
                  {(set.labels || []).map((l: any) => {
                    const id = l.id;
                    const name = l.name || l.labelName;
                    const color = l.color || l.labelColor;
                    const active = currentSelection.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleDraft(id)}
                        className={`w-full text-left rounded-sm px-2 py-1 text-sm flex items-center justify-between hover:bg-muted cursor-pointer`}
                      >
                        <span className="flex items-center gap-2 flex-1 min-w-0">
                          <LabelBadge text="" color={color} className="!px-3 !py-1.5" />
                          <span className="truncate">{name}</span>
                        </span>
                        {active && <Check className="w-4 h-4 ml-2 text-green-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LabelSelector;
