import { useState, useEffect, useCallback } from 'react';
import { Search, SquareParking, Car } from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';
import ReservationModal from './ReservationModal.jsx';

const STATUS_ES = { disponible: 'Disponible', reservado: 'Reservado', ocupado: 'Ocupado', mantenimiento: 'Mantenimiento' };
// Translate Spanish UI → English DB value for update requests
const STATUS_TO_EN = { disponible: 'available', reservado: 'reserved', ocupado: 'occupied', mantenimiento: 'maintenance' };

export default function ParkingMapPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN_ROLE' || user?.role === 'SUPER_ADMIN_ROLE';

  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secAgo, setSecAgo] = useState(0);

  const loadSpots = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/parking/');
      setSpots(Array.isArray(data) ? data : data.espacios || []);
      setLastUpdated(Date.now());
      setSecAgo(0);
    } catch {
      toast('Error al cargar espacios', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
    const iv = setInterval(loadSpots, 30000);
    return () => clearInterval(iv);
  }, [loadSpots]);

  // Tick "updated X seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return;
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - lastUpdated) / 1000);
      setSecAgo(s);
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdated]);

  const handleAdminStatusChange = async (spot, newStatusEs) => {
    setUpdatingStatus(spot.id);
    try {
      // Send English value to backend: PUT /api/v1/parking/:id/status
      await api.put(`/api/v1/parking/${spot.id}/status`, { status: STATUS_TO_EN[newStatusEs] || newStatusEs });
      setSpots((p) => p.map((s) => s.id === spot.id ? { ...s, estado: newStatusEs } : s));
      toast(`Espacio ${spot.codigo} → ${STATUS_ES[newStatusEs]}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Error al cambiar estado', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = spots.filter((s) => {
    const matchFilter = filter === 'all' || s.estado === filter;
    const matchSearch = !search || (s.codigo || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Group by nivel (the field from the serializer)
  const byFloor = filtered.reduce((acc, s) => {
    const floor = s.nivel || '1';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(s);
    return acc;
  }, {});

  const counts = {
    disponible:    spots.filter((s) => s.estado === 'disponible').length,
    reservado:     spots.filter((s) => s.estado === 'reservado').length,
    ocupado:       spots.filter((s) => s.estado === 'ocupado').length,
    mantenimiento: spots.filter((s) => s.estado === 'mantenimiento').length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-2)' }}>
      <div className="spinner" /><span>Cargando mapa...</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Mapa de Parqueo</h2>
        <p>
          {isAdmin ? 'Gestiona el estado de los espacios en tiempo real' : 'Selecciona un espacio disponible para hacer tu reserva'}
          {lastUpdated && (
            <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
              · Actualizado hace {secAgo < 60 ? `${secAgo}s` : `${Math.floor(secAgo / 60)}m`}
              {secAgo >= 25 && secAgo < 31 && <span style={{ color: 'var(--teal)', marginLeft: 4 }}>↻</span>}
            </span>
          )}
        </p>
      </div>

      <div className="parking-controls">
        <div className="search-box">
          <span style={{ display: 'inline-flex' }}><Search size={15} /></span>
          <input placeholder="Buscar espacio..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="filter-tabs">
          {[
            { key: 'all',           label: `Todos (${spots.length})` },
            { key: 'disponible',    label: `Libres (${counts.disponible})` },
            { key: 'reservado',     label: `Reservados (${counts.reservado})` },
            { key: 'ocupado',       label: `Ocupados (${counts.ocupado})` },
            { key: 'mantenimiento', label: `Mantenimiento (${counts.mantenimiento})` },
          ].map(({ key, label }) => (
            <button key={key} className={`filter-tab${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="legend">
          <div className="legend-item"><div className="legend-dot available" />Disponible</div>
          <div className="legend-item"><div className="legend-dot reserved" />Reservado</div>
          <div className="legend-item"><div className="legend-dot occupied" />Ocupado</div>
          <div className="legend-item"><div className="legend-dot maintenance" />Mantenimiento</div>
        </div>
      </div>

      {Object.keys(byFloor).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><SquareParking size={44} /></div>
          <h3>Sin espacios</h3>
          <p>No hay espacios que coincidan con el filtro</p>
        </div>
      ) : (
        Object.entries(byFloor).sort().map(([floor, floorSpots]) => (
          <div key={floor} className="level-section">
            <div className="level-header">
              <span className="level-badge">NIVEL {floor}</span>
              <div className="level-line" />
              <span className="level-count">{floorSpots.length} espacios</span>
            </div>
            <div className="spots-grid">
              {floorSpots.map((spot) => (
                <div
                  key={spot.id}
                  className={`spot-card ${STATUS_TO_EN[spot.estado] || 'available'}`}
                  onClick={() => !isAdmin && spot.estado === 'disponible' && setSelected(spot)}
                  title={isAdmin ? 'Cambiar estado' : spot.estado === 'disponible' ? 'Click para reservar' : STATUS_ES[spot.estado]}
                >
                  <div className="spot-icon-wrap"><Car size={20} /></div>
                  <div className="spot-code">{spot.codigo}</div>
                  <span className="spot-status-label">{STATUS_ES[spot.estado] || spot.estado}</span>
                  <div className="spot-level-text">Nivel {floor}</div>

                  {isAdmin && (
                    <div style={{ marginTop: 6, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        className={`status-select status-${spot.estado}`}
                        value={spot.estado}
                        disabled={updatingStatus === spot.id}
                        onChange={(e) => handleAdminStatusChange(spot, e.target.value)}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="reservado">Reservado</option>
                        <option value="ocupado">Ocupado</option>
                        <option value="mantenimiento">Mantenimiento</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {selected && (
        <ReservationModal
          spot={selected}
          onClose={() => setSelected(null)}
          onReserved={() => { setSelected(null); loadSpots(); }}
        />
      )}
    </div>
  );
}
