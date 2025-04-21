import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error(
        "API request Unauthorized (401):",
        error.response.data || error.message,
      );
      localStorage.removeItem("authToken");
      if (window.location.pathname !== "/login") {
        // Avoid redirect loop if already on login
        console.log("Redirecting to login due to 401 error.");
        window.location.href = "/login";
      }

      return Promise.reject(
        new Error("Session expired or invalid token. Redirecting to login."),
      );
    }

    return Promise.reject(error);
  },
);

export default apiClient;
