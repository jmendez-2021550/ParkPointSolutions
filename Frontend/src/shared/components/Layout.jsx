import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, SquareParking, ClipboardList, Users, BarChart3,
  Star, Wallet, User, Power, Crown, Shield, Clock, TriangleAlert, Check, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ToastProvider, useToast } from './Toast.jsx';
import api from '../api/axiosClient.js';

const NAV_BY_ROLE = {
  SUPER_ADMIN_ROLE: [
    { section: 'Principal', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/parking', icon: SquareParking, label: 'Mapa de Parqueo' },
    ]},
    { section: 'Gestión', items: [
      { to: '/reservations', icon: ClipboardList, label: 'Todas las Reservas' },
      { to: '/users', icon: Users, label: 'Gestión de Usuarios' },
    ]},
    { section: 'Administración', items: [
      { to: '/reports', icon: BarChart3, label: 'Reportes' },
      { to: '/favorites', icon: Star, label: 'Usuarios Favoritos' },
    ]},
  ],
  ADMIN_ROLE: [
    { section: 'Principal', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/parking', icon: SquareParking, label: 'Mapa de Parqueo' },
    ]},
    { section: 'Gestión', items: [
      { to: '/reservations', icon: ClipboardList, label: 'Reservas del Sistema' },
    ]},
    { section: 'Administración', items: [
      { to: '/reports', icon: BarChart3, label: 'Reportes' },
    ]},
  ],
  USER_ROLE: [
    { section: 'Principal', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/parking',   icon: SquareParking, label: 'Reservar Espacio' },
    ]},
    { section: 'Mi Cuenta', items: [
      { to: '/reservations', icon: ClipboardList, label: 'Mis Reservas' },
      { to: '/wallet',       icon: Wallet, label: 'Mi Billetera' },
      { to: '/profile',      icon: User, label: 'Mi Perfil' },
    ]},
  ],
};

const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/parking':     'Mapa de Parqueo',
  '/reservations':'Reservas',
  '/profile':     'Mi Perfil',
  '/wallet':      'Mi Billetera',
  '/reports':     'Reportes',
  '/users':       'Gestión de Usuarios',
  '/favorites':   'Usuarios Favoritos',
};

const ROLE_LABELS = {
  SUPER_ADMIN_ROLE: 'Super Admin',
  ADMIN_ROLE: 'Administrador',
  USER_ROLE: 'Cliente',
};

const ROLE_CHIP_CLASS = {
  SUPER_ADMIN_ROLE: 'superadmin',
  ADMIN_ROLE: 'admin',
  USER_ROLE: 'user',
};

const ROLE_ICON = {
  SUPER_ADMIN_ROLE: Crown,
  ADMIN_ROLE: Shield,
  USER_ROLE: User,
};

