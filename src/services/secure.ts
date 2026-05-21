// ═══════════════════════════════════════════════════════
// SECURE STORAGE — protege dados sensíveis no localStorage
// ═══════════════════════════════════════════════════════

// Ofusca o token antes de salvar (não é criptografia forte,
// mas dificulta leitura direta por scripts de terceiros)
function encode(val: string): string {
  return btoa(encodeURIComponent(val));
}

function decode(val: string): string {
  try {
    return decodeURIComponent(atob(val));
  } catch {
    return '';
  }
}

export const secureStorage = {
  setToken(token: string) {
    try {
      // Salva com nome genérico para não chamar atenção
      sessionStorage.setItem('_fs', encode(token));
      // Também no localStorage para persistência
      localStorage.setItem('faetec_token', encode(token));
    } catch {}
  },

  getToken(): string | null {
    try {
      const raw = sessionStorage.getItem('_fs') || localStorage.getItem('faetec_token');
      if (!raw) return null;
      const decoded = decode(raw);
      // Valida formato básico JWT (3 partes separadas por ponto)
      if (!decoded || decoded.split('.').length !== 3) return null;
      return decoded;
    } catch { return null; }
  },

  clearToken() {
    sessionStorage.removeItem('_fs');
    localStorage.removeItem('faetec_token');
  },

  // Limpa TUDO ao fazer logout
  clearAll() {
    this.clearToken();
    // Mantém apenas o cache de questões para modo offline
    const questionsCache = localStorage.getItem('faetec_offline_questions');
    const lastSync = localStorage.getItem('faetec_last_sync');
    localStorage.clear();
    sessionStorage.clear();
    if (questionsCache) localStorage.setItem('faetec_offline_questions', questionsCache);
    if (lastSync) localStorage.setItem('faetec_last_sync', lastSync);
  },
};

// ── Detecta se o token JWT está expirado ──────────────
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch { return true; }
}

// ── Detecta abertura do DevTools ──────────────────────
// (avisa o usuário, não bloqueia — seria fácil contornar)
export function watchDevTools() {
  let devtools = false;
  const threshold = 160;
  setInterval(() => {
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      if (!devtools) {
        devtools = true;
        console.warn('%cFAETEC PRO', 'color: #6366f1; font-size: 24px; font-weight: bold;');
        console.warn('Esta é uma aplicação protegida. Não cole código de terceiros aqui.');
      }
    } else {
      devtools = false;
    }
  }, 1000);
}

// ── Previne clickjacking ──────────────────────────────
export function preventClickjacking() {
  if (window.top !== window.self) {
    // App está sendo carregado dentro de um iframe — sai
    window.top!.location = window.self.location;
  }
}

// ── Sanitiza strings para evitar XSS ─────────────────
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
