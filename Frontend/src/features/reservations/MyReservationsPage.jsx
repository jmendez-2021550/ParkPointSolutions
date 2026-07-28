import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';

// Serializer returns Spanish: 'reservado', 'cancelado', 'completado', 'activo'
const BADGE = {
  reservado:  'badge-blue',
  completado: 'badge-success',
  cancelado:  'badge-danger',
  activo:     'badge-blue',
  pendiente:  'badge-warning',
};
const LABEL = {
  reservado:  'Reservado',
  completado: 'Completado',
  cancelado:  'Cancelado',
  activo:     'Activo',
  pendiente:  'Pendiente',
};

const fmt = (dt) => dt ? new Date(dt).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const quetzales = (cents) => cents ? `Q. ${(cents / 100).toFixed(2)}` : '—';

export default function MyReservationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN_ROLE' || user?.role === 'SUPER_ADMIN_ROLE';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    // Admin: GET /api/v1/parking/reservations (all)
    // User:  GET /api/v1/parking/user/:userId
    const endpoint = isAdmin
      ? '/api/v1/parking/reservations'
      : `/api/v1/parking/user/${user.id}`;

    api.get(endpoint)
      .then(({ data }) => setReservations(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar reservas', 'error'))
      .finally(() => setLoading(false));
  }, [isAdmin, user?.id]);

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setActioning(id);
    try {
      // Backend: DELETE /api/v1/parking/reservations/:id/cancel
      await api.delete(`/api/v1/parking/reservations/${id}/cancel`);
      setReservations((p) => p.map((r) => r.id === id ? { ...r, estado: 'cancelado' } : r));
      toast('Reserva cancelada', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Error al cancelar', 'error');
    } finally {
      setActioning(null);
    }
  };

  const handleCheckout = async (id) => {
    setActioning(id);
    try {
      // Backend: POST /api/v1/parking/reservations/:id/checkout
      await api.post(`/api/v1/parking/reservations/${id}/checkout`);
      setReservations((p) => p.map((r) => r.id === id ? { ...r, estado: 'completado' } : r));
      toast('Reserva completada — factura enviada por email', 'success');
    } catch (err) {
      toast(err.response?.data?.mensaje || err.response?.data?.message || 'Error al completar', 'error');
    } finally {
      setActioning(null);
    }
  };

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.estado === filter);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-2)' }}>
      <div className="spinner" /><span>Cargando reservas...</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>{isAdmin ? 'Reservas del Sistema' : 'Mis Reservas'}</h2>
        <p>{reservations.length} reserva{reservations.length !== 1 ? 's' : ''} {isAdmin ? 'en el sistema' : 'en tu historial'}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="filter-tabs">
            {['all', 'reservado', 'completado', 'cancelado'].map((s) => (
              <button key={s} className={`filter-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
                {s === 'all' ? `Todas (${reservations.length})` : `${LABEL[s]} (${reservations.filter((r) => r.estado === s).length})`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div className="empty-state-icon"><ClipboardList size={44} /></div>
            <h3>Sin reservas</h3>
            <p>No hay reservas que coincidan con el filtro</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Usuario</th>}
                  <th>Espacio</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    {isAdmin && (
                      <td style={{ fontWeight: 600, fontSize: 12 }}>
                        {r.usuario?.nombreUsuario || r.usuario?.email || r.usuarioId || '—'}
                      </td>
                    )}
                    <td>
                      <span style={{
                        fontWeight: 700, padding: '3px 10px', fontSize: 13,
                        background: 'var(--glass-2)', borderRadius: 6, color: 'var(--teal)',
                      }}>
                        {r.espacio?.codigo || r.espacioId}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmt(r.inicioReserva)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmt(r.finReserva)}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 13 }}>
                        {quetzales(r.precioCentavos)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${BADGE[r.estado] || 'badge-muted'}`}>
                        {LABEL[r.estado] || r.estado}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const isActionable = r.estado === 'reservado' || r.estado === 'activo';
                        const isPast = r.finReserva && new Date(r.finReserva) < new Date();

                        if (!isActionable) {
                          return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
                        }
                        // Reservation window already ended — cancelling no longer makes sense
                        if (isPast) {
                          return (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {isAdmin && (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleCheckout(r.id)}
                                  disabled={actioning === r.id}
                                >
                                  Completar
                                </button>
                              )}
                              <span className="badge badge-warning" style={{ fontSize: 11 }}>Expirada</span>
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {isAdmin && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleCheckout(r.id)}
                                disabled={actioning === r.id}
                              >
                                Completar
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleCancel(r.id)}
                              disabled={actioning === r.id}
                            >
                              Cancelar
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
