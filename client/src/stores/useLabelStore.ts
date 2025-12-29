import { useCallback } from 'react';
import { create } from 'zustand';
import { apiClient } from '@/utils/APIClient';
import { getMyLabels, getProjectLabels, createLabel as createLabelEndpoint, updateLabelById, deleteLabelById, getMyLabelSets, getProjectLabelSets, createLabelInSet, getLabelsInSet, deleteLabelSetById, deleteLabelFromSet } from '@/apiRequests/apiEndpoints';
import { LabelResDto, LabelCreateReqDto, LabelUpdateReqDto } from '@fullstack/common';

type LabelScope = { kind: 'me' } | { kind: 'project'; projectId: string };

function scopeKeyFromProjectId(projectId?: string): string {
  return projectId ? `project:${projectId}` : 'me';
}

function projectIdFromScopeKey(scopeKey: string): string | undefined {
  if (scopeKey.startsWith('project:')) return scopeKey.replace(/^project:/, '');
  return undefined;
}

interface LabelStoreState {
  // Scope-aware caches
  labelsByScope: Record<string, LabelResDto[]>;
  labelSetsByScope: Record<string, any[]>;
  activeScopeKey: string;
  loading: boolean;
  error: string | null;
  setActiveScopeKey: (scopeKey: string) => void;
  setLabelsForScope: (scopeKey: string, labels: LabelResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLabelSetsForScope: (scopeKey: string, sets: any[]) => void;
}

const useZustandLabelStore = create<LabelStoreState>((set) => ({
  labelsByScope: {} as Record<string, LabelResDto[]>,
  labelSetsByScope: {} as Record<string, any[]>,
  activeScopeKey: 'me',
  loading: false,
  error: null,
  setActiveScopeKey: (scopeKey) => set({ activeScopeKey: scopeKey }),
  setLabelsForScope: (scopeKey, labels) => set((state) => ({
    labelsByScope: { ...state.labelsByScope, [scopeKey]: labels },
  })),
  setLabelSetsForScope: (scopeKey, sets) => set((state) => ({
    labelSetsByScope: { ...state.labelSetsByScope, [scopeKey]: sets },
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export function useLabelStore() {
  // NOTE:
  // Don’t close over `labels` / `labelSets` in async actions. That pattern can easily create
  // dependency cycles in callbacks/effects, plus stale updates.
  // Instead, read the latest state via `useZustandLabelStore.getState()` inside actions.
  const {
    labelsByScope,
    labelSetsByScope,
    activeScopeKey,
    loading,
    error,
    setActiveScopeKey,
    setLabelsForScope,
    setLabelSetsForScope,
    setLoading,
    setError,
  } = useZustandLabelStore();

  const labels = labelsByScope[activeScopeKey] ?? [];
  const labelSets = labelSetsByScope[activeScopeKey] ?? [];

  const getLabelsForProjectId = useCallback((projectId?: string | null) => {
    const scopeKey = scopeKeyFromProjectId(projectId ?? undefined);
    return labelsByScope[scopeKey] ?? [];
  }, [labelsByScope]);

  const getLabelSetsForProjectId = useCallback((projectId?: string | null) => {
    const scopeKey = scopeKeyFromProjectId(projectId ?? undefined);
    return labelSetsByScope[scopeKey] ?? [];
  }, [labelSetsByScope]);

  const getScopeState = () => {
    const s = useZustandLabelStore.getState();
    const scopeKey = s.activeScopeKey;
    return {
      scopeKey,
      labels: s.labelsByScope[scopeKey] ?? [],
      labelSets: s.labelSetsByScope[scopeKey] ?? [],
    };
  };

  const fetchLabels = useCallback(async (projectId?: string, opts?: { setActiveScope?: boolean }) => {
    const scopeKey = scopeKeyFromProjectId(projectId);
    const shouldSetActiveScope = opts?.setActiveScope ?? true;
    if (shouldSetActiveScope) setActiveScopeKey(scopeKey);
    setLoading(true);
    setError(null);
    try {
    // server exposes convenience endpoints for current user and for a project's labels
    const data = await apiClient.get<LabelResDto[]>(projectId ? getProjectLabels(projectId) : getMyLabels());
      setLabelsForScope(scopeKey, Array.isArray(data) ? data : []);
      return data as LabelResDto[];
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch labels');
      setLabelsForScope(scopeKey, []);
      return [] as LabelResDto[];
    } finally {
      setLoading(false);
    }
  }, [setActiveScopeKey, setLabelsForScope, setLoading, setError]);

  const fetchLabelSets = useCallback(async (projectId?: string, opts?: { setActiveScope?: boolean }) => {
    const scopeKey = scopeKeyFromProjectId(projectId);
    const shouldSetActiveScope = opts?.setActiveScope ?? true;
    if (shouldSetActiveScope) setActiveScopeKey(scopeKey);
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<any[]>(projectId ? getProjectLabelSets(projectId) : getMyLabelSets());

      // Normalize server rows to UI-friendly shape: { id, name, labels: [{id,name,color,...}] }
      const normalized = Array.isArray(data)
        ? data.map((r: any) => {
          const rawLabels = Array.isArray(r?.labels) ? r.labels : [];
          const labels = rawLabels.map((l: any) => ({
            ...l,
            // server label DTO is { name }, but DB/entity may come back as { labelName }
            name: l?.name ?? l?.labelName ?? '',
            color: l?.color ?? l?.labelColor,
            description: l?.description ?? l?.labelDescription,
          }));

          return {
            id: r.id,
            name: r.labelSetName || r.name || '',
            // preserve project association for filtering (may be null for personal sets)
            projectId: r?.projectId ?? r?.project_id ?? null,
            labels,
            _raw: r,
          };
        })
        : [];

      setLabelSetsForScope(scopeKey, normalized as any[]);
      return normalized as any[];
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch label sets');
      setLabelSetsForScope(scopeKey, []);
      return [] as any[];
    } finally {
      setLoading(false);
    }
  }, [setActiveScopeKey, setLabelSetsForScope, setLoading, setError]);

  const createLabel = useCallback(async (payload: Partial<LabelCreateReqDto>): Promise<LabelResDto> => {
    try {
      // server expects `labelName` in create payload; map `name` -> `labelName` if provided
      const body: any = { ...payload };
      if ((body as any).name && !(body as any).labelName) {
        body.labelName = (body as any).name;
        delete body.name;
      }
      const created = await apiClient.post<LabelCreateReqDto, LabelResDto>(createLabelEndpoint(), body as any);
      const { scopeKey, labels: currentLabels } = getScopeState();
      setLabelsForScope(scopeKey, [...currentLabels, (created as LabelResDto)]);
      return created as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [setLabelsForScope]);

  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(deleteLabelById(id));
      const { scopeKey, labels: currentLabels, labelSets: currentSets } = getScopeState();
      setLabelsForScope(scopeKey, currentLabels.filter(l => l.id !== id));

      // Update labelSets by removing the label from any set it belongs to.
      const nextSets = (currentSets || []).map((s: any) => ({
        ...s,
        labels: (s.labels || []).filter((ll: any) => ll.id !== id),
      }));
      setLabelSetsForScope(scopeKey, nextSets as any[]);

    } catch (err) {
      throw err;
    }
  }, [setLabelsForScope, setLabelSetsForScope]);

  const removeLabelFromSet = useCallback(async (setId: string, labelId: string): Promise<void> => {
    // Optimistic targeted update: only update the edited set.
    const { scopeKey, labelSets: currentSets, labels: currentLabels } = getScopeState();
    const prevSets = currentSets || [];
    const prevLabels = currentLabels || [];

    const nextSets = prevSets.map((s: any) =>
      s.id === setId
        ? ({
          ...s,
          labels: (s.labels || []).filter((l: any) => l.id !== labelId),
        })
        : s
    );

    setLabelSetsForScope(scopeKey, nextSets as any[]);
    // labels are exclusive to a single set, so deleting from set also deletes the label record
    setLabelsForScope(scopeKey, prevLabels.filter((l: any) => l.id !== labelId));

    try {
      await apiClient.delete(deleteLabelFromSet(setId, labelId));
    } catch (err) {
      // Roll back on failure.
      setLabelSetsForScope(scopeKey, prevSets as any[]);
      setLabelsForScope(scopeKey, prevLabels as any[]);
      throw err;
    }
  }, [setLabelSetsForScope, setLabelsForScope]);

  const updateLabel = useCallback(async (id: string, payload: Partial<LabelUpdateReqDto & { name?: string }>): Promise<LabelResDto> => {
    try {
      const body: any = { ...payload };
      // map `name` -> `labelName` if provided to align with server
      if (body.name && !body.labelName) {
        body.labelName = body.name;
        delete body.name;
      }
      const updated = await apiClient.put<LabelUpdateReqDto, LabelResDto>(updateLabelById(id), body as any);
      const { scopeKey, labels: currentLabels } = getScopeState();
      setLabelsForScope(scopeKey, currentLabels.map(l => l.id === id ? (updated as LabelResDto) : l));
      return updated as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [setLabelsForScope]);

  const addLabelToSet = useCallback(async (setId: string, payload: Partial<LabelCreateReqDto>): Promise<any> => {
    try {
      const body: any = { ...payload };
      if ((body as any).name && !(body as any).labelName) {
        body.labelName = (body as any).name;
        delete body.name;
      }
      const created = await apiClient.post(createLabelInSet(setId), body as any);
      const createdAny = created as any;

      // Normalize shape to what the UI expects.
      const normalizedCreated: any = {
        ...(createdAny ?? {}),
        name: createdAny?.name ?? createdAny?.labelName ?? body.labelName ?? '',
        color: createdAny?.color ?? createdAny?.labelColor ?? body.color,
        description: createdAny?.description ?? createdAny?.labelDescription ?? body.description,
      };

      // Targeted update: only touch the edited set.
      const { scopeKey, labels: currentLabels, labelSets: currentSets } = getScopeState();
      const nextSets = (currentSets || []).map((s: any) =>
        s.id === setId
          ? ({
            ...s,
            labels: [...(s.labels || []), normalizedCreated],
          })
          : s
      );
      setLabelSetsForScope(scopeKey, nextSets as any[]);

      // If the API returns a label that also appears in the global label list, remove it there.
      // (This keeps UI consistent without triggering a full refetch.)
      const createdId = (normalizedCreated as any)?.id;
      if (createdId) setLabelsForScope(scopeKey, (currentLabels || []).filter((l) => l.id !== createdId));

      return normalizedCreated;
    } catch (err) {
      throw err;
    }
  }, [setLabelSetsForScope, setLabelsForScope]);

  const fetchLabelsForSet = useCallback(async (setId: string) => {
    try {
      const data = await apiClient.get<any[]>(getLabelsInSet(setId));
      const labels = Array.isArray(data) ? data : [];
      const { scopeKey, labelSets: currentSets } = getScopeState();
      const next = (currentSets || []).map((s: any) => s.id === setId ? ({ ...s, labels }) : s);
      setLabelSetsForScope(scopeKey, next as any[]);
      return labels;
    } catch (err) {
      // don't fail if fetching labels per set fails; return empty
      return [] as any[];
    }
  }, [setLabelSetsForScope]);

  const deleteLabelSet = useCallback(async (setId: string): Promise<void> => {
    try {
      await apiClient.delete(deleteLabelSetById(setId));
      const { scopeKey, labelSets: currentSets } = getScopeState();
      const next = (currentSets || []).filter((s: any) => s.id !== setId);
      setLabelSetsForScope(scopeKey, next as any[]);
    } catch (err) {
      throw err;
    }
  }, [setLabelSetsForScope]);

  return {
    labels,
    loading,
    error,
    labelSets,
    getLabelsForProjectId,
    getLabelSetsForProjectId,
    // Allow pages to switch the active display scope explicitly.
    //setActiveScopeKey,
    addLabelToSet,
  removeLabelFromSet,
    fetchLabels,
    fetchLabelSets,
    createLabel,
    deleteLabel,
    deleteLabelSet,
    updateLabel,
    fetchLabelsForSet,
  };
}
