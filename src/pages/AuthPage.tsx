import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate('/');
    } catch { /* error shown via store */ }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,var(--accent),var(--purple))', padding: '10px 20px', borderRadius: 14, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>FAETEC PRO</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Preparatório COSEAC — Plataforma Enterprise</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 'var(--r-md)', padding: 4, marginBottom: 24 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); clearError(); }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--r-sm)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all var(--transition)', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#fff' : 'var(--muted)' }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Nome completo</label>
                <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required minLength={2} autoComplete="name" />
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div className="input-group">
              <label className="input-label">Senha</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoading} style={{ marginTop: 8 }}>
              {isLoading
                ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Aguarde...</>
                : mode === 'login' ? '🚀 Entrar' : '✨ Criar minha conta'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--muted)' }}>
              💡 <strong style={{ color: 'var(--accent2)' }}>Sem conta?</strong> Clique em "Criar conta" acima. É gratuito!
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--subtle)' }}>
          Preparação focada na prova FAETEC/COSEAC
        </div>
      </div>
    </div>
  );
}
