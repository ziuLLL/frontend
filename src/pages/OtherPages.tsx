// ─── Theory Page ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { theoryApi, videosApi, progressApi, rankingApi } from '../services/api';
import { Theory, Video, UserProgress, RankingUser } from '../types';
import { useAuthStore } from '../context/store';
import { useToast } from '../components/UI';
import { PageLoader, EmptyState, ProgressBar, XpBar, CardSkeleton } from '../components/UI';
import { CheckCircle, Circle, ChevronLeft, Play } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
export function TheoryPage() {
  const { addToast } = useToast();
  const [theories, setTheories] = useState<Theory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Theory | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const { updateUser } = useAuthStore();

  useEffect(() => {
    theoryApi.getAll()
      .then(setTheories)
      .catch(() => addToast({ icon: '⚠️', title: 'Erro ao carregar teoria' }))
      .finally(() => setLoading(false));
  }, []);

  const markComplete = async (theory: Theory) => {
    try {
      const res = await theoryApi.markComplete(theory.id);
      if (!res.alreadyCompleted) {
        updateUser({ xp: res.xpEarned });
        addToast({ icon: '✅', title: 'Conteúdo concluído!', text: '+80 XP' });
        setTheories(prev => prev.map(t => t.id === theory.id ? { ...t, completed: true } : t));
        if (selected?.id === theory.id) setSelected({ ...theory, completed: true });
      }
    } catch { addToast({ icon: '⚠️', title: 'Erro ao marcar conteúdo' }); }
  };

  const filtered = subjectFilter === 'Todas' ? theories : theories.filter(t => t.subject === subjectFilter);
  const completedCount = theories.filter(t => t.completed).length;

  if (selected) return (
    <div className="page fade-in">
      <button className="btn btn-ghost" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => setSelected(null)}>
        <ChevronLeft size={16} /> Voltar
      </button>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <span className="tag tag-accent">{selected.subject}</span>
        {selected.completed && <span className="tag" style={{ background: 'rgba(16,185,129,.1)', color: 'var(--green)' }}>✅ Concluído</span>}
      </div>

      {/* Content rendered as simple text sections */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ whiteSpace: 'pre-line', fontSize: 14.5, color: 'var(--text)', lineHeight: 1.8 }}>
          {selected.content.replace(/##\s*/g, '').replace(/###\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1')}
        </div>
      </div>

      {selected.examples?.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">💡 Exemplos</div>
          {selected.examples.map((e, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)', borderRadius: 'var(--r-md)', marginBottom: 8, fontSize: 13.5, color: 'var(--text)' }}>{e}</div>
          ))}
        </div>
      )}

      {selected.common_errors?.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">⚠️ Erros Comuns na Prova</div>
          {selected.common_errors.map((e, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--r-md)', marginBottom: 8, fontSize: 13.5, color: 'var(--red)' }}>{e}</div>
          ))}
        </div>
      )}

      {selected.summary && (
        <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,rgba(16,185,129,.06),rgba(6,182,212,.04))', borderColor: 'rgba(16,185,129,.2)' }}>
          <div className="card-title">📋 Resumo Rápido</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8 }}>{selected.summary}</div>
        </div>
      )}

      {!selected.completed && (
        <button className="btn btn-primary btn-full" onClick={() => markComplete(selected)}>
          ✅ Marcar como concluído (+80 XP)
        </button>
      )}
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">📖 Teoria</div>
        <div className="page-sub">{completedCount} de {theories.length} conteúdos concluídos</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <ProgressBar value={theories.length > 0 ? Math.round((completedCount / theories.length) * 100) : 0} />
      </div>

      <div className="tabs">
        {['Todas', 'Português', 'Matemática'].map(s => (
          <div key={s} className={`tab ${subjectFilter === s ? 'active' : ''}`} onClick={() => setSubjectFilter(s)}>{s}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState text="Nenhum conteúdo disponível." />
      ) : (
        filtered.map(t => (
          <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 10, transition: 'all var(--transition)' }}
            onClick={() => setSelected(t)}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div style={{ flexShrink: 0, color: t.completed ? 'var(--green)' : 'var(--subtle)' }}>
              {t.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 8 }}>
                <span className="tag tag-accent" style={{ fontSize: 10 }}>{t.subject}</span>
                {t.completed && <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 600 }}>✓ Concluído</span>}
              </div>
            </div>
            <span style={{ color: 'var(--subtle)', fontSize: 18 }}>›</span>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Videos Page ──────────────────────────────────────────────────────────────
