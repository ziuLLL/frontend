import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';

// ── Banner flutuante de instalação ────────────────────
export function InstallBanner() {
  const { install, showInstallBanner, dismissBanner, canInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  if (!showInstallBanner) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 12, right: 12,
      background: 'linear-gradient(135deg, #1e1e2e, #252535)',
      border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 9000, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      animation: 'toastIn .3s ease',
    }}>
      <div style={{ fontSize: 32, flexShrink: 0 }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f8', marginBottom: 2 }}>
          Instalar FAETEC PRO
        </div>
        <div style={{ fontSize: 12, color: '#8888aa' }}>
          Acesse sem internet, como um app nativo
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={dismissBanner}
          style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid #2a2a3d', color: '#8888aa', fontSize: 12, cursor: 'pointer' }}>
          Agora não
        </button>
        <button onClick={handleInstall} disabled={installing}
          style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          {installing ? '...' : 'Instalar'}
        </button>
      </div>
    </div>
  );
}

// ── Indicador de status offline ───────────────────────
export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
      color: '#000', fontSize: 12, fontWeight: 700,
      textAlign: 'center', padding: '6px 12px',
      zIndex: 9999, letterSpacing: 0.3,
    }}>
      📵 Você está offline — questões em cache disponíveis · Respostas serão sincronizadas ao conectar
    </div>
  );
}

// ── Botão de instalar para a tela inicial ─────────────
export function InstallButton() {
  const { install, isInstalled, canInstall } = usePWA();
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);

  // iOS — não suporta beforeinstallprompt, mostra instrução manual
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || done) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
        ✅ App instalado no seu dispositivo!
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <button onClick={() => setShowIOSGuide(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          📱 Instalar no iPhone / iPad
        </button>
        {showIOSGuide && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', padding: 16 }}
            onClick={() => setShowIOSGuide(false)}>
            <div style={{ background: '#1e1e2e', border: '1px solid #2a2a3d', borderRadius: 20, padding: 24, width: '100%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0f8', marginBottom: 16, textAlign: 'center' }}>
                📱 Como instalar no iPhone
              </div>
              {[
                { step: '1', text: 'Toque no botão compartilhar', icon: '⬆️', sub: 'Ícone de seta na barra inferior do Safari' },
                { step: '2', text: 'Toque em "Adicionar à Tela de Início"', icon: '➕', sub: 'Role para baixo no menu de compartilhamento' },
                { step: '3', text: 'Toque em "Adicionar"', icon: '✅', sub: 'O app aparece na sua tela inicial como um app nativo' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>{s.text}</div>
                    <div style={{ fontSize: 12, color: '#8888aa', marginTop: 2 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowIOSGuide(false)}
                style={{ width: '100%', padding: '12px 0', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Entendi!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!canInstall) {
    return (
      <div style={{ fontSize: 12, color: '#8888aa', textAlign: 'center', padding: '8px 0' }}>
        💡 Para instalar: no navegador, toque no menu ⋮ e selecione "Adicionar à tela inicial"
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        setInstalling(true);
        const ok = await install();
        if (ok) setDone(true);
        setInstalling(false);
      }}
      disabled={installing}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%', boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'all .2s' }}>
      {installing ? '⏳ Instalando...' : '📲 Instalar app no celular — funciona offline!'}
    </button>
  );
}
