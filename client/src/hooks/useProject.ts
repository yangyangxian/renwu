import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/APIClient';
import { ProjectResDto } from '@fullstack/common';
import { toast } from 'sonner';
import { getProjectById, updateProjectById } from '@/apiRequests/apiEndpoints';

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<ProjectResDto | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.get<ProjectResDto>(getProjectById(projectId));
      setProject(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load project';
      toast.error(msg);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProject = async (data: Partial<Pick<ProjectResDto, 'name' | 'description'>>) => {
    if (!project) {
      throw new Error("Project not loaded");
    }

    try {
      const updatedData = await apiClient.put<Partial<Pick<ProjectResDto, 'name' | 'description'>>, ProjectResDto>(updateProjectById(project.id), data);
      setProject(updatedData);
      toast.success('Project updated successfully');
      return updatedData;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(msg);
      fetchProject(); 
      throw err;
    }
  };

  return { project, setProject, loading, updateProject, refetch: fetchProject };
}
