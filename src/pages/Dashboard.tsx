import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store.ts';
import { progressApi } from '../services/api.ts';
import { UserProgress } from '../types/index.ts';
import { PageLoader, ProgressBar, XpBar } from '../components/UI.tsx';
import { InstallButton } from '../components/InstallBanner.tsx';
import { getPendingAnswers } from '../services/offline';

function getLevel(xp: number) {
  const lvl = Math.floor(Math.sqrt(xp / 100)) + 1;
  const curr = Math.pow(lvl - 1, 2) * 100;
  const next = Math.pow(lvl, 2) * 100;
  return { level: lvl, pct: Math.round(((xp - curr) / (next - curr)) * 100), next, curr };
}

export default function Dashboard() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingCount = getPendingAnswers().length;

  useEffect(() => {
    progressApi.get()
      .then(d => { setData(d); updateUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const stats = data?.stats;
  const u = data?.user ?? user!;
  const { level, pct, next, curr } = getLevel(u?.xp ?? 0);

  const todayActivity = data?.weeklyActivity?.find((w: any) => {
    const today = new Date().toISOString().split('T')[0];
    return w.day?.startsWith(today);
  });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">Bom estudo, {u?.name?.split(' ')[0]}! 👋</div>
        <div className="page-sub">Central de preparação FAETEC/COSEAC</div>
      </div>

      {/* Botão de instalar — destaque na tela inicial */}
      <div style={{ marginBottom: 16 }}>
        <InstallButton />
      </div>

      {/* Respostas pendentes de sincronizar */}
      {pendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#f59e0b' }}>
          ⏳ <strong>{pendingCount} resposta(s)</strong> aguardando sincronização — conecte à internet para salvar seu progresso
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: 'Questões feitas', value: stats?.totalAnswered ?? 0, sub: 'total', icon: '📝', c: 'var(--accent)' },
          { label: 'Taxa de acerto', value: `${stats?.accuracy ?? 0}%`, sub: 'aproveitamento', icon: '🎯', c: 'var(--green)' },
          { label: 'Streak', value: `${u?.streak ?? 0}d`, sub: 'dias seguidos', icon: '🔥', c: 'var(--orange)' },
          { label: 'XP Total', value: (u?.xp ?? 0).toLocaleString(), sub: `Nível ${level}`, icon: '⭐', c: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--c': s.c } as React.CSSProperties}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* XP */}
        <div className="card">
          <div className="card-title">⭐ Progresso de XP</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div className="level-ring" style={{ width: 56, height: 56, fontSize: 20 }}>{level}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Nível {level}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{(u?.xp ?? 0) - curr} / {next - curr} XP</div>
              <XpBar pct={pct} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Badges', value: u?.badges?.length ?? 0, icon: '🏅' },
              { label: 'Hoje', value: todayActivity?.count ?? 0, icon: '📅' },
              { label: 'Corretas', value: todayActivity?.correct ?? 0, icon: '✅' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 10, background: 'var(--bg3)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Desempenho por matéria */}
        <div className="card">
          <div className="card-title">📊 Desempenho por Matéria</div>
          {stats?.bySubject && Object.entries(stats.bySubject).length > 0 ? (
            Object.entries(stats.bySubject).map(([subject, d]: any) => {
              const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
              return (
                <div key={subject} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{subject}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{acc}% · {d.total}q</span>
                  </div>
                  <ProgressBar value={acc} color={acc >= 70 ? 'var(--green)' : acc >= 50 ? 'var(--yellow)' : 'var(--red)'} />
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Responda questões para ver seu desempenho aqui.</div>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="card">
        <div className="card-title">⚡ Acesso Rápido</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '📝 Praticar', path: '/questions' },
            { label: '⏱️ Simulado', path: '/simulado' },
            { label: '📖 Teoria', path: '/theory' },
            { label: '🎬 Videoaulas', path: '/videos' },
            { label: '📊 Analytics', path: '/analytics' },
            { label: '🏆 Ranking', path: '/ranking' },
          ].map(a => (
            <button key={a.path} className="btn btn-secondary btn-sm" onClick={() => navigate(a.path)}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
