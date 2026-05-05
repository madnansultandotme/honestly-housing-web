import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useProjects(filters?: {
  clientId?: string;
  builderId?: string;
  builderOrgId?: string;
  status?: string;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [filters?.clientId, filters?.builderId, filters?.builderOrgId, filters?.status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProjects(filters) as any;
      setProjects(Array.isArray(response) ? response : response?.projects || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: any) => {
    try {
      const response = await apiClient.createProject(projectData);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const updateProject = async (projectId: string, updates: any) => {
    try {
      const response = await apiClient.updateProject(projectId, updates);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const response = await apiClient.deleteProject(projectId);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh: fetchProjects,
  };
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProject(projectId) as any;
      setProject(response?.project || response);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    project,
    loading,
    error,
    refresh: fetchProject,
  };
}
