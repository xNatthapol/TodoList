import apiClient from "./apiClient";

export const login = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Login failed");
  }
};

export const signup = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/signup", { email, password });
    return response.data;
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Signup failed");
  }
};