export function VideosPage() {
  const { addToast } = useToast();
  const { updateUser } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<Video | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    videosApi.getAll()
      .then(setVideos)
      .finally(() => setLoading(false));
  }, []);

  const markWatched = async (v: Video) => {
    try {
      await videosApi.updateProgress(v.id, { completed: true });
      updateUser({ xp: (useAuthStore.getState().user?.xp ?? 0) + 30 });
      addToast({ icon: '🎬', title: 'Vídeo concluído!', text: '+30 XP' });
      setVideos(prev => prev.map(x => x.id === v.id ? { ...x, userProgress: { ...x.userProgress, completed: true, watched_seconds: 0, notes } } : x));
    } catch { addToast({ icon: '⚠️', title: 'Erro ao salvar progresso' }); }
  };

  const saveNotes = async (v: Video) => {
    try {
      await videosApi.updateProgress(v.id, { notes });
      addToast({ icon: '📝', title: 'Anotações salvas!' });
    } catch { }
  };

  const filtered = subjectFilter === 'Todas' ? videos : videos.filter(v => v.subject === subjectFilter);

  if (playing) return (
    <div className="page fade-in">
      <button className="btn btn-ghost" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => { setPlaying(null); setNotes(''); }}>
        <ChevronLeft size={16} /> Voltar
      </button>
      <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '16/9', background: '#000', marginBottom: 14 }}>
        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playing.youtube_id}?autoplay=1&rel=0`}
          allow="autoplay; fullscreen" style={{ border: 'none' }} />
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{playing.title}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>{playing.professor} · {playing.duration}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!playing.userProgress?.completed && (
            <button className="btn btn-success btn-sm" onClick={() => markWatched(playing)}>✅ Marcar como assistido</button>
          )}
          {playing.userProgress?.completed && (
            <span className="tag" style={{ background: 'rgba(16,185,129,.1)', color: 'var(--green)', padding: '6px 14px' }}>✓ Assistido</span>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-title">📝 Anotações</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', minHeight: 120, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 14, padding: 12, outline: 'none', resize: 'vertical' }}
          placeholder="Anote os pontos importantes..." />
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => saveNotes(playing)}>Salvar</button>
      </div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">🎬 Videoaulas</div>
        <div className="page-sub">Professores: Noslen, Ferretto e outros</div>
      </div>
      <div className="tabs">
        {['Todas', 'Português', 'Matemática'].map(s => (
          <div key={s} className={`tab ${subjectFilter === s ? 'active' : ''}`} onClick={() => setSubjectFilter(s)}>{s}</div>
        ))}
      </div>
      {loading ? (
        <div className="grid-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid-3">
          {filtered.map(v => (
            <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'all var(--transition)' }}
              onClick={() => { setPlaying(v); setNotes(v.userProgress?.notes || ''); }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg3)' }}>
                <img src={v.thumbnail_url} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.3)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={18} style={{ marginLeft: 3 }} />
                  </div>
                </div>
                {v.userProgress?.completed && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>✓ Visto</div>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>{v.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{v.professor}</span>·<span>{v.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [data, setData] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <EmptyState text="Erro ao carregar dados." />;

  const { stats, progress, weeklyActivity } = data;
  const byTopic = [...progress].sort((a, b) => b.total_answered - a.total_answered);
  const pAcc = stats?.accuracy ?? 0;
  const previsao = Math.min(Math.round(pAcc * 1.05), 100);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">📊 Analytics</div>
        <div className="page-sub">Análise detalhada do seu desempenho</div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total', value: stats.totalAnswered, c: 'var(--accent)' },
          { label: 'Corretas', value: stats.totalCorrect, c: 'var(--green)' },
          { label: 'Erradas', value: stats.totalAnswered - stats.totalCorrect, c: 'var(--red)' },
          { label: 'Acerto', value: `${stats.accuracy}%`, c: 'var(--yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--c': s.c } as React.CSSProperties}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {stats.totalAnswered >= 10 && (
        <div className="card" style={{ marginBottom: 14, borderColor: 'rgba(99,102,241,.3)' }}>
          <div className="card-title">🎯 Previsão de Aprovação</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 48, fontWeight: 800, color: previsao >= 70 ? 'var(--green)' : previsao >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{previsao}%</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Baseado no desempenho atual</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{previsao >= 70 ? '🎉 Está no caminho da aprovação!' : previsao >= 50 ? '📈 Bom progresso, continue!' : '💪 Pratique mais questões!'}</div>
            </div>
          </div>
          <ProgressBar value={previsao} color={previsao >= 70 ? 'var(--green)' : previsao >= 50 ? 'var(--yellow)' : 'var(--red)'} />
        </div>
      )}

      {weeklyActivity?.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">📅 Atividade dos últimos dias</div>
          {weeklyActivity.map((w: any) => {
            const acc = w.count > 0 ? Math.round((w.correct / w.count) * 100) : 0;
            return (
              <div key={w.day} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', width: 90, flexShrink: 0 }}>{new Date(w.day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</div>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(Number(w.count) * 4, 100)}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', width: 60, textAlign: 'right', flexShrink: 0 }}>{w.count}q · {acc}%</div>
              </div>
            );
          })}
        </div>
      )}

      {byTopic.length > 0 && (
        <div className="card">
          <div className="card-title">📈 Desempenho por Tópico</div>
          {byTopic.map((p: any) => {
            const acc = p.total_answered > 0 ? Math.round((p.total_correct / p.total_answered) * 100) : 0;
            return (
              <div key={`${p.subject}-${p.topic}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', width: 150, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.topic}</div>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${acc}%`, background: acc >= 70 ? 'var(--green)' : acc >= 50 ? 'var(--yellow)' : 'var(--red)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', width: 42, textAlign: 'right', flexShrink: 0 }}>{acc}%</div>
              </div>
            );
          })}
        </div>
      )}

      {stats.totalAnswered === 0 && <EmptyState icon="📊" text="Responda questões para ver sua análise aqui." />}
    </div>
  );
}

