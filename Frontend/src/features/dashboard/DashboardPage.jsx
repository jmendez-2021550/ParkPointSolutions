import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  SquareParking, Check, Car, ClipboardList, TrendingUp, Users, BarChart3,
  Star, User, Award, Clock, Wrench, ChevronRight, ArrowRight,
} from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';
import ReservationModal from '../parking/ReservationModal.jsx';

/* ── Stat card ──────────────────────────────────── */
function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className={`stat-icon-wrap ${color}`}>{icon}</div>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
      <div className="stat-value">{value ?? <span className="spinner" style={{ width: 20, height: 20, margin: '4px 0' }} />}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function QuickLink({ to, icon, label, accent }) {
  return (
    <Link to={to} className="quick-action-card">
      <div className="quick-action-icon" style={{ background: `${accent}18`, color: accent }}>{icon}</div>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'inline-flex' }}><ChevronRight size={18} /></span>
    </Link>
  );
}

/* ── Embedded mini parking map for USER ─────────── */
const STATUS_COLORS = {
  disponible:   { bg: 'rgba(31,212,94,.10)',   border: 'rgba(31,212,94,.35)',   text: '#1fd45e', label: 'Disponible' },
  reservado:    { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.35)',  text: '#3b82f6', label: 'Reservado' },
  ocupado:      { bg: 'rgba(239,68,68,.10)',   border: 'rgba(239,68,68,.35)',   text: '#ef4444', label: 'Ocupado' },
  mantenimiento:{ bg: 'rgba(234,179,8,.10)',   border: 'rgba(234,179,8,.35)',   text: '#eab308', label: 'Mantenim.' },
};

const STATUS_ICONS = {
  disponible:   Check,
  reservado:    Clock,
  ocupado:      Car,
  mantenimiento:Wrench,
};

