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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const handleViewFile = async (endpoint) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    const contentType = response.headers['content-type'] || 'application/pdf';
    const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    window.open(url, '_blank');
    // Note: objectURL lives as long as the document is open. 
    // It's safe for simple viewing in a new tab.
  } catch (err) {
    console.error("View error:", err);
    alert(err.response?.data?.message || "Failed to open document.");
  }
};

export const handleDownload = async (endpoint, fileName) => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // For inline view, we don't necessarily want to force download if we are using _blank
    // but a hidden link click is the standard way to trigger authenticated browser actions.
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
