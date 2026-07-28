import axios from 'axios';

// Empty baseURL → requests use Vite dev-server proxy (/api → localhost:4000)
// This avoids cross-origin (CORS) issues in development.
const api = axios.create({
  baseURL: '',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_token');
  if (token) {
    config.headers['x-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const wasLoggedIn = !!localStorage.getItem('pp_token');
      localStorage.removeItem('pp_token');
      localStorage.removeItem('pp_user');
      if (wasLoggedIn) {
        sessionStorage.setItem('pp_auth_msg', 'Tu sesión ha expirado. Inicia sesión nuevamente.');
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