// ─── Ranking Page ─────────────────────────────────────────────────────────────
export function RankingPage() {
  const { user } = useAuthStore();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rankingApi.get().then(setRanking).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">🏆 Ranking</div>
        <div className="page-sub">Top estudantes da plataforma</div>
      </div>
      {ranking.length === 0 ? <EmptyState text="Nenhum dado no ranking ainda." /> : (
        ranking.map((p, i) => {
          const isMe = p.id === user?.id;
          const acc = Number(p.total_answered) > 0 ? Math.round((Number(p.total_correct) / Number(p.total_answered)) * 100) : 0;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isMe ? 'rgba(99,102,241,.08)' : 'var(--surface)', border: `1px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', marginBottom: 8, transition: 'all var(--transition)' }}>
              <div style={{ width: 28, fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : 'var(--muted)', textAlign: 'center' }}>
                {i < 3 ? medals[i] : i + 1}
              </div>
              <div className="level-ring" style={{ width: 36, height: 36, fontSize: 14 }}>{p.level}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.name}{isMe ? ' (você)' : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>🔥 {p.streak}d streak · {Number(p.total_answered)}q · {acc}%</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)' }}>{p.xp.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>XP</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
const BADGE_LABELS: Record<string, { icon: string; name: string; desc: string }> = {
  first_q: { icon: '🎯', name: 'Primeira Questão', desc: 'Respondeu sua primeira questão' },
  streak_3: { icon: '🔥', name: 'Em Chamas', desc: '3 dias de streak' },
  streak_7: { icon: '⚡', name: 'Imparável', desc: '7 dias de streak' },
  port_50: { icon: '📚', name: 'Mestre do Português', desc: '50 questões de Português' },
  mat_50: { icon: '🔢', name: 'Calculista', desc: '50 questões de Matemática' },
  perfect_10: { icon: '✨', name: 'Impecável', desc: '10 acertos seguidos' },
};

export function ProfilePage() {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (!user) return null;
  const level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
  const curr = Math.pow(level - 1, 2) * 100;
  const next = Math.pow(level, 2) * 100;
  const pct = Math.round(((user.xp - curr) / (next - curr)) * 100);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">👤 Perfil</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div className="level-ring" style={{ width: 64, height: 64, fontSize: 24 }}>{level}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user.email}</div>
            <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 2 }}>Nível {level} · {user.xp} XP</div>
          </div>
        </div>
        <XpBar pct={pct} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{user.xp - curr} / {next - curr} XP para nível {level + 1}</div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid-4" style={{ marginBottom: 16 }}>
          {[
            { label: 'Questões', value: data.stats.totalAnswered, icon: '📝' },
            { label: 'Acerto', value: `${data.stats.accuracy}%`, icon: '🎯' },
            { label: 'Streak', value: `${user.streak}d`, icon: '🔥' },
            { label: 'Badges', value: user.badges?.length ?? 0, icon: '🏅' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🏅 Conquistas</div>
        <div className="grid-3" style={{ gap: 10 }}>
          {Object.entries(BADGE_LABELS).map(([id, badge]) => {
            const earned = user.badges?.includes(id);
            return (
              <div key={id} style={{ background: 'var(--bg3)', border: `1px solid ${earned ? 'var(--yellow)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', padding: 14, textAlign: 'center', opacity: earned ? 1 : .45, filter: earned ? 'none' : 'grayscale(1)' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{badge.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{badge.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{badge.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matérias fracas */}
      {data && data.progress.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">⚠️ Matérias para reforçar</div>
          {data.progress
            .filter((p: any) => p.total_answered > 0 && (p.total_correct / p.total_answered) < 0.6)
            .slice(0, 5)
            .map((p: any) => {
              const acc = Math.round((p.total_correct / p.total_answered) * 100);
              return (
                <div key={`${p.subject}-${p.topic}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.topic}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.subject} · {p.total_answered} questões</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, color: 'var(--red)' }}>{acc}%</div>
                </div>
              );
            })}
          {data.progress.filter((p: any) => p.total_answered > 0 && (p.total_correct / p.total_answered) < 0.6).length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--green)' }}>✅ Ótimo desempenho em todos os tópicos!</div>
          )}
        </div>
      )}

      <button className="btn btn-danger btn-full" onClick={logout}>🚪 Sair da conta</button>
    </div>
  );
}
