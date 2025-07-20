import { useCallback } from 'react';
import { create } from 'zustand';
import { ProjectResDto, ProjectCreateReqDto } from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { 
  getMyProjects, 
  getProjects, 
  getProjectBySlug as getProjectBySlugEndpoint, 
  updateProjectById as updateProjectByIdEndpoint,
  addProjectMember
} from '@/apiRequests/apiEndpoints';

// Internal Zustand store - only for state management
interface ProjectStoreState {
  projects: ProjectResDto[];
  currentProject: ProjectResDto | null;
  loading: boolean;
  projectLoading: boolean;
  error: string | null;
  projectError: string | null;
  setProjects: (projects: ProjectResDto[]) => void;
  setCurrentProject: (project: ProjectResDto | null) => void;
  setLoading: (loading: boolean) => void;
  setProjectLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectError: (error: string | null) => void;
}

const useZustandProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  projectLoading: false,
  error: null,
  projectError: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ loading }),
  setProjectLoading: (loading) => set({ projectLoading: loading }),
  setError: (error) => set({ error }),
  setProjectError: (error) => set({ projectError: error }),
}));

export function useProjectStore() {
  const {
    projects,
    currentProject,
    loading,
    projectLoading,
    error,
    projectError,
    setProjects,
    setCurrentProject,
    setLoading,
    setProjectLoading,
    setError,
    setProjectError,
  } = useZustandProjectStore();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ProjectResDto[]>(getMyProjects());
      setProjects(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProjects]);

    const fetchCurrentProject = useCallback(async (projectSlug: string): Promise<ProjectResDto | null> => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const data = await apiClient.get<ProjectResDto>(getProjectBySlugEndpoint(projectSlug));
      setCurrentProject(data);
      return data;
    } catch (err: any) {
      setProjectError(err?.message || 'Failed to fetch project');
      return null;
    } finally {
      setProjectLoading(false);
    }
  }, [setProjectLoading, setProjectError, setCurrentProject]);

  // Simple state operations - pure state management
  const addProject = useCallback((project: ProjectResDto) => {
    setProjects([...projects, project]);
  }, [projects, setProjects]);

  const removeProject = useCallback((projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
  }, [projects, currentProject, setProjects, setCurrentProject]);

  // Business logic methods
  const createProject = useCallback(async (projectData: ProjectCreateReqDto): Promise<ProjectResDto> => {
    try {
      const newProject = await apiClient.post<ProjectCreateReqDto, ProjectResDto>(getProjects(), projectData);
      addProject(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }, [addProject]);

  const updateProject = useCallback(async (projectId: string, updateData: Partial<Pick<ProjectResDto, 'name' | 'description'>>): Promise<ProjectResDto> => {
    try {
      const updatedProject = await apiClient.put<Partial<Pick<ProjectResDto, 'name' | 'description'>>, ProjectResDto>(updateProjectByIdEndpoint(projectId), updateData);
      // Update projects list
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
      // Update current project if it matches
      if (currentProject?.id === projectId) {
        setCurrentProject(updatedProject);
      }
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }, [projects, currentProject, setProjects, setCurrentProject]);

  const addMemberToProject = useCallback(async (projectId: string, memberData: { email: string; role: string }): Promise<void> => {
    try {
      await apiClient.post(addProjectMember(projectId), memberData);
      // Refresh the current project to get updated members
      if (currentProject?.id === projectId && currentProject?.slug) {
        await fetchCurrentProject(currentProject.slug);
      }
    } catch (error) {
      console.error('Failed to add member to project:', error);
      throw error;
    }
  }, [currentProject, fetchCurrentProject]);

  return {
    projects,
    currentProject,
    loading,
    projectLoading,
    error,
    projectError,
    fetchProjects,
    fetchCurrentProject,
    addProject,
    removeProject,
    createProject,
    updateProject,
    addMemberToProject,
  };
}
