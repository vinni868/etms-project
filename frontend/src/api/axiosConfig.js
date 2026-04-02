import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  }
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    
    // Automatically let the browser handle multipart boundaries
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const handleViewFile = async (endpoint) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    
    // Check if the response is actually JSON (Cloudinary URL)
    if (response.data.size < 2000) {
      const text = await response.data.text();
      try {
        const json = JSON.parse(text);
        if (json.url) {
          window.open(json.url, '_blank');
          return;
        }
      } catch (e) {
        // Not JSON
      }
    }

    const contentType = response.headers['content-type'] || 'application/pdf';
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    window.open(url, '_blank');
  } catch (err) {
    console.error("View error:", err);
    alert(err.response?.data?.message || "Failed to open document.");
  }
};

export const handleDownload = async (endpoint, fileName) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    
    // Check if the response is actually JSON (Cloudinary URL)
    if (response.data.size < 2000) {
      const text = await response.data.text();
      try {
        const json = JSON.parse(text);
        if (json.url) {
          window.open(json.url, '_blank');
          return;
        }
      } catch (e) {
        // Not JSON
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || 'document');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    alert(err.response?.data?.message || "Failed to download document.");
  }
};

export default api;
