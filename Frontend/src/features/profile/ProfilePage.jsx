import { useState } from 'react';
import { User, Star, Pencil, Lock } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';
import api from '../../shared/api/axiosClient.js';
import { isName, isPhone, isStrongEnough } from '../../shared/utils/validators.js';

const ROLE_LABELS = { SUPER_ADMIN_ROLE: 'Super Administrador', ADMIN_ROLE: 'Administrador', USER_ROLE: 'Cliente' };

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', surname: user?.surname || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const initials = (user?.username || 'U')[0].toUpperCase();

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    // Client-side validation
    if (form.name && !isName(form.name)) return toast('El nombre solo puede contener letras', 'error');
    if (form.surname && !isName(form.surname)) return toast('El apellido solo puede contener letras', 'error');
    if (form.phone && !isPhone(form.phone)) return toast('El teléfono debe tener exactamente 8 dígitos', 'error');
    setLoading(true);
    try {
      await api.put('/api/v1/auth/profile', form);
      toast('Perfil actualizado correctamente', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Error al actualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (!isStrongEnough(passForm.newPassword)) return toast('La nueva contraseña debe tener mínimo 8 caracteres, con letras y números', 'error');
    if (passForm.newPassword !== passForm.confirm) return toast('Las contraseñas no coinciden', 'error');
    if (passForm.newPassword === passForm.currentPassword) return toast('La nueva contraseña debe ser diferente a la actual', 'error');
    setPassLoading(true);
    try {
      await api.put('/api/v1/auth/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast('Contraseña actualizada', 'success');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Error al cambiar contraseña', 'error');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div>
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h2>{user?.username}</h2>
          <p>{user?.email}</p>
        </div>
        <div className="profile-role-badge">{ROLE_LABELS[user?.role] || 'Usuario'}</div>
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={18} /> Información de Cuenta</h3></div>
          <div className="card-body">
            <div className="info-row"><span className="info-label">Usuario</span><span className="info-value">@{user?.username}</span></div>
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{user?.email}</span></div>
            <div className="info-row"><span className="info-label">Rol</span><span className="info-value">{ROLE_LABELS[user?.role]}</span></div>
            {user?.isFavorite && (
              <div className="info-row">
                <span className="info-label">Estado</span>
                <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Star size={12} fill="currentColor" /> Favorito — 10% dto.</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Pencil size={17} /> Editar Perfil</h3></div>
          <div className="card-body">
            <form onSubmit={handleUpdateInfo}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" name="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Juan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido</label>
                  <input className="form-input" name="surname" value={form.surname} onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))} placeholder="Pérez" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input className="form-input" name="phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 8) }))} placeholder="55551234" maxLength={8} />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={17} /> Cambiar Contraseña</h3></div>
          <div className="card-body">
            <form onSubmit={handleChangePass} style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Contraseña actual</label>
                <input className="form-input" type="password" value={passForm.currentPassword} onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))} required placeholder="••••••••" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nueva contraseña</label>
                  <input className="form-input" type="password" value={passForm.newPassword} onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))} required placeholder="Mín. 8 caracteres" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar</label>
                  <input className="form-input" type="password" value={passForm.confirm} onChange={(e) => setPassForm((p) => ({ ...p, confirm: e.target.value }))} required placeholder="Repetir nueva" />
                </div>
              </div>
              <button className="btn btn-ghost" type="submit" disabled={passLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                {passLoading ? 'Actualizando...' : <><Lock size={15} /> Cambiar Contraseña</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
