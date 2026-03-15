import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/";

const api = axios.create({
  baseURL: BASE_URL,
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/token/")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        return Promise.reject(error);
      }

      try {

        const res = await api.post("token/refresh/", { refresh: refreshToken });

        localStorage.setItem("access", res.data.access);

        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


const startAutoRefresh = () => {
  setInterval(async () => {
    const refreshToken = localStorage.getItem("refresh");
    const accessToken = localStorage.getItem("access");

    if (!refreshToken || !accessToken) return;

    try {
      const res = await api.post("token/refresh/", { refresh: refreshToken });
      localStorage.setItem("access", res.data.access);
      console.log("Access token updated automatically");
    } catch (err) {
      console.error("Refresh token has expired", err);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
  }, 4 * 60 * 1000);
};

startAutoRefresh();

export default api;
