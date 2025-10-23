import { useCallback } from 'react';
import { create } from 'zustand';
import { apiClient } from '@/utils/APIClient';
import { getMyLabels, createLabel as createLabelEndpoint, getLabelById, updateLabelById, deleteLabelById } from '@/apiRequests/apiEndpoints';
import { LabelResDto, LabelCreateReqDto, LabelUpdateReqDto } from '@fullstack/common';

interface LabelStoreState {
  labels: LabelResDto[];
  loading: boolean;
  error: string | null;
  setLabels: (labels: LabelResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useZustandLabelStore = create<LabelStoreState>((set) => ({
  labels: [] as LabelResDto[],
  loading: false,
  error: null,
  setLabels: (labels) => set({ labels }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export function useLabelStore() {
  const { labels, loading, error, setLabels, setLoading, setError } = useZustandLabelStore();

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
    } catch (err) {
      throw err;
    }
  }, [labels, setLabels]);

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

  return {
    labels,
    loading,
    error,
    fetchLabels,
    createLabel,
    deleteLabel,
    updateLabel,
  };
}
