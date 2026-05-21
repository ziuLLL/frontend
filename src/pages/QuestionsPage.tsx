import React, { useEffect, useState, useCallback } from 'react';
import { questionsApi, answersApi } from '../services/api.ts';
import {
  saveQuestionsCache, getQuestionsCache, hasQuestionsCache,
  savePendingAnswer, calcOfflineXp, isOnline, getLastSync,
} from '../services/offline';
import { Question } from '../types/index.ts';
import { useAuthStore } from '../context/store.ts';
import { useToast, PageLoader, EmptyState, CardSkeleton } from '../components/UI.tsx';
import { Filter, WifiOff } from 'lucide-react';

const SUBJECTS = ['Todas', 'Português', 'Matemática'];
const DIFFICULTIES = ['Todas', 'Fácil', 'Médio', 'Difícil'];
const TOPICS_PT = ['Todos', 'Interpretação Textual', 'Concordância', 'Crase', 'Regência', 'Figuras de Linguagem', 'Ortografia', 'Sintaxe'];
const TOPICS_MT = ['Todos', 'Porcentagem', 'Equações do 1º Grau', 'Equações do 2º Grau', 'Geometria Plana', 'Estatística', 'Juros Simples', 'Razão e Proporção', 'Regra de Três', 'Álgebra'];

const PER_PAGE = 8;

