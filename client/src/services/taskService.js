import apiClient from "./api";

// Get all tasks (with optional status filter)
export const getTasks = async (status = "") => {
  try {
    const url = status
      ? `/tasks?status=${encodeURIComponent(status)}`
      : "/tasks";
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

// Get single task by ID
export const getTaskById = async (taskId) => {
  try {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
};

// Get tasks by project ID
export const getTasksByProject = async (projectId, status = "") => {
  try {
    const url = status
      ? `/tasks/project/${projectId}?status=${encodeURIComponent(status)}`
      : `/tasks/project/${projectId}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching project tasks:", error);
    throw error;
  }
};

// Get overdue tasks
export const getOverdueTasks = async () => {
  try {
    const response = await apiClient.get("/tasks/overdue");
    return response.data;
  } catch (error) {
    console.error("Error fetching overdue tasks:", error);
    throw error;
  }
};

// Create a new task
export const createTask = async (taskData) => {
  try {
    const response = await apiClient.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

// Update a task (status, title, description, dueDate, assignedTo)
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await apiClient.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Save or update a task submission
export const saveTaskSubmission = async (taskId, submissionData) => {
  try {
    const response = await apiClient.post(
      `/tasks/${taskId}/submissions`,
      submissionData,
    );
    return response.data;
  } catch (error) {
    console.error("Error saving submission:", error);
    throw error;
  }
};

// Add admin feedback to a task
export const addTaskFeedback = async (taskId, feedbackData) => {
  try {
    const response = await apiClient.post(
      `/tasks/${taskId}/feedback`,
      feedbackData,
    );
    return response.data;
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
};
