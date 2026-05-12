import apiClient from "./api";

// Get all projects for user
export const getProjects = async () => {
  try {
    const response = await apiClient.get("/projects");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData) => {
  try {
    const response = await apiClient.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Get single project
export const getProject = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

// Update a project
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    const response = await apiClient.delete(`/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// Add member to project
export const addProjectMember = async (projectId, memberId) => {
  try {
    const response = await apiClient.post(`/projects/${projectId}/members`, {
      memberId,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

// Remove member from project
export const removeProjectMember = async (projectId, memberId) => {
  try {
    const response = await apiClient.delete(
      `/projects/${projectId}/members/${memberId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};
