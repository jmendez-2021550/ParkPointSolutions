import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useToast } from '../../shared/components/Toast.jsx';

const ROLES = ['USER_ROLE', 'ADMIN_ROLE', 'SUPER_ADMIN_ROLE'];
const ROLE_LABEL = { USER_ROLE: 'Cliente', ADMIN_ROLE: 'Administrador', SUPER_ADMIN_ROLE: 'Super Admin' };

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/v1/users');
        setUsers(Array.isArray(data) ? data : data.users || []);
      } catch {
        toast('Error al cargar usuarios', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRoleChange = async (userId, role, currentRole) => {
    if (role === currentRole) return;
    const target = users.find((u) => u.id === userId);
    // Sensitive action — confirm role changes, especially privilege escalations
    const escalating = role === 'SUPER_ADMIN_ROLE' || role === 'ADMIN_ROLE';
    const msg = escalating
      ? `¿Otorgar el rol de ${ROLE_LABEL[role]} a "${target?.username}"? Tendrá permisos administrativos.`
      : `¿Cambiar el rol de "${target?.username}" a ${ROLE_LABEL[role]}?`;
    if (!confirm(msg)) return;

    setChangingRole(userId);
    try {
      await api.put(`/api/v1/users/${userId}/role`, { role });
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, role } : u));
      toast(`Rol de ${target?.username} actualizado a ${ROLE_LABEL[role]}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Error al cambiar rol', 'error');
    } finally {
      setChangingRole(null);
    }
  };

  const filtered = users.filter((u) =>
    !search || (u.username || u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role) => {
    const map = { SUPER_ADMIN_ROLE: 'badge-gold', ADMIN_ROLE: 'badge-blue', USER_ROLE: 'badge-gray' };
    return <span className={`badge ${map[role] || 'badge-gray'}`}>{ROLE_LABEL[role] || role}</span>;
  };

  if (loading) return <div className="loading-box"><div className="spinner" /><span>Cargando usuarios...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <p>Administra los roles y permisos de todos los usuarios del sistema</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Usuarios ({filtered.length})</h3>
          <div className="search-box">
            <span style={{ display: 'inline-flex' }}><Search size={15} /></span>
            <input
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={44} /></div>
            <h3>Sin usuarios</h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Rol Actual</th>
                  <th>Cambiar Rol</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                          {(u.username || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      {u.status
                        ? <span className="badge badge-success">Activo</span>
                        : <span className="badge badge-gray">Inactivo</span>}
                    </td>
                    <td>{roleBadge(u.role)}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role || 'USER_ROLE'}
                        disabled={changingRole === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.role)}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '—'}
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
