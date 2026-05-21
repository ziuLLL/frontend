import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './context/store';
import { secureStorage } from './services/secure';
import { ToastProvider } from './components/UI';
import { InstallBanner, OfflineBanner } from './components/InstallBanner';
import { usePWA } from './hooks/usePWA';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import QuestionsPage from './pages/QuestionsPage';
import SimuladoPage from './pages/SimuladoPage';
import { TheoryPage, VideosPage, AnalyticsPage, RankingPage, ProfilePage } from './pages/OtherPages';
import { LayoutDashboard, BookOpen, FileText, BarChart2, User } from 'lucide-react';

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  // Enquanto valida o token, não redireciona
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>FAETEC PRO</div>
        <div style={{ color: 'var(--text2)', marginTop: 8, fontSize: 14 }}>Carregando...</div>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { online, showInstallBanner, dismissBanner } = usePWA();

  const BOTTOM_NAV = [
    { path: '/', icon: LayoutDashboard, label: 'Início' },
    { path: '/questions', icon: BookOpen, label: 'Questões' },
    { path: '/simulado', icon: FileText, label: 'Simulado' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="app-shell">
      <OfflineBanner online={online} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content" style={{ marginTop: online ? 0 : 32 }}>
        {/* Header mobile */}
        <div style={{
          display: 'none', position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between'
        }} className="mob-header">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>☰</button>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15 }}>FAETEC PRO</div>
          {!online && <div style={{ fontSize: 18 }}>📵</div>}
          {online && <div style={{ width: 40 }} />}
        </div>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/simulado" element={<SimuladoPage />} />
          <Route path="/theory" element={<TheoryPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Bottom nav mobile */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
            return (
              <button key={item.path} className={`bottom-nav-item ${active ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <InstallBanner />
    </div>
  );
}

export default function App() {
  const { fetchMe, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Sempre valida o token ao carregar — nunca confia só no cache
    const token = secureStorage.getToken();
    if (token) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    const header = document.querySelector('.mob-header') as HTMLElement;
    if (!header) return;
    const update = () => { header.style.display = window.innerWidth <= 700 ? 'flex' : 'none'; };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={
          isLoading
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><span>Carregando...</span></div>
            : isAuthenticated
              ? <Navigate to="/" replace />
              : <AuthPage />
        } />
        <Route path="/*" element={<Protected><AppShell /></Protected>} />
      </Routes>
    </ToastProvider>
  );
}
