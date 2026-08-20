import axios from 'axios';

// Use relative path so Vite proxy handles it locally,
// and the deployed frontend hits its own backend directly.
const API_URL = '/api/';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
