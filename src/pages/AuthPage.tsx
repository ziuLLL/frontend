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

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: "'DM Sans', sans-serif",
      background: '#0B1224',
      color: '#F0EDE8',
    },
    left: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '60px 72px',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.12em',
      color: '#C9A96E',
      textTransform: 'uppercase',
      marginBottom: 20,
    },
    title: {
      fontFamily: "'DM Serif Display', serif",
      fontSize: 36,
      lineHeight: 1.15,
      color: '#F0EDE8',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#8A92A8',
      marginBottom: 44,
      fontWeight: 300,
    },
    fieldWrap: { marginBottom: 20 },
    label: {
      display: 'block',
      fontSize: 12,
      fontWeight: 500,
      color: '#8A92A8',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    input: {
      width: '100%',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '13px 16px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      color: '#F0EDE8',
      outline: 'none',
    },
    hint: { fontSize: 12, color: '#545F7A', marginTop: 6 },
    submitBtn: {
      width: '100%',
      background: '#C9A96E',
      color: '#0B1224',
      border: 'none',
      padding: '14px',
      borderRadius: 8,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14,
      fontWeight: 500,
      cursor: 'pointer',
      marginTop: 8,
    },
    divider: { display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' },
    dividerLine: { flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' },
    dividerText: { fontSize: 12, color: '#545F7A' },
    altBtn: {
      width: '100%',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#8A92A8',
      padding: 12,
      borderRadius: 8,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13,
      cursor: 'pointer',
    },
    tabRow: {
      display: 'flex',
      gap: 4,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 8,
      padding: 4,
      marginBottom: 28,
    },
    errorBox: {
      background: 'rgba(224,92,92,0.1)',
      border: '1px solid rgba(224,92,92,0.2)',
      borderRadius: 8,
      padding: '12px 16px',
      fontSize: 13,
      color: '#E05C5C',
      marginBottom: 16,
    },
    right: {
      background: '#16213E',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 48,
    },
    rightBg: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #0B1224 0%, #1A2744 50%, #0f1e3a 100%)',
    },
    rightPattern: {
      position: 'absolute',
      inset: 0,
      opacity: 0.06,
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(201,169,110,0.8) 1px, transparent 0)',
      backgroundSize: '32px 32px',
    },
    badge: {
      position: 'absolute',
      top: 48,
      right: 48,
      zIndex: 2,
      background: 'rgba(201,169,110,0.12)',
      border: '1px solid rgba(201,169,110,0.2)',
      borderRadius: 100,
      padding: '8px 18px',
      fontSize: 12,
      color: '#C9A96E',
      letterSpacing: '0.05em',
    },
    quote: {
      position: 'relative',
      zIndex: 2,
      borderLeft: '2px solid #C9A96E',
      paddingLeft: 24,
    },
    quoteText: {
      fontFamily: "'DM Serif Display', serif",
      fontStyle: 'italic',
      fontSize: 19,
      lineHeight: 1.55,
      color: '#F0EDE8',
      marginBottom: 16,
    },
    quoteAuthor: { fontSize: 13, color: '#8A92A8' },
  };

  const tabStyle = (m: 'login' | 'register'): React.CSSProperties => ({
    flex: 1,
    padding: '9px 0',
    borderRadius: 6,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    background: mode === m ? '#C9A96E' : 'transparent',
    color: mode === m ? '#0B1224' : '#8A92A8',
  });

  return (
    <>
      {/* Google Fonts — adicione no index.html se preferir */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap"
        rel="stylesheet"
      />

      <div style={styles.page}>
        {/* ── ESQUERDA: formulário ── */}
        <div style={styles.left}>
          <div style={styles.eyebrow}>Bem-vindo de volta</div>
          <h1 style={styles.title}>Acesse sua<br />conta</h1>
          <p style={styles.subtitle}>Continue de onde parou.</p>

          {/* Tabs login / criar conta */}
          <div style={styles.tabRow}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                style={tabStyle(m)}
                onClick={() => { setMode(m); clearError(); }}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={styles.fieldWrap}>
                <label style={styles.label}>Nome completo</label>
                <input
                  style={styles.input}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </div>
            )}

            <div style={styles.fieldWrap}>
              <label style={styles.label}>E-mail</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={styles.fieldWrap}>
              <label style={styles.label}>Senha</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'login' && (
                <div style={styles.hint}>
                  Esqueceu?{' '}
                  <a href="#" style={{ color: '#C9A96E', textDecoration: 'none' }}>
                    Recuperar acesso
                  </a>
                </div>
              )}
            </div>

            <button type="submit" style={styles.submitBtn} disabled={isLoading}>
              {isLoading
                ? 'Aguarde...'
                : mode === 'login'
                ? 'Entrar na plataforma'
                : 'Criar minha conta'}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div style={styles.divider}>
                <hr style={styles.dividerLine} />
                <span style={styles.dividerText}>ou</span>
                <hr style={styles.dividerLine} />
              </div>
              <button style={styles.altBtn} onClick={() => { setMode('register'); clearError(); }}>
                Criar conta — é gratuito
              </button>
            </>
          )}
        </div>

        {/* ── DIREITA: painel decorativo ── */}
        <div style={styles.right}>
          <div style={styles.rightBg} />
          <div style={styles.rightPattern} />
          <div style={styles.badge}>✦ Plataforma Enterprise</div>

          {/* Círculos decorativos */}
          {[400, 280, 160].map((size, i) => (
            <div key={i} style={{
              position: 'absolute',
              zIndex: 1,
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              borderRadius: '50%',
              border: '1px solid rgba(201,169,110,0.08)',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}

          <div style={styles.quote}>
            <p style={styles.quoteText}>
              "Educação não transforma o mundo. Educação muda as pessoas. Pessoas transformam o mundo."
            </p>
            <div style={styles.quoteAuthor}>Paulo Freire · Pedagogo e educador brasileiro</div>
          </div>
        </div>
      </div>
    </>
  );
}
