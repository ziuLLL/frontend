import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { XpBar } from './UI';
import {
  LayoutDashboard, BookOpen, FileText, Play, User,
  Trophy, BarChart2, LogOut
} from 'lucide-react';

function getLevel(xp: number) {
  const lvl = Math.floor(Math.sqrt(xp / 100)) + 1;
  const curr = Math.pow(lvl - 1, 2) * 100;
  const next = Math.pow(lvl, 2) * 100;
  return { level: lvl, pct: Math.round(((xp - curr) / (next - curr)) * 100) };
}

const NAV = [
  { section: 'Estudo' },
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/questions', icon: BookOpen, label: 'Questões' },
  { path: '/simulado', icon: FileText, label: 'Simulado' },
  { path: '/theory', icon: BookOpen, label: 'Teoria' },
  { path: '/videos', icon: Play, label: 'Videoaulas' },
  { section: 'Desempenho' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/ranking', icon: Trophy, label: 'Ranking' },
  { section: 'Conta' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { level, pct } = getLevel(user?.xp ?? 0);

  const go = (path: string) => { navigate(path); onClose(); };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <nav className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,var(--accent),var(--purple))', padding: '7px 14px', borderRadius: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>FAETEC PRO</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: .5, textTransform: 'uppercase' as const, fontWeight: 500 }}>Preparatório COSEAC</div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' as const }}>
          {NAV.map((item, i) => {
            if ('section' in item) {
              return <div key={i} style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, padding: '12px 8px 4px' }}>{item.section}</div>;
            }
            const navItem = item as { path: string; icon: any; label: string };
            const Icon = navItem.icon;
            const isActive = pathname === navItem.path || (navItem.path !== '/' && pathname.startsWith(navItem.path));
            return (
              <button
                key={navItem.path}
                onClick={() => go(navItem.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: 2,
                  fontWeight: 500, fontSize: 13.5, border: 'none', cursor: 'pointer',
                  color: isActive ? 'var(--accent2)' : 'var(--muted)',
                  background: isActive ? 'rgba(99,102,241,.12)' : 'transparent',
                  position: 'relative' as const,
                  transition: 'all var(--transition)',
                }}
              >
                {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'var(--accent)', borderRadius: '0 4px 4px 0' }} />}
                <Icon size={17} />
                <span>{navItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* User card */}
        {user && (
          <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r-md)', marginBottom: 8 }}>
              <div className="level-ring" style={{ width: 36, height: 36, fontSize: 14 }}>{level}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{user.xp} XP · Nível {level}</div>
                <XpBar pct={pct} />
              </div>
            </div>
            <button
              onClick={logout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color var(--transition)' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}>
              <LogOut size={15} /><span>Sair</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
