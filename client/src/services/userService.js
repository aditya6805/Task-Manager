import apiClient from "./api";

// Sync Firebase authenticated user into MongoDB
export const syncUser = async (userData = {}) => {
  try {
    const response = await apiClient.post("/users/sync", userData);
    return response.data;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put("/users/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};
