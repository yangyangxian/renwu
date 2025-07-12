import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/APIClient";
import { ProjectResDto } from '@fullstack/common';
import { getMyProjects, getProjects, getProjectById, updateProjectById } from "@/apiRequests/apiEndpoints";

export function useProjects(projectId?: string) {
  const [projects, setProjects] = useState<ProjectResDto[]>([]);
  const [project, setProject] = useState<ProjectResDto | null>(null);

  // Fetch all projects for user
  const fetchProjects = useCallback(() => {
    apiClient.get<ProjectResDto[]>(getMyProjects())
      .then(setProjects);
  }, []);

  // Fetch a single project by ID
  const fetchProject = useCallback(async (id?: string) => {
    if (!id) {
      setProject(null);
      return;
    }
    try {
      const data = await apiClient.get<ProjectResDto>(getProjectById(id));
      setProject(data);
    } catch {
      setProject(null);
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      fetchProjects();
    }
  }, [projectId, fetchProject, fetchProjects]);

  // Add a new project
  const addProject = async (project: { name: string; description: string }) => {
    const newProject = await apiClient.post<typeof project, ProjectResDto>(getProjects(), project);
    const updated = await apiClient.get<ProjectResDto[]>(getMyProjects());
    setProjects(updated);
    return newProject;
  };

  // Update a project
  const updateProject = async (id: string, data: Partial<Pick<ProjectResDto, 'name' | 'description'>>) => {
    const updatedData = await apiClient.put<Partial<Pick<ProjectResDto, 'name' | 'description'>>, ProjectResDto>(updateProjectById(id), data);
    setProject(updatedData);
    setProjects(prev => prev.map(p => p.id === id ? updatedData : p));
    return updatedData;
  };

  return {
    projects,
    project,
    setProjects,
    setProject,
    fetchProjects,
    fetchProject,
    addProject,
    updateProject,
  };
}
