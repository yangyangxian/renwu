import { useCallback } from 'react';
import { create } from 'zustand';
import { ActivityResDto, ProjectResDto, ProjectCreateReqDto, ProjectRoleDto, ProjectAddMemberReqDto, ProjectMemberRoleUpdateReqDto, ProjectDocumentCreateReqDto, ProjectDocumentResDto, ProjectDocumentUpdateReqDto } from '@fullstack/common';
import { apiClient } from '@/utils/APIClient';
import { 
  getMyProjects, 
  getProjects, 
  getProjectById,
  getProjectActivitiesById,
  updateProjectById as updateProjectByIdEndpoint,
  createProjectDocument as createProjectDocumentEndpoint,
  updateProjectDocumentById as updateProjectDocumentByIdEndpoint,
  deleteProjectDocumentById as deleteProjectDocumentByIdEndpoint,
  deleteProjectById as deleteProjectByIdEndpoint,
  addProjectMember,
  updateProjectMemberRole,
  getProjectRoles
} from '@/apiRequests/apiEndpoints';

// Internal Zustand store - only for state management
interface ProjectStoreState {
  projects: ProjectResDto[];
  currentProject: ProjectResDto | null;
  projectActivities: ActivityResDto[];
  loading: boolean;
  projectLoading: boolean;
  projectActivitiesLoading: boolean;
  error: string | null;
  projectError: string | null;
  projectActivitiesError: string | null;
  setProjects: (projects: ProjectResDto[]) => void;
  setCurrentProject: (project: ProjectResDto | null) => void;
  setProjectActivities: (activities: ActivityResDto[]) => void;
  setLoading: (loading: boolean) => void;
  setProjectLoading: (loading: boolean) => void;
  setProjectActivitiesLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProjectError: (error: string | null) => void;
  setProjectActivitiesError: (error: string | null) => void;
  projectRoles: ProjectRoleDto[];
  setProjectRoles: (roles: ProjectRoleDto[]) => void;
}

const useZustandProjectStore = create<ProjectStoreState>((set) => ({
  projects: [],
  currentProject: null,
  projectActivities: [],
  loading: false,
  projectLoading: false,
  projectActivitiesLoading: false,
  error: null,
  projectError: null,
  projectActivitiesError: null,
  projectRoles: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjectActivities: (projectActivities) => set({ projectActivities }),
  setLoading: (loading) => set({ loading }),
  setProjectLoading: (loading) => set({ projectLoading: loading }),
  setProjectActivitiesLoading: (projectActivitiesLoading) => set({ projectActivitiesLoading }),
  setError: (error) => set({ error }),
  setProjectError: (error) => set({ projectError: error }),
  setProjectActivitiesError: (projectActivitiesError) => set({ projectActivitiesError }),
  setProjectRoles: (roles) => set({ projectRoles: roles }),
}));

