import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastItem { id: string; icon?: string; title: string; text?: string; }
interface ToastCtx { addToast: (t: Omit<ToastItem, 'id'>) => void; }

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.icon && <span className="toast-icon">{t.icon}</span>}
            <div>
              <div className="toast-title">{t.title}</div>
              {t.text && <div className="toast-text">{t.text}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ large }: { large?: boolean }) {
  return <div className={large ? 'spinner spinner-lg' : 'spinner'} />;
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner large />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, borderRadius = 8 }: { width?: string | number; height?: number; borderRadius?: number }) {
  return <div className="skeleton" style={{ width, height, borderRadius }} />;
}

export function CardSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton height={14} width="40%" />
      <Skeleton height={20} width="70%" />
      <Skeleton height={12} width="55%" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', text }: { icon?: string; text: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${Math.min(value, 100)}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

// ── XP bar ────────────────────────────────────────────────────────────────────
export function XpBar({ pct }: { pct: number }) {
  return (
    <div className="xp-bar">
      <div className="xp-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}
