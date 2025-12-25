import { useCallback } from 'react';
import { create } from 'zustand';
import { apiClient } from '@/utils/APIClient';
import { getMyLabels, getProjectLabels, createLabel as createLabelEndpoint, updateLabelById, deleteLabelById, getMyLabelSets, getProjectLabelSets, createLabelInSet, getLabelsInSet, deleteLabelSetById } from '@/apiRequests/apiEndpoints';
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
    try {
      const scopeKey = scopeKeyFromProjectId(projectId);
      const shouldSetActiveScope = opts?.setActiveScope ?? true;
      if (shouldSetActiveScope) setActiveScopeKey(scopeKey);
      const data = await apiClient.get<any[]>(projectId ? getProjectLabelSets(projectId) : getMyLabelSets());
      // Normalize server rows to UI-friendly shape: { id, name, labels }
      const normalized = Array.isArray(data) ? data.map(r => ({
        id: r.id,
        name: r.labelSetName || r.name || '',
        // preserve project association for filtering (may be null for personal sets)
        projectId: (r as any).projectId ?? (r as any).project_id ?? null,
        // server doesn't return labels in this endpoint; we'll try to fetch them separately
        labels: [] as any[],
        // keep original raw row for future use if needed
        _raw: r,
      })) : [];

      // fetch labels for each set concurrently, but don't fail the whole flow if one set fails
      const settled = await Promise.allSettled(normalized.map(async (s) => {
        try {
          const labels = await apiClient.get<any[]>(getLabelsInSet(s.id));
          return { id: s.id, labels: Array.isArray(labels) ? labels : [] };
        } catch (e) {
          return { id: s.id, labels: [] };
        }
      }));

      const labelsBySet = (settled || []).reduce((acc: Record<string, any[]>, s: any) => {
        if (s.status === 'fulfilled' && s.value) acc[s.value.id] = s.value.labels || [];
        return acc;
      }, {} as Record<string, any[]>);

      const withLabels = normalized.map(s => ({ ...s, labels: labelsBySet[s.id] ?? [] }));
      setLabelSetsForScope(scopeKey, withLabels as any[]);
      return withLabels as any[];
    } catch (err: any) {
      // keep existing mock sets if api fails — do not override
      return [] as any[];
    }
  }, [setActiveScopeKey, setLabelSetsForScope]);

  const createLabel = useCallback(async (payload: Partial<LabelCreateReqDto>): Promise<LabelResDto> => {
    try {
      // server expects `labelName` in create payload; map `name` -> `labelName` if provided
      const body: any = { ...payload };
      if ((body as any).name && !(body as any).labelName) {
        body.labelName = (body as any).name;
        delete body.name;
      }
      const created = await apiClient.post<LabelCreateReqDto, LabelResDto>(createLabelEndpoint(), body as any);
      setLabelsForScope(activeScopeKey, [...labels, (created as LabelResDto)]);
      return created as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [activeScopeKey, labels, setLabelsForScope]);

  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(deleteLabelById(id));
      setLabelsForScope(activeScopeKey, labels.filter(l => l.id !== id));

      // Update labelSets by removing the label from any set it belongs to.
      // Use current labelSets from closure (included in deps) to avoid stale updates.
      const nextSets = (labelSets || []).map(s => ({
        ...s,
        labels: (s.labels || []).filter((ll: any) => ll.id !== id),
      }));
      setLabelSetsForScope(activeScopeKey, nextSets as any[]);

    } catch (err) {
      throw err;
    }
  }, [activeScopeKey, labels, setLabelsForScope, labelSets, setLabelSetsForScope]);

  const updateLabel = useCallback(async (id: string, payload: Partial<LabelUpdateReqDto & { name?: string }>): Promise<LabelResDto> => {
    try {
      const body: any = { ...payload };
      // map `name` -> `labelName` if provided to align with server
      if (body.name && !body.labelName) {
        body.labelName = body.name;
        delete body.name;
      }
      const updated = await apiClient.put<LabelUpdateReqDto, LabelResDto>(updateLabelById(id), body as any);
      setLabelsForScope(activeScopeKey, labels.map(l => l.id === id ? (updated as LabelResDto) : l));
      return updated as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [activeScopeKey, labels, setLabelsForScope]);

  const addLabelToSet = useCallback(async (setId: string, payload: Partial<LabelCreateReqDto>): Promise<any> => {
    try {
      const body: any = { ...payload };
      if ((body as any).name && !(body as any).labelName) {
        body.labelName = (body as any).name;
        delete body.name;
      }
      const created = await apiClient.post(createLabelInSet(setId), body as any);
      // optimistic update: append to set's labels if present
      const next = (labelSets || []).map(s => s.id === setId ? ({ ...s, labels: [...(s.labels || []), created] }) : s);
      setLabelSetsForScope(activeScopeKey, next as any[]);

      // Ensure the free Labels area stays consistent with server-side filtering
      // (labels attached to any set should not appear there)
      const payloadProjectId = (payload as any)?.projectId as string | undefined;
      const setProjectId = (labelSets || []).find(s => s.id === setId)?.projectId as string | undefined;
      const scopeProjectId = projectIdFromScopeKey(activeScopeKey);
      const effectiveProjectId = payloadProjectId ?? setProjectId ?? scopeProjectId;

      // Never refetch with `undefined` while in a project scope.
      // Doing so switches active scope back to personal ('me'), which makes the page look empty.
      if (projectIdFromScopeKey(activeScopeKey) && !effectiveProjectId) {
        return created;
      }

      await fetchLabels(effectiveProjectId);
      return created;
    } catch (err) {
      throw err;
    }
  }, [activeScopeKey, labelSets, setLabelSetsForScope, fetchLabels]);

  const fetchLabelsForSet = useCallback(async (setId: string) => {
    try {
      const data = await apiClient.get<any[]>(getLabelsInSet(setId));
      const labels = Array.isArray(data) ? data : [];
      const next = (labelSets || []).map(s => s.id === setId ? ({ ...s, labels }) : s);
      setLabelSetsForScope(activeScopeKey, next as any[]);
      return labels;
    } catch (err) {
      // don't fail if fetching labels per set fails; return empty
      return [] as any[];
    }
  }, [activeScopeKey, labelSets, setLabelSetsForScope]);

  const deleteLabelSet = useCallback(async (setId: string): Promise<void> => {
    try {
      await apiClient.delete(deleteLabelSetById(setId));
      const next = (labelSets || []).filter(s => s.id !== setId);
      setLabelSetsForScope(activeScopeKey, next as any[]);
    } catch (err) {
      throw err;
    }
  }, [activeScopeKey, labelSets, setLabelSetsForScope]);

  return {
    labels,
    loading,
    error,
    labelSets,
    // Allow pages to switch the active display scope explicitly.
    //setActiveScopeKey,
    addLabelToSet,
    fetchLabels,
    fetchLabelSets,
    createLabel,
    deleteLabel,
    deleteLabelSet,
    updateLabel,
    fetchLabelsForSet,
  };
}
