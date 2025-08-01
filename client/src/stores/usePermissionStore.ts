
import { create } from 'zustand';
import { PermissionAction,hasPermission, PermissionResource, UserPermissionResDto } from '@fullstack/common';
import { getMyPermissionsEndpoint } from '@/apiRequests/apiEndpoints';
import { apiClient } from '@/utils/APIClient';
import { useCallback, useEffect } from 'react';

interface PermissionStoreState {
  permissions: UserPermissionResDto[];
  loading: boolean;
  error: string | null;
  setPermissions: (permissions: UserPermissionResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useZustandPermissionStore = create<PermissionStoreState>((set) => ({
  permissions: [],
  loading: false,
  error: null,
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// Custom hook to use the permission store, matching the pattern of useProjectStore
export function usePermissionStore() {
  const {
    permissions,
    loading,
    error,
    setPermissions,
    setLoading,
    setError,
  } = useZustandPermissionStore();

  // Fetch permissions logic is now in the hook, not the store
  const fetchPermissions = useCallback(async () => {
    try {
      const permissions = await apiClient.get<UserPermissionResDto[]>(getMyPermissionsEndpoint());
      setPermissions(permissions);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch permissions');
    }
  }, [setPermissions, setError]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // hasPermission now uses the shared permissionCheck util
  const checkPermission = (action: PermissionAction, resource: PermissionResource) =>
    hasPermission(permissions, resource, action);

  // Expose store state and actions as a single object
  return {
    fetchPermissions,
    hasPermission: checkPermission,
  };
}
