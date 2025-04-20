import apiClient from "./apiClient";

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post("/uploads/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Image upload service error:",
      error.response?.data || error.message,
    );
    const errorMsg = error.response?.data?.error || "Image upload failed";
    throw new Error(errorMsg);
  }
};
