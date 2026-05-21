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
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authApi.login({ email, password });
          // Token já salvo pelo api.ts via secureStorage
          // Não armazena email/senha no estado — só dados públicos do usuário
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
        // Limpa tudo — token, cache de sessão, dados do usuário
        secureStorage.clearAll();
        set({ user: null, isAuthenticated: false, error: null });
      },

      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },

      fetchMe: async () => {
        // Só tenta se tiver token válido
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
      // Persiste só dados não-sensíveis
      // Token fica no secureStorage separado, não aqui
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              name: state.user.name,
              // email NÃO é persistido no zustand store
              xp: state.user.xp,
              level: state.user.level,
              streak: state.user.streak,
              badges: state.user.badges,
              last_study_date: state.user.last_study_date,
              created_at: state.user.created_at,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
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