function EmbeddedParkingMap({ onSpotSelect, selected }) {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Correct endpoint: GET /api/v1/parking/ (serializer returns { id, codigo, nivel, estado })
      const { data } = await api.get('/api/v1/parking/');
      setSpots(Array.isArray(data) ? data : data.espacios || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const bySection = spots.reduce((acc, s) => {
    // Serializer returns 'nivel' field (not 'piso' or 'seccion')
    const key = s.nivel || s.seccion || s.piso || '1';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sectionNames = {
    A: 'Sección A — Entrada Principal',
    B: 'Sección B — Área Trasera',
    1: 'Piso 1',
    2: 'Piso 2',
    3: 'Piso 3',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10, color: 'var(--text-2)' }}>
        <div className="spinner" />
        <span>Cargando espacios...</span>
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 0' }}>
        <div className="empty-state-icon"><SquareParking size={40} /></div>
        <h3>Sin espacios</h3>
        <p>No hay espacios de parqueo registrados aún</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {Object.entries(bySection).sort().map(([sec, secSpots]) => (
        <div key={sec}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{
              background: 'var(--gold-dim)', color: 'var(--gold)',
              fontSize: 10.5, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, border: '1px solid rgba(240,180,41,.25)',
              letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
              {sectionNames[sec] || `Sección ${sec}`}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {secSpots.filter(s => s.estado === 'disponible').length} libres de {secSpots.length}
            </span>
          </div>

          {/* Spot grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 8,
          }}>
            {secSpots.map((spot) => {
              const st = STATUS_COLORS[spot.estado] || STATUS_COLORS.disponible;
              const isAvail = spot.estado === 'disponible';
              const isSel = selected?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  onClick={() => isAvail && onSpotSelect(spot)}
                  style={{
                    background: isSel ? 'rgba(47,125,255,.15)' : st.bg,
                    border: `2px solid ${isSel ? 'var(--gold)' : st.border}`,
                    borderRadius: 10,
                    padding: '14px 8px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    cursor: isAvail ? 'pointer' : 'default',
                    transition: 'all .18s',
                    transform: isSel ? 'translateY(-2px)' : undefined,
                    boxShadow: isSel ? 'var(--gold-glow)' : undefined,
                    position: 'relative',
                  }}
                >
                  {/* Spot number badge */}
                  <div style={{
                    position: 'absolute', top: 5, right: 7,
                    fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
                  }}>
                    {spot.numero || spot.id?.toString().slice(-2)}
                  </div>

                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `${st.text}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: st.text,
                  }}>
                    {(() => { const I = STATUS_ICONS[spot.estado] || Check; return <I size={18} />; })()}
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#fff' }}>{spot.codigo}</div>

                  <div style={{
                    fontSize: 9.5, fontWeight: 700, color: st.text,
                    background: `${st.text}14`, padding: '2px 8px', borderRadius: 20,
                    textTransform: 'uppercase', letterSpacing: '.04em',
                  }}>
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lane separator between sections */}
          <div style={{
            textAlign: 'center', padding: '10px 0', marginTop: 8,
            color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '.12em',
            borderTop: '1px dashed var(--border)', textTransform: 'uppercase',
          }}>
            — Carril de Circulación —
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── SUPER ADMIN ────────────────────────────────── */
function SuperAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/parking/analytics/occupancy').catch(() => null),
      api.get('/api/v1/reports/admin/summary?period=year').catch(() => null),
    ]).then(([occ, reps]) =>
      setData({
        occ: occ?.data,
        reservas: reps?.data?.totalReservaciones ?? 0,
      })
    );
  }, []);

  const occ = data?.occ;
  const pct = occ?.porcentajeOcupacion ? parseInt(occ.porcentajeOcupacion) : 0;

  return (
    <>
      <div className="dashboard-hero" style={{ height: 160 }}>
        <picture>
          <source srcSet="/parqueo1.avif" type="image/avif" />
          <img src="/parqueo1.jpg" className="dashboard-hero-bg" alt="" aria-hidden="true" />
        </picture>
        <div className="dashboard-hero-content">
          <div className="hero-title" style={{ fontSize: 22 }}>Panel de Super Admin</div>
          <div className="hero-subtitle">Vista completa y control total del sistema ParkPoint Solutions</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<SquareParking size={20} />} label="Espacios totales"    value={occ?.total}       color="blue" />
        <StatCard icon={<Check size={20} />}         label="Disponibles ahora"   value={occ?.disponibles} color="green" />
        <StatCard icon={<Car size={20} />}           label="Ocupados ahora"       value={occ?.ocupados}    color="red" />
        <StatCard icon={<ClipboardList size={20} />} label="Reservas totales"     value={data?.reservas}   color="gold" />
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-header">
            <h3>Ocupación en Tiempo Real</h3>
            {occ && <span className="badge badge-gold">{occ.porcentajeOcupacion}</span>}
          </div>
          <div className="card-body">
            {occ ? (
              <>
                <div className="occ-bar-track" style={{ marginBottom: 18 }}>
                  <div className="occ-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold), var(--gold-b))' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {Object.entries(occ.porPiso || {}).map(([floor, count]) => (
                    <div key={floor} className="floor-tile">
                      <div className="floor-tile-num">{count}</div>
                      <div className="floor-tile-lbl">Piso {floor}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Acciones Rápidas</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <QuickLink to="/users"     icon={<Users size={18} />}        label="Gestionar Usuarios"          accent="var(--blue)" />
            <QuickLink to="/parking"   icon={<SquareParking size={18} />} label="Mapa en Tiempo Real"         accent="var(--teal)" />
            <QuickLink to="/reports"   icon={<BarChart3 size={18} />}    label="Ver Reportes del Sistema"    accent="var(--gold)" />
            <QuickLink to="/favorites" icon={<Star size={18} />}         label="Procesar Usuarios Favoritos" accent="var(--warning)" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── ADMIN ──────────────────────────────────────── */
function AdminDashboard() {
  const [occ, setOcc] = useState(null);

  useEffect(() => {
    api.get('/api/v1/parking/analytics/occupancy')
      .then(({ data }) => setOcc(data))
      .catch(() => {});
  }, []);

  const pct = occ?.porcentajeOcupacion ? parseInt(occ.porcentajeOcupacion) : 0;

  return (
    <>
      <div className="dashboard-hero" style={{ height: 160 }}>
        <picture>
          <source srcSet="/parqueo1.avif" type="image/avif" />
          <img src="/parqueo1.jpg" className="dashboard-hero-bg" alt="" aria-hidden="true" />
        </picture>
        <div className="dashboard-hero-content">
          <div className="hero-title" style={{ fontSize: 22 }}>Panel de Administrador</div>
          <div className="hero-subtitle">Gestiona el parqueo y monitorea las reservas del sistema</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<SquareParking size={20} />} label="Espacios totales" value={occ?.total}                color="blue" />
        <StatCard icon={<Check size={20} />}         label="Disponibles"       value={occ?.disponibles}         color="green" />
        <StatCard icon={<Car size={20} />}           label="Ocupados"           value={occ?.ocupados}            color="red" />
        <StatCard icon={<TrendingUp size={20} />}    label="Tasa de ocupación" value={occ?.porcentajeOcupacion} color="gold" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Ocupación Actual</h3>
            {occ && <span className="badge badge-blue">{occ.porcentajeOcupacion}</span>}
          </div>
          <div className="card-body">
            {occ ? (
              <>
                <div className="occ-bar-track">
                  <div className="occ-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--blue), #7fb3ff)' }} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  {Object.entries(occ.porPiso || {}).map(([floor, count]) => (
                    <div key={floor} className="floor-tile">
                      <div className="floor-tile-num">{count}</div>
                      <div className="floor-tile-lbl">Piso {floor}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Acciones Rápidas</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <QuickLink to="/parking"      icon={<SquareParking size={18} />} label="Mapa de Parqueo"      accent="var(--teal)" />
            <QuickLink to="/reservations" icon={<ClipboardList size={18} />} label="Reservas del Sistema" accent="var(--blue)" />
            <QuickLink to="/reports"      icon={<BarChart3 size={18} />}    label="Generar Reportes"     accent="var(--gold)" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── USUARIO — with embedded parking map ─────────── */
function UserDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [occ, setOcc] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalSpot, setModalSpot] = useState(null);
  const [reservLoading, setReservLoading] = useState(true);

  const loadReservations = useCallback(async () => {
    if (!user?.id) { setReservLoading(false); return; }
    try {
      // Correct endpoint: GET /api/v1/parking/user/:userId
      const { data } = await api.get(`/api/v1/parking/user/${user.id}`);
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setReservLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    api.get('/api/v1/parking/analytics/occupancy')
      .then(({ data }) => setOcc(data))
      .catch(() => {});
    loadReservations();
  }, [loadReservations]);

  // Serializer returns 'estado' (Spanish): 'reservado', 'completado', 'cancelado'
  const active    = reservations.filter(r => r.estado === 'reservado' || r.estado === 'activo');
  const completed = reservations.filter(r => r.estado === 'completado').length;
  const pct       = occ?.porcentajeOcupacion ? parseInt(occ.porcentajeOcupacion) : 0;

  return (
    <>
      {/* Hero banner */}
      <div className="dashboard-hero">
        <img src="/parqueo2.jpg" className="dashboard-hero-bg" alt="" aria-hidden="true" />
        <div className="dashboard-hero-content">
          <div className="hero-title">Bienvenido, {user?.username}</div>
          <div className="hero-subtitle">Encuentra y reserva tu espacio en segundos</div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{occ?.disponibles ?? '—'}</div>
              <div className="hero-stat-label">Espacios libres</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{occ?.porcentajeOcupacion ?? '—'}</div>
              <div className="hero-stat-label">Ocupacion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <StatCard
          icon={<SquareParking size={20} />}
          label="Espacios Libres"
          value={occ?.disponibles ?? null}
          sub={occ ? `de ${occ.total} espacios totales` : null}
          color="green"
          trend={occ && occ.disponibles > 0 ? 'Disponible' : undefined}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Tasa de Ocupación"
          value={occ?.porcentajeOcupacion ?? null}
          sub="en este momento"
          color="blue"
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Mis Reservas Activas"
          value={reservLoading ? null : active.length}
          sub={`${completed} completadas`}
          color="blue"
        />
        <StatCard
          icon={<Award size={20} />}
          label="Estado de Cliente"
          value={reservLoading ? null : (user?.isFavorite ? 'Favorito' : 'Regular')}
          sub={`${reservations.length} reservas en historial`}
          color={user?.isFavorite ? 'green' : 'blue'}
        />
      </div>

      {/* Active reservation banner */}
      {active.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(6,214,160,.08), rgba(6,214,160,.03))',
          border: '1px solid rgba(6,214,160,.25)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ color: 'var(--teal)', display: 'flex' }}><SquareParking size={28} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>
              Reserva Activa — Espacio {active[0].espacio?.codigo || active[0].espacioId}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 12.5, marginTop: 2 }}>
              Desde: {active[0].inicioReserva ? new Date(active[0].inicioReserva).toLocaleString('es-GT') : '—'}
              {active[0].precioCentavos ? ` · Estimado: Q. ${(active[0].precioCentavos / 100).toFixed(2)}` : ''}
            </div>
          </div>
          <span className="badge badge-success">Activa</span>
        </div>
      )}

      {/* Main content: parking map + side panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
        {/* Parking map card */}
        <div className="card">
          <div className="card-header">
            <h3>Mapa del Parqueo</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {occ && (
                <>
                  <span className="badge badge-success">{occ.disponibles} Libres</span>
                  <span className="badge badge-danger">{occ.ocupados} Ocupados</span>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            <EmbeddedParkingMap
              selected={selected}
              onSpotSelect={(spot) => {
                setSelected(spot);
              }}
            />
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selected spot info / booking */}
          <div className="card">
            <div className="card-header"><h3>Reservar Espacio</h3></div>
            <div className="card-body">
              {selected ? (
                <div>
                  <div style={{
                    background: 'var(--gold-dim)', border: '1px solid rgba(47,125,255,.25)',
                    borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ color: 'var(--gold)', display: 'flex' }}><Check size={28} /></div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>
                        Espacio {selected.codigo}
                      </div>
                      <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                        Disponible
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
                    Has seleccionado el espacio <strong style={{ color: '#fff' }}>{selected.codigo}</strong>.
                    El precio es dinámico según la ocupación actual del parqueo.
                  </div>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => setModalSpot(selected)}
                    style={{ padding: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    Reservar Este Espacio <ArrowRight size={16} />
                  </button>
                  <button
                    className="btn btn-ghost btn-full"
                    onClick={() => setSelected(null)}
                    style={{ marginTop: 8 }}
                  >
                    Cancelar selección
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><SquareParking size={40} /></div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Selecciona un espacio<br />
                    <span style={{ color: 'var(--teal)', fontWeight: 600 }}>disponible</span> en el mapa para reservar
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Occupancy mini chart */}
          {occ && (
            <div className="card">
              <div className="card-header"><h3>Ocupación Actual</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-2)' }}>Nivel de ocupación</span>
                  <strong style={{ color: pct >= 70 ? 'var(--rose)' : pct >= 40 ? 'var(--warning)' : 'var(--teal)' }}>
                    {occ.porcentajeOcupacion}
                  </strong>
                </div>
                <div className="occ-bar-track" style={{ marginBottom: 14 }}>
                  <div className="occ-bar-fill" style={{
                    width: `${pct}%`,
                    background: pct >= 70
                      ? 'linear-gradient(90deg, var(--rose), #ff9999)'
                      : pct >= 40
                        ? 'linear-gradient(90deg, var(--warning), #ffd48a)'
                        : 'linear-gradient(90deg, var(--teal), #4af5c3)',
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Disponibles', val: occ.disponibles, color: 'var(--teal)' },
                    { label: 'Ocupados',    val: occ.ocupados,    color: 'var(--rose)' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                      <span style={{ color: 'var(--text-2)' }}>{label}</span>
                      <strong style={{ color }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card">
            <div className="card-header"><h3>Acceso Rápido</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickLink to="/reservations" icon={<ClipboardList size={18} />} label="Mis Reservas" accent="var(--blue)" />
              <QuickLink to="/profile"      icon={<User size={18} />}         label="Mi Perfil"    accent="var(--teal)" />
            </div>
          </div>
        </div>
      </div>

      {/* Reservation modal */}
      {modalSpot && (
        <ReservationModal
          spot={modalSpot}
          warnActive={active.length > 0}
          onClose={() => setModalSpot(null)}
          onReserved={() => {
            setModalSpot(null);
            setSelected(null);
            loadReservations();
            toast('Reserva creada correctamente', 'success');
          }}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === 'SUPER_ADMIN_ROLE') return <SuperAdminDashboard />;
  if (user?.role === 'ADMIN_ROLE')       return <AdminDashboard />;
  return <UserDashboard />;
}
