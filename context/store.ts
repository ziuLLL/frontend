import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../services/api';
import { secureStorage } from '../services/secure';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false, // sempre começa false — fetchMe valida o token
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authApi.login({ email, password });
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e: any) {
          set({ error: e.message || 'Erro ao fazer login', isLoading: false });
          throw e;
        }
      },
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authApi.register({ name, email, password });
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (e: any) {
          set({ error: e.message || 'Erro ao criar conta', isLoading: false });
          throw e;
        }
      },
      logout: () => {
        secureStorage.clearAll();
        set({ user: null, isAuthenticated: false, error: null });
      },
      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },
      fetchMe: async () => {
        const token = secureStorage.getToken();
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch {
          secureStorage.clearAll();
          set({ user: null, isAuthenticated: false });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'faetec-session',
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              name: state.user.name,
              // email NÃO é persistido
              xp: state.user.xp,
              level: state.user.level,
              streak: state.user.streak,
              badges: state.user.badges,
              last_study_date: state.user.last_study_date,
              created_at: state.user.created_at,
            }
          : null,
        // isAuthenticated NÃO é persistido — sempre derivado do token
      }),
    }
  )
);

// Cache offline de questões
interface OfflineState {
  cachedQuestions: Record<string, any[]>;
  cacheQuestions: (key: string, questions: any[]) => void;
  getCached: (key: string) => any[] | null;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      cachedQuestions: {},
      cacheQuestions: (key, questions) =>
        set((s) => ({ cachedQuestions: { ...s.cachedQuestions, [key]: questions } })),
      getCached: (key) => get().cachedQuestions[key] || null,
    }),
    { name: 'faetec-offline' }
  )
);
