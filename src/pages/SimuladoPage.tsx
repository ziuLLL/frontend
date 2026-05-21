import React, { useState, useEffect, useRef, useCallback } from 'react';
import { questionsApi, answersApi } from '../services/api';
import { Question, AnswerResult } from '../types';
import { useAuthStore } from '../context/store';
import { useToast } from '../components/UI';
import { ProgressBar } from '../components/UI';

type Phase = 'config' | 'active' | 'result';

interface Config { subject: string; count: number; time: number; }
interface QuizAnswer { selected: number | null; result: AnswerResult | null; }

export default function SimuladoPage() {
  const { updateUser } = useAuthStore();
  const { addToast } = useToast();
  const [phase, setPhase] = useState<Phase>('config');
  const [config, setConfig] = useState<Config>({ subject: 'Ambas', count: 20, time: 45 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const finish = useCallback(async (qs: Question[], ans: QuizAnswer[]) => {
    stopTimer();
    // Submit all unanswered as wrong
    const finalAnswers = [...ans];
    const submitPromises = qs.map(async (q, i) => {
      if (finalAnswers[i].selected === null) {
        finalAnswers[i] = { selected: -1, result: { isCorrect: false, correctIndex: q.correct_index, xpEarned: 0, newXp: 0, newLevel: 1, newStreak: 0, newBadges: [] } };
      } else if (!finalAnswers[i].result) {
        try {
          const res = await answersApi.submit(q.id, finalAnswers[i].selected!);
          finalAnswers[i].result = res;
          return res;
        } catch { return null; }
      }
    });
    await Promise.all(submitPromises);
    setAnswers(finalAnswers);

    // Update user with last answer's values
    const lastResult = finalAnswers.filter(a => a.result?.newXp).pop()?.result;
    if (lastResult) updateUser({ xp: lastResult.newXp, level: lastResult.newLevel, streak: lastResult.newStreak });

    const correct = finalAnswers.filter(a => a.result?.isCorrect).length;
    const pct = Math.round((correct / qs.length) * 100);
    if (pct >= 90) addToast({ icon: '🏆', title: 'Excelente!', text: `${pct}% de acerto!` });
    else if (pct >= 70) addToast({ icon: '🎯', title: 'Bom desempenho!', text: `${pct}% de acerto` });

    setPhase('result');
  }, [stopTimer, updateUser, addToast]);

  const start = async () => {
    setLoading(true);
    try {
      let qs: Question[];
      if (config.subject === 'Ambas') {
        const [pt, mt] = await Promise.all([
          questionsApi.getPortuguese({ limit: Math.ceil(config.count / 2) }),
          questionsApi.getMath({ limit: Math.floor(config.count / 2) }),
        ]);
        qs = [...pt, ...mt].sort(() => Math.random() - .5).slice(0, config.count);
      } else if (config.subject === 'Português') {
        qs = await questionsApi.getPortuguese({ limit: config.count });
      } else {
        qs = await questionsApi.getMath({ limit: config.count });
      }
      setQuestions(qs);
      setAnswers(qs.map(() => ({ selected: null, result: null })));
      setCurrent(0);
      const secs = config.time * 60;
      setTimeLeft(secs);
      setPhase('active');
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { finish(qs, qs.map(() => ({ selected: null, result: null }))); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch { addToast({ icon: '⚠️', title: 'Erro ao carregar questões' }); }
    finally { setLoading(false); }
  };

  useEffect(() => () => stopTimer(), [stopTimer]);

  // Config screen
  if (phase === 'config') return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">⏱️ Simulado</div>
        <div className="page-sub">Configure e inicie sua prova cronometrada</div>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-title">⚙️ Configuração</div>
        {[
          { label: 'Matéria', key: 'subject', opts: ['Ambas', 'Português', 'Matemática'] },
          { label: 'Questões', key: 'count', opts: [10, 15, 20, 30] },
          { label: 'Tempo (min)', key: 'time', opts: [20, 30, 45, 60, 90] },
        ].map(cfg => (
          <div key={cfg.key} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>{cfg.label}</div>
            <div className="filter-bar" style={{ marginBottom: 0 }}>
              {cfg.opts.map(o => (
                <button key={String(o)} className={`filter-pill ${(config as any)[cfg.key] === o ? 'active' : ''}`}
                  onClick={() => setConfig(c => ({ ...c, [cfg.key]: o }))}>{String(o)}</button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-primary btn-full" onClick={start} disabled={loading}>
          {loading ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Carregando...</> : '🚀 Iniciar Simulado'}
        </button>
      </div>
    </div>
  );

  // Active quiz
  if (phase === 'active') {
    const q = questions[current];
    const ans = answers[current];
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const pct = Math.round((current / questions.length) * 100);

    const selectAnswer = async (idx: number) => {
      if (ans.selected !== null || submitting) return;
      setSubmitting(true);
      const newAnswers = [...answers];
      newAnswers[current] = { selected: idx, result: null };
      setAnswers(newAnswers);
      try {
        const result = await answersApi.submit(q.id, idx);
        newAnswers[current] = { selected: idx, result };
        setAnswers([...newAnswers]);
        updateUser({ xp: result.newXp, level: result.newLevel });
      } catch { /* store anyway */ }
      setSubmitting(false);
    };

    return (
      <div className="page fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Questão</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>{current + 1} / {questions.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: timeLeft < 120 ? 'var(--red)' : timeLeft < 300 ? 'var(--yellow)' : 'var(--text)' }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>restantes</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => finish(questions, answers)}>Finalizar</button>
        </div>
        <ProgressBar value={pct} />
        <div style={{ marginBottom: 18 }} />

        <div className="question-card">
          <div className="question-meta">
            <span className={`tag ${q.difficulty === 'Fácil' ? 'tag-easy' : q.difficulty === 'Médio' ? 'tag-medium' : 'tag-hard'}`}>{q.difficulty}</span>
            <span className="tag tag-accent">{q.topic}</span>
            <span className="tag tag-muted">{q.subject}</span>
          </div>
          <div className="question-text">{q.statement}</div>
          <div className="options">
            {q.options.map((opt, oi) => {
              let cls = 'option';
              if (ans.selected !== null) {
                if (oi === q.correct_index) cls += ' correct';
                else if (oi === ans.selected) cls += ' wrong';
              }
              return (
                <button key={oi} className={cls} onClick={() => selectAnswer(oi)} disabled={ans.selected !== null}>
                  <div className="option-letter">{['A', 'B', 'C', 'D'][oi]}</div>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
          {ans.selected !== null && (
            <div className="explanation">
              <strong>{ans.selected === q.correct_index ? '✅ Correto!' : '❌ Incorreto!'}</strong>
              {' '}{q.explanation}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {current > 0 && <button className="btn btn-secondary" onClick={() => setCurrent(c => c - 1)}>← Anterior</button>}
          {current < questions.length - 1
            ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Próxima →</button>
            : <button className="btn btn-primary" onClick={() => finish(questions, answers)}>✅ Finalizar</button>}
        </div>
      </div>
    );
  }

  // Result screen
  const correct = answers.filter(a => a.result?.isCorrect).length;
  const pct = Math.round((correct / questions.length) * 100);
  const xpTotal = answers.reduce((acc, a) => acc + (a.result?.xpEarned ?? 0), 0);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div className="page-title">📊 Resultado do Simulado</div>
      </div>
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{pct >= 90 ? '🏆' : pct >= 70 ? '🎯' : pct >= 50 ? '📚' : '💪'}</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 48, fontWeight: 800, color: pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)' }}>{pct}%</div>
        <div style={{ fontSize: 16, color: 'var(--text)', marginTop: 6 }}>{correct} de {questions.length} corretas</div>
        <div style={{ fontSize: 14, color: 'var(--yellow)', marginTop: 8 }}>+{xpTotal} XP ganhos</div>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setPhase('config')}>🔄 Novo Simulado</button>
      </div>

      {/* Detail review */}
      <div className="card">
        <div className="card-title">📋 Revisão Detalhada</div>
        {questions.map((q, i) => {
          const ans = answers[i];
          const ok = ans.result?.isCorrect;
          return (
            <div key={q.id} style={{ padding: '12px 0', borderBottom: i < questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span>{ok ? '✅' : '❌'}</span>
                <span className="tag tag-accent">{q.topic}</span>
                <span className="tag tag-muted">{q.subject}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{q.statement.slice(0, 100)}…</div>
              {!ok && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 2 }}>Gabarito: {q.options[q.correct_index]}</div>}
              {!ok && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{q.explanation}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
