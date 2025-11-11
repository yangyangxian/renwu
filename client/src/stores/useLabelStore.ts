import { useCallback } from 'react';
import { create } from 'zustand';
import { apiClient } from '@/utils/APIClient';
import { getMyLabels, createLabel as createLabelEndpoint, updateLabelById, deleteLabelById, getMyLabelSets, createLabelInSet, getLabelsInSet } from '@/apiRequests/apiEndpoints';
import { LabelResDto, LabelCreateReqDto, LabelUpdateReqDto } from '@fullstack/common';

interface LabelStoreState {
  labels: LabelResDto[];
  labelSets: any[];
  loading: boolean;
  error: string | null;
  setLabels: (labels: LabelResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLabelSets: (sets: any[]) => void;
}

const useZustandLabelStore = create<LabelStoreState>((set) => ({
  labels: [] as LabelResDto[],
  labelSets: [] as any[],
  loading: false,
  error: null,
  setLabels: (labels) => set({ labels }),
  setLabelSets: (sets) => set({ labelSets: sets }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export function useLabelStore() {
  const { labels, loading, error, setLabels, setLoading, setError } = useZustandLabelStore();
  const { labelSets, setLabelSets } = useZustandLabelStore();

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
    // server exposes a convenience endpoint for current user
    const data = await apiClient.get<LabelResDto[]>(getMyLabels());
      setLabels(Array.isArray(data) ? data : []);
      return data as LabelResDto[];
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch labels');
      setLabels([]);
      return [] as LabelResDto[];
    } finally {
      setLoading(false);
    }
  }, [setLabels, setLoading, setError]);

  const fetchLabelSets = useCallback(async () => {
    try {
      const data = await apiClient.get<any[]>(getMyLabelSets());
      // Normalize server rows to UI-friendly shape: { id, name, labels }
      const normalized = Array.isArray(data) ? data.map(r => ({
        id: r.id,
        name: r.labelSetName || r.name || '',
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
      setLabelSets(withLabels as any[]);
      return withLabels as any[];
    } catch (err: any) {
      // keep existing mock sets if api fails — do not override
      return [] as any[];
    }
  }, [setLabelSets]);

  const createLabel = useCallback(async (payload: Partial<LabelCreateReqDto>): Promise<LabelResDto> => {
    try {
      // server expects `labelName` in create payload; map `name` -> `labelName` if provided
      const body: any = { ...payload };
      if ((body as any).name && !(body as any).labelName) {
        body.labelName = (body as any).name;
        delete body.name;
      }
  const created = await apiClient.post<LabelCreateReqDto, LabelResDto>(createLabelEndpoint(), body as any);
      setLabels([...labels, (created as LabelResDto)]);
      return created as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [labels, setLabels]);

  const deleteLabel = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(deleteLabelById(id));
      setLabels(labels.filter(l => l.id !== id));

      // Update labelSets by removing the label from any set it belongs to.
      // Use current labelSets from closure (included in deps) to avoid stale updates.
      const nextSets = (labelSets || []).map(s => ({
        ...s,
        labels: (s.labels || []).filter((ll: any) => ll.id !== id),
      }));
      setLabelSets(nextSets as any[]);

    } catch (err) {
      throw err;
    }
  }, [labels, setLabels, labelSets, setLabelSets]);

  const updateLabel = useCallback(async (id: string, payload: Partial<LabelUpdateReqDto & { name?: string }>): Promise<LabelResDto> => {
    try {
      const body: any = { ...payload };
      // map `name` -> `labelName` if provided to align with server
      if (body.name && !body.labelName) {
        body.labelName = body.name;
        delete body.name;
      }
      const updated = await apiClient.put<LabelUpdateReqDto, LabelResDto>(updateLabelById(id), body as any);
      setLabels(labels.map(l => l.id === id ? (updated as LabelResDto) : l));
      return updated as LabelResDto;
    } catch (err) {
      throw err;
    }
  }, [labels, setLabels]);

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
      setLabelSets(next as any[]);
      return created;
    } catch (err) {
      throw err;
    }
  }, [labelSets, setLabelSets]);

  const fetchLabelsForSet = useCallback(async (setId: string) => {
    try {
      const data = await apiClient.get<any[]>(getLabelsInSet(setId));
      const labels = Array.isArray(data) ? data : [];
      const next = (labelSets || []).map(s => s.id === setId ? ({ ...s, labels }) : s);
      setLabelSets(next as any[]);
      return labels;
    } catch (err) {
      // don't fail if fetching labels per set fails; return empty
      return [] as any[];
    }
  }, [labelSets, setLabelSets]);

  return {
    labels,
    loading,
    error,
    labelSets,
    addLabelToSet,
    fetchLabels,
    fetchLabelSets,
    createLabel,
    deleteLabel,
    updateLabel,
    fetchLabelsForSet,
  };
}
