import axios from 'axios';
import { secureStorage, isTokenExpired } from './secure';

const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Injeta token e valida expiração antes de cada request
api.interceptors.request.use((config) => {
  const token = secureStorage.getToken();
  if (token) {
    if (isTokenExpired(token)) {
      // Token expirado — limpa e redireciona
      secureStorage.clearAll();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expirado'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove headers que vazam informações
  delete config.headers['X-Powered-By'];
  return config;
});

// Trata respostas de erro globalmente
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      secureStorage.clearAll();
      window.location.href = '/login';
    }
    // Não expõe detalhes internos do erro para o usuário
    const message = error.response?.data?.error || 'Erro de conexão. Tente novamente.';
    return Promise.reject(new Error(message));
  }
);

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => {
      secureStorage.setToken(r.data.token);
      return r.data;
    }),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => {
      secureStorage.setToken(r.data.token);
      return r.data;
    }),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// ── Questions ─────────────────────────────────────────
export const questionsApi = {
  getAll: (params?: { subject?: string; topic?: string; difficulty?: string; limit?: number }) =>
    api.get('/questions', { params }).then((r) => r.data),
  getMath: (params?: { difficulty?: string; limit?: number }) =>
    api.get('/questions/math', { params }).then((r) => r.data),
  getPortuguese: (params?: { difficulty?: string; limit?: number }) =>
    api.get('/questions/portuguese', { params }).then((r) => r.data),
  getTopics: () => api.get('/questions/topics').then((r) => r.data),
};

// ── Answers ───────────────────────────────────────────
export const answersApi = {
  submit: (questionId: string, selectedIndex: number) =>
    api.post('/answer', { questionId, selectedIndex }).then((r) => r.data),
};

// ── Progress ──────────────────────────────────────────
export const progressApi = {
  get: () => api.get('/user/progress').then((r) => r.data),
};

// ── Ranking ───────────────────────────────────────────
export const rankingApi = {
  get: () => api.get('/ranking').then((r) => r.data),
};

// ── Videos ───────────────────────────────────────────
export const videosApi = {
  getAll: (subject?: string) =>
    api.get('/videos', { params: subject ? { subject } : {} }).then((r) => r.data),
  updateProgress: (videoId: string, data: { watchedSeconds?: number; completed?: boolean; notes?: string }) =>
    api.patch(`/videos/${videoId}/progress`, data).then((r) => r.data),
};

// ── Theory ───────────────────────────────────────────
export const theoryApi = {
  getAll: (subject?: string) =>
    api.get('/theory', { params: subject ? { subject } : {} }).then((r) => r.data),
  markComplete: (theoryId: string) =>
    api.post(`/theory/${theoryId}/complete`).then((r) => r.data),
};
