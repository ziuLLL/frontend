// ═══════════════════════════════════════════════════════
// OFFLINE SERVICE — salva questões localmente e sincroniza
// ═══════════════════════════════════════════════════════

import { Question, AnswerResult } from '../types';

const KEYS = {
  questions: 'faetec_offline_questions',
  pendingAnswers: 'faetec_pending_answers',
  lastSync: 'faetec_last_sync',
  offlineXp: 'faetec_offline_xp',
};

// ── Questões em cache ─────────────────────────────────
export function saveQuestionsCache(questions: Question[]) {
  try {
    localStorage.setItem(KEYS.questions, JSON.stringify(questions));
    localStorage.setItem(KEYS.lastSync, new Date().toISOString());
  } catch {}
}

export function getQuestionsCache(): Question[] {
  try {
    const raw = localStorage.getItem(KEYS.questions);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function hasQuestionsCache(): boolean {
  return getQuestionsCache().length > 0;
}

export function getLastSync(): string | null {
  return localStorage.getItem(KEYS.lastSync);
}

// ── Respostas pendentes (salvas offline) ──────────────
export interface PendingAnswer {
  id: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  xpEarned: number;
  answeredAt: string;
}

export function savePendingAnswer(answer: PendingAnswer) {
  try {
    const current = getPendingAnswers();
    current.push(answer);
    localStorage.setItem(KEYS.pendingAnswers, JSON.stringify(current));
    // Acumula XP offline
    const offlineXp = getOfflineXp() + answer.xpEarned;
    localStorage.setItem(KEYS.offlineXp, String(offlineXp));
  } catch {}
}

export function getPendingAnswers(): PendingAnswer[] {
  try {
    const raw = localStorage.getItem(KEYS.pendingAnswers);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearPendingAnswers() {
  localStorage.removeItem(KEYS.pendingAnswers);
  localStorage.removeItem(KEYS.offlineXp);
}

export function getOfflineXp(): number {
  return parseInt(localStorage.getItem(KEYS.offlineXp) || '0', 10);
}

// ── Cálculo de XP offline ─────────────────────────────
export function calcOfflineXp(difficulty: string, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  return difficulty === 'Difícil' ? 30 : difficulty === 'Médio' ? 20 : 10;
}

// ── Verifica conectividade ────────────────────────────
export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectivityChange(cb: (online: boolean) => void) {
  window.addEventListener('online', () => cb(true));
  window.addEventListener('offline', () => cb(false));
}