function fmtCountdown(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ArrivalCountdown() {
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const [msLeft, setMsLeft] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  const loadPending = useCallback(() => {
    try {
      const raw = localStorage.getItem('pp_pending_arrival');
      if (!raw) { setPending(null); return; }
      const p = JSON.parse(raw);
      if (!p?.deadline) { setPending(null); return; }
      const left = new Date(p.deadline) - Date.now();
      if (left <= 0) return; // will be caught by ticker
      setPending(p);
      setMsLeft(left);
    } catch {
      setPending(null);
    }
  }, []);

  useEffect(() => {
    loadPending();
    const storageListener = () => loadPending();
    window.addEventListener('storage', storageListener);
    window.addEventListener('pp_arrival_set', loadPending);
    return () => {
      window.removeEventListener('storage', storageListener);
      window.removeEventListener('pp_arrival_set', loadPending);
    };
  }, [loadPending]);

  useEffect(() => {
    if (!pending || cancelled) return;
    const interval = setInterval(() => {
      const left = new Date(pending.deadline) - Date.now();
      if (left <= 0) {
        clearInterval(interval);
        setMsLeft(0);
        if (pending.reservationId) {
          api.delete(`/api/v1/parking/reservations/${pending.reservationId}/cancel`)
            .then(() => toast(`Tiempo expirado. Reserva del espacio ${pending.spotCodigo} cancelada.`, 'error'))
            .catch(() => toast(`Tiempo expirado. No se pudo cancelar automáticamente.`, 'warning'));
        }
        localStorage.removeItem('pp_pending_arrival');
        setPending(null);
        setCancelled(false);
      } else {
        setMsLeft(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pending, cancelled, toast]);

  const handleArrived = () => {
    localStorage.removeItem('pp_pending_arrival');
    setPending(null);
    toast(`¡Llegada confirmada! Disfruta tu espacio ${pending?.spotCodigo}.`, 'success');
  };

  const handleDismissCancel = async () => {
    if (!pending) return;
    try {
      if (pending.reservationId) {
        await api.delete(`/api/v1/parking/reservations/${pending.reservationId}/cancel`);
      }
      toast(`Reserva del espacio ${pending.spotCodigo} cancelada.`, 'info');
    } catch {
      toast('No se pudo cancelar la reserva.', 'error');
    }
    localStorage.removeItem('pp_pending_arrival');
    setPending(null);
  };

  if (!pending) return null;

  const urgent = msLeft > 0 && msLeft < 3 * 60 * 1000; // last 3 min

  return (
    <div className={`arrival-banner${urgent ? ' urgent' : ''}`}>
      <div className="arrival-banner-header">
        <div className="arrival-banner-icon">
          {urgent ? <TriangleAlert size={20} color="#fb5a72" /> : <Clock size={20} color="#5b9dff" />}
        </div>
        <div className="arrival-banner-title">
          {urgent ? '¡Apresúrate!' : 'Tiempo para llegar'}
        </div>
        <div className="arrival-banner-spot">{pending.spotCodigo}</div>
      </div>

      <div className={`arrival-countdown${urgent ? ' urgent' : ''}`}>
        {fmtCountdown(msLeft)}
      </div>
      <div className="arrival-countdown-label">tiempo restante</div>

      <div className="arrival-banner-actions">
        <button className="btn btn-ghost" style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={handleDismissCancel}>
          <X size={14} /> Cancelar
        </button>
        <button className="btn btn-primary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }} onClick={handleArrived}>
          <Check size={14} /> Ya llegué
        </button>
      </div>
    </div>
  );
}

function LayoutInner() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role || 'USER_ROLE';
  const navGroups = NAV_BY_ROLE[role] || NAV_BY_ROLE.USER_ROLE;
  const initials = (user?.username || 'U')[0].toUpperCase();
  const RoleIcon = ROLE_ICON[role] || User;

  // Live wallet balance for USER_ROLE — updates on recharge/reservation via custom event
  const [walletBal, setWalletBal] = useState('0.00');
  useEffect(() => {
    if (role !== 'USER_ROLE' || !user?.id) return;
    const update = () => setWalletBal(parseFloat(localStorage.getItem(`pp_wallet_${user.id}`) || '0').toFixed(2));
    update();
    window.addEventListener('pp_wallet_update', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('pp_wallet_update', update);
      window.removeEventListener('storage', update);
    };
  }, [role, user?.id]);

  const handleLogout = () => {
    if (!confirm('¿Deseas cerrar sesión?')) return;
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <img src="/parqueo2.jpg" className="sidebar-bg-img" alt="" aria-hidden="true" />
        <div className="sidebar-logo">
          <div className="sidebar-logo-wrap">
            <div className="sidebar-logo-icon">🅿️</div>
            <div>
              <h2>ParkPoint</h2>
              <p>Solutions</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.section}>
              <div className="nav-section-label">{group.section}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon"><Icon size={18} strokeWidth={2} /></span>
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <strong>{user?.username || 'Usuario'}</strong>
              <span>{ROLE_LABELS[role]}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <Power size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{PAGE_TITLES[location.pathname] || 'ParkPoint'}</h1>
          </div>
          <div className="topbar-right">
            {role === 'USER_ROLE' && (
              <span
                title="Saldo en billetera"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: 'var(--teal)',
                  padding: '5px 12px',
                  background: 'rgba(6,214,160,.08)', border: '1px solid rgba(6,214,160,.2)',
                  borderRadius: 20, cursor: 'default',
                }}
              >
                <Wallet size={14} /> Q. {walletBal}
              </span>
            )}
            <span className={`role-chip ${ROLE_CHIP_CLASS[role]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RoleIcon size={14} /> {ROLE_LABELS[role]}
            </span>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>

      {role === 'USER_ROLE' && <ArrivalCountdown />}
    </div>
  );
}

export default function Layout() {
  return (
    <ToastProvider>
      <LayoutInner />
    </ToastProvider>
  );
}
