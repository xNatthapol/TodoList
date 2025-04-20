import apiClient from "./apiClient";

export const getTodos = async () => {
  try {
    const response = await apiClient.get("/todos");
    return response.data;
  } catch (error) {
    console.error("Get todos error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to fetch todos");
  }
};

export const addTodo = async (title, description, imageUrl) => {
  try {
    const payload = { title, description, image_url: imageUrl || "" };
    const response = await apiClient.post("/todos", payload);
    return response.data;
  } catch (error) {
    console.error("Add todo error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to add todo");
  }
};

export const updateTodoStatus = async (id, status) => {
  try {
    const response = await apiClient.put(`/todos/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(
      "Update todo status error:",
      error.response?.data || error.message,
    );
    throw error.response?.data || new Error("Failed to update status");
  }
};

export const updateTodo = async (id, updateData) => {
  try {
    const payload = {};
    if (updateData.title !== undefined) payload.title = updateData.title;
    if (updateData.description !== undefined)
      payload.description = updateData.description;
    if (updateData.imageUrl !== undefined)
      payload.image_url = updateData.imageUrl;

    const response = await apiClient.patch(`/todos/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(
      "Update todo content error:",
      error.response?.data || error.message,
    );
    throw error.response?.data || new Error("Failed to update todo content");
  }
};

export const deleteTodo = async (id) => {
  try {
    const response = await apiClient.delete(`/todos/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete todo error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to delete todo");
  }
};
