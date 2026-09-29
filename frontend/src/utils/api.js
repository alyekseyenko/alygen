import axios from 'axios';
import { getAccessToken, clearSession } from './auth-storage';

function resolveApiHost() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3001';
}

export const API_HOST = resolveApiHost();

function attachAuthInterceptor(instance) {
  instance.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401 && import.meta.env.VITE_REQUIRE_AUTH === 'true') {
        clearSession();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?expired=1`;
        }
      }
      return Promise.reject(error);
    }
  );
}

export const api = axios.create({
  baseURL: `${API_HOST}/api`,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiQuick = axios.create({
  baseURL: `${API_HOST}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiHeavy = api;

attachAuthInterceptor(api);
attachAuthInterceptor(apiQuick);
attachAuthInterceptor(apiHeavy);

export default api;

export const fetchSystemHealth = async () => {
  const { data } = await api.get('/health/full');
  return data;
};

export const runSimulation = async (flow) => {
  const { data } = await api.get(`/system/audit/simulate/${flow}`);
  return data;
};

export const runSeniorAudit = async (category) => {
  const { data } = await api.get(`/system/audit/senior/${category}`);
  return data;
};

export const runUltimateAudit = async (category) => {
  const { data } = await api.get(`/system/audit/ultimate/${category}`);
  return data;
};

export const runLifecycleSimulation = async (step) => {
  const { data } = await api.get(`/system/audit/lifecycle/${step}`);
  return data;
};