export default function QuestionsPage() {
  const { updateUser, user } = useAuthStore();
  const { addToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!isOnline());
  const [subject, setSubject] = useState('Todas');
  const [difficulty, setDifficulty] = useState('Todas');
  const [topic, setTopic] = useState('Todos');
  const [answered, setAnswered] = useState<Record<string, { selected: number; correct: number; isCorrect: boolean; explanation: string }>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const online = isOnline();
    setOffline(!online);

    if (online) {
      try {
        const params: any = { limit: 80 };
        if (subject !== 'Todas') params.subject = subject;
        if (difficulty !== 'Todas') params.difficulty = difficulty;
        if (topic !== 'Todos') params.topic = topic;
        const data = await questionsApi.getAll(params);
        setQuestions(data);
        // Salva cache para uso offline
        if (subject === 'Todas' && difficulty === 'Todas' && topic === 'Todos') {
          saveQuestionsCache(data);
        }
        setPage(0);
      } catch {
        // Se API falhar, usa cache
        const cached = getQuestionsCache();
        if (cached.length > 0) {
          setQuestions(cached);
          addToast({ icon: '📦', title: 'Usando questões em cache', text: 'Sem conexão com o servidor' });
        }
      }
    } else {
      // Modo offline — usa cache
      const cached = getQuestionsCache();
      if (cached.length > 0) {
        let filtered = [...cached];
        if (subject !== 'Todas') filtered = filtered.filter(q => q.subject === subject);
        if (difficulty !== 'Todas') filtered = filtered.filter(q => q.difficulty === difficulty);
        if (topic !== 'Todos') filtered = filtered.filter(q => q.topic === topic);
        setQuestions(filtered);
      } else {
        setQuestions([]);
        addToast({ icon: '📵', title: 'Sem questões em cache', text: 'Conecte à internet pelo menos uma vez' });
      }
    }
    setLoading(false);
  }, [subject, difficulty, topic]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Sincroniza respostas pendentes quando voltar online
  useEffect(() => {
    const syncPending = async () => {
      const { getPendingAnswers, clearPendingAnswers } = await import('../services/offline');
      const pending = getPendingAnswers();
      if (pending.length === 0) return;
      try {
        for (const ans of pending) {
          await answersApi.submit(ans.questionId, ans.selectedIndex);
        }
        clearPendingAnswers();
        addToast({ icon: '☁️', title: `${pending.length} resposta(s) sincronizadas!`, text: 'XP atualizado' });
      } catch {}
    };

    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
  }, []);

  const handleAnswer = async (question: Question, selectedIndex: number) => {
    if (answered[question.id]) return;
    const isCorrect = selectedIndex === question.correct_index;

    // Salva no estado local imediatamente (feedback visual)
    setAnswered(prev => ({
      ...prev,
      [question.id]: { selected: selectedIndex, correct: question.correct_index, isCorrect, explanation: question.explanation }
    }));

    const xpEarned = calcOfflineXp(question.difficulty, isCorrect);

    if (isOnline()) {
      try {
        const result = await answersApi.submit(question.id, selectedIndex);
        updateUser({ xp: result.newXp, level: result.newLevel, streak: result.newStreak });
        if (result.newBadges?.length > 0) {
          result.newBadges.forEach((b: string) => addToast({ icon: '🏅', title: 'Nova conquista!', text: b }));
        }
      } catch {
        // Se falhar online, salva como pendente
        savePendingAnswer({ id: Math.random().toString(36).slice(2), questionId: question.id, selectedIndex, isCorrect, xpEarned, answeredAt: new Date().toISOString() });
      }
    } else {
      // Offline — salva como pendente e atualiza XP local
      savePendingAnswer({ id: Math.random().toString(36).slice(2), questionId: question.id, selectedIndex, isCorrect, xpEarned, answeredAt: new Date().toISOString() });
      updateUser({ xp: (user?.xp ?? 0) + xpEarned });
    }

    if (isCorrect) addToast({ icon: '✅', title: 'Correto!', text: xpEarned > 0 ? `+${xpEarned} XP` : '' });
    else addToast({ icon: '❌', title: 'Errado!', text: 'Veja a explicação abaixo' });
  };

  const topics = subject === 'Matemática' ? TOPICS_MT : subject === 'Português' ? TOPICS_PT : ['Todos'];
  const paginated = questions.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(questions.length / PER_PAGE);
  const correctCount = Object.values(answered).filter(a => a.isCorrect).length;
  const lastSync = getLastSync();

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="page-title">📝 Banco de Questões</div>
            <div className="page-sub">
              {questions.length} questões · {correctCount} acertos
              {offline && <span style={{ color: '#f59e0b', marginLeft: 8 }}>📵 Modo offline</span>}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} /> Filtros
          </button>
        </div>
      </div>

      {/* Banner offline */}
      {offline && hasQuestionsCache() && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, marginBottom: 14, fontSize: 13, color: '#f59e0b' }}>
          <WifiOff size={16} />
          <div>
            <strong>Você está offline.</strong> Questões em cache disponíveis.
            {lastSync && <span style={{ color: '#8888aa' }}> Última sync: {new Date(lastSync).toLocaleDateString('pt-BR')}</span>}
            <br />
            <span style={{ fontSize: 12, color: '#8888aa' }}>Suas respostas serão sincronizadas quando reconectar.</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>Matéria</div>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                {SUBJECTS.map(s => (
                  <button key={s} className={`filter-pill ${subject === s ? 'active' : ''}`}
                    onClick={() => { setSubject(s); setTopic('Todos'); }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>Dificuldade</div>
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d} className={`filter-pill ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}>{d}</button>
                ))}
              </div>
            </div>
            {subject !== 'Todas' && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>Tópico</div>
                <select value={topic} onChange={e => setTopic(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tabs">
        {SUBJECTS.map(s => (
          <div key={s} className={`tab ${subject === s ? 'active' : ''}`}
            onClick={() => { setSubject(s); setTopic('Todos'); }}>{s}</div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : paginated.length === 0 ? (
        <EmptyState icon={offline ? '📵' : '📝'} text={offline ? 'Sem questões em cache. Conecte à internet primeiro.' : 'Nenhuma questão encontrada com esses filtros.'} />
      ) : (
        <>
          {paginated.map((q, idx) => {
            const ans = answered[q.id];
            return (
              <div key={q.id} className="question-card fade-in">
                <div className="question-meta">
                  <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 700 }}>#{page * PER_PAGE + idx + 1}</span>
                  <span className={`tag ${q.difficulty === 'Fácil' ? 'tag-easy' : q.difficulty === 'Médio' ? 'tag-medium' : 'tag-hard'}`}>{q.difficulty}</span>
                  <span className="tag tag-accent">{q.topic}</span>
                  <span className="tag tag-muted">{q.subject}</span>
                </div>
                <div className="question-text">{q.statement}</div>
                <div className="options">
                  {q.options.map((opt, oi) => {
                    let cls = 'option';
                    if (ans) {
                      if (oi === ans.correct) cls += ' correct';
                      else if (oi === ans.selected) cls += ' wrong';
                    }
                    return (
                      <button key={oi} className={cls} onClick={() => handleAnswer(q, oi)} disabled={!!ans}>
                        <div className="option-letter">{['A','B','C','D'][oi]}</div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {ans && (
                  <div className="explanation">
                    <strong>{ans.isCorrect ? '✅ Correto!' : '❌ Incorreto!'}</strong>
                    {offline && !ans.isCorrect && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>📵 offline</span>}
                    {' '}{ans.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Anterior</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 36, height: 36, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: page === p ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', color: page === p ? '#fff' : 'var(--muted)' }}>
                    {p + 1}
                  </button>
                );
              })}
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