export function useProjectStore() {
  const {
    projects,
    currentProject,
    projectActivities,
    loading,
    projectLoading,
    projectActivitiesLoading,
    error,
    projectError,
    projectActivitiesError,
    projectRoles,
    setProjectRoles,
    setProjects,
    setCurrentProject,
    setProjectActivities,
    setLoading,
    setProjectLoading,
    setProjectActivitiesLoading,
    setError,
    setProjectError,
    setProjectActivitiesError,
  } = useZustandProjectStore();

  const fetchProjectRoles = useCallback(async () => {
    const roles = await apiClient.get<ProjectRoleDto[]>(getProjectRoles());
    setProjectRoles(roles);
    return roles;
  }, [setProjectRoles]);

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

  const fetchCurrentProject = useCallback(async (projectId?: string): Promise<ProjectResDto | null> => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const idToFetch = projectId || currentProject?.id;
      if (!idToFetch) return null;
      const data = await apiClient.get<ProjectResDto>(getProjectById(idToFetch));
      setCurrentProject(data);
      return data;
    } catch (err: any) {
      setProjectError(err?.message || 'Failed to fetch project');
      return null;
    } finally {
      setProjectLoading(false);
    }
  }, [setProjectLoading, setProjectError, setCurrentProject]);

  const fetchProjectActivities = useCallback(async (projectId?: string): Promise<ActivityResDto[]> => {
    setProjectActivitiesLoading(true);
    setProjectActivitiesError(null);
    try {
      const idToFetch = projectId || currentProject?.id;
      if (!idToFetch) {
        setProjectActivities([]);
        return [];
      }
      const data = await apiClient.get<ActivityResDto[]>(getProjectActivitiesById(idToFetch));
      setProjectActivities(data);
      return data;
    } catch (err: any) {
      setProjectActivitiesError(err?.message || 'Failed to fetch project activities');
      return [];
    } finally {
      setProjectActivitiesLoading(false);
    }
  }, [currentProject?.id, setProjectActivities, setProjectActivitiesError, setProjectActivitiesLoading]);

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

  const updateProject = useCallback(async (projectId: string, updateData: Partial<Pick<ProjectResDto, 'name' | 'description' | 'slug'>>): Promise<ProjectResDto> => {
    try {
      const updatedProject = await apiClient.put<Partial<Pick<ProjectResDto, 'name' | 'description' | 'slug'>>, ProjectResDto>(updateProjectByIdEndpoint(projectId), updateData);
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

  const addMemberToProject = useCallback(async (projectId: string, memberData: ProjectAddMemberReqDto): Promise<void> => {
    try {
      await apiClient.post(addProjectMember(projectId), memberData);
      // Refresh the current project to get updated members
      if (currentProject?.id === projectId) {
        await fetchCurrentProject(projectId);
      }
    } catch (error) {
      console.error('Failed to add member to project:', error);
      throw error;
    }
  }, [currentProject, fetchCurrentProject]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      await apiClient.delete<{ success: boolean }>(deleteProjectByIdEndpoint(projectId));
      // Remove project from local state
      removeProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }, [removeProject]);

  const updateMemberRoleToProject = useCallback(async (projectId: string, memberId: string, roleId: string, roleName: string): Promise<void> => {
    try {
      const req: ProjectMemberRoleUpdateReqDto = { roleId, roleName };
      await apiClient.put(updateProjectMemberRole(projectId, memberId), req);
      // Refresh the current project to get updated members
      if (currentProject?.id === projectId) {
        await fetchCurrentProject(projectId);
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }, [currentProject, fetchCurrentProject]);

  const createProjectDocument = useCallback(async (projectId: string, documentData?: ProjectDocumentCreateReqDto): Promise<ProjectDocumentResDto> => {
    try {
      const createdDocument = await apiClient.post<ProjectDocumentCreateReqDto | undefined, ProjectDocumentResDto>(
        createProjectDocumentEndpoint(projectId),
        documentData
      );

      if (currentProject?.id === projectId) {
        const currentDocuments = currentProject.documents ?? [];
        setCurrentProject({
          ...currentProject,
          documents: [...currentDocuments, createdDocument].sort((a, b) => a.position - b.position),
        });
      }

      return createdDocument;
    } catch (error) {
      console.error('Failed to create project document:', error);
      throw error;
    }
  }, [currentProject, setCurrentProject]);

  const updateProjectDocument = useCallback(async (
    projectId: string,
    documentId: string,
    updateData: ProjectDocumentUpdateReqDto
  ): Promise<ProjectDocumentResDto> => {
    try {
      const updatedDocument = await apiClient.put<ProjectDocumentUpdateReqDto, ProjectDocumentResDto>(
        updateProjectDocumentByIdEndpoint(projectId, documentId),
        updateData
      );

      if (currentProject?.id === projectId) {
        const currentDocuments = currentProject.documents ?? [];
        setCurrentProject({
          ...currentProject,
          documents: currentDocuments
            .map((document) => document.id === documentId ? updatedDocument : document)
            .sort((a, b) => a.position - b.position),
        });
      }

      return updatedDocument;
    } catch (error) {
      console.error('Failed to update project document:', error);
      throw error;
    }
  }, [currentProject, setCurrentProject]);

  const deleteProjectDocument = useCallback(async (
    projectId: string,
    documentId: string
  ): Promise<void> => {
    try {
      await apiClient.delete<{ success: boolean }>(
        deleteProjectDocumentByIdEndpoint(projectId, documentId)
      );

      if (currentProject?.id === projectId) {
        const currentDocuments = currentProject.documents ?? [];
        setCurrentProject({
          ...currentProject,
          documents: currentDocuments.filter((document) => document.id !== documentId),
        });
      }
    } catch (error) {
      console.error('Failed to delete project document:', error);
      throw error;
    }
  }, [currentProject, setCurrentProject]);

  return {
    projects,
    currentProject,
    projectActivities,
    loading,
    projectLoading,
    projectActivitiesLoading,
    error,
    projectError,
    projectActivitiesError,
    projectRoles,
    fetchProjectRoles,
    fetchProjects,
    fetchCurrentProject,
    fetchProjectActivities,
    addProject,
    removeProject,
    createProject,
    updateProject,
    createProjectDocument,
    updateProjectDocument,
    deleteProjectDocument,
    addMemberToProject,
    deleteProject,
    updateMemberRoleToProject,
  };
}
