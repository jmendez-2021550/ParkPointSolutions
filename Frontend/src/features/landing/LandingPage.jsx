import { Link } from 'react-router-dom';
import { Map, Zap, CreditCard, BarChart3, SquareParking } from 'lucide-react';

const FEATURES = [
  {
    Icon: Map,
    title: 'Mapa en tiempo real',
    desc: 'Visualiza la disponibilidad de espacios al instante y reserva con un clic.',
  },
  {
    Icon: Zap,
    title: 'Reserva en segundos',
    desc: 'Selecciona horario, espacio y confirma. Tu lugar te espera cuando llegues.',
  },
  {
    Icon: CreditCard,
    title: 'Pago integrado',
    desc: 'Gestiona tu billetera digital y paga de forma segura desde la app.',
  },
  {
    Icon: BarChart3,
    title: 'Reportes y análisis',
    desc: 'Estadísticas de ocupación y facturación para administradores.',
  },
];

const STATS = [
  { value: '30+', label: 'Espacios disponibles' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '100%', label: 'Seguro y confiable' },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── HERO ── */}
      <div className="landing-hero">
        <img src="/parqueo3.jpg" className="landing-hero-bg" alt="" aria-hidden="true" />
        <div className="landing-hero-overlay" />

        {/* Navbar */}
        <nav className="landing-nav">
          <div className="landing-logo">
            <div className="landing-logo-icon"><SquareParking size={22} color="#fff" /></div>
            <span>ParkPoint <strong>Solutions</strong></span>
          </div>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost" style={{ fontSize: 14 }}>Iniciar sesión</Link>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: 14 }}>Crear cuenta</Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="landing-hero-content">
          <div className="landing-badge">Sistema de Estacionamiento Inteligente</div>
          <h1 className="landing-title">
            Tu espacio, <br />
            <span className="landing-title-accent">siempre listo</span>
          </h1>
          <p className="landing-subtitle">
            Reserva tu lugar de estacionamiento en segundos. Sin filas, sin estrés,<br />
            con tecnología de precio dinámico en tiempo real.
          </p>
          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700 }}>
              Comenzar gratis →
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          <div className="landing-stats">
            {STATS.map((s) => (
              <div key={s.label} className="landing-stat">
                <div className="landing-stat-value">{s.value}</div>
                <div className="landing-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="landing-scroll-hint">
          <div className="landing-scroll-dot" />
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="landing-features">
        <div className="landing-section-header">
          <h2>Todo lo que necesitas</h2>
          <p>Una plataforma completa para gestionar tu estacionamiento de forma inteligente</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f) => {
            const Icon = f.Icon;
            return (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon"><Icon size={30} strokeWidth={1.75} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <h2>¿Listo para empezar?</h2>
          <p>Únete a ParkPoint Solutions y nunca más pierdas tiempo buscando estacionamiento.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 16, fontWeight: 700 }}>
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-logo" style={{ justifyContent: 'center', marginBottom: 8 }}>
          <div className="landing-logo-icon" style={{ width: 28, height: 28 }}><SquareParking size={16} color="#fff" /></div>
          <span style={{ fontSize: 15 }}>ParkPoint <strong>Solutions</strong></span>
        </div>
        <p>© 2025 ParkPoint Solutions. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
