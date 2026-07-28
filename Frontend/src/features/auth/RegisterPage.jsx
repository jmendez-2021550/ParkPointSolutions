import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/api/axiosClient.js';
import {
  isEmail, isName, isPhone, isUsername, isStrongEnough,
  passwordStrength, STRENGTH_LABELS, STRENGTH_CLASS,
} from '../../shared/utils/validators.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', surname: '', username: '', email: '',
    phone: '', password: '', confirm: '',
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Live-restrict inputs to expected characters
    let v = value;
    if (name === 'phone') v = value.replace(/\D/g, '').slice(0, 8);
    if (name === 'name' || name === 'surname') v = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    if (name === 'username') v = value.replace(/\s/g, '');
    setForm((p) => ({ ...p, [name]: v }));
  };

  const strength = passwordStrength(form.password);

  const validate = () => {
    const errs = [];
    if (!form.name.trim() || form.name.trim().length < 2) errs.push('El nombre debe tener al menos 2 letras');
    else if (!isName(form.name)) errs.push('El nombre solo puede contener letras');
    if (!form.surname.trim() || form.surname.trim().length < 2) errs.push('El apellido debe tener al menos 2 letras');
    else if (!isName(form.surname)) errs.push('El apellido solo puede contener letras');
    if (!isUsername(form.username)) errs.push('El usuario debe tener 4-20 caracteres (letras, números, . _ -)');
    if (!isEmail(form.email)) errs.push('Ingresa un correo electrónico válido');
    if (!isPhone(form.phone)) errs.push('El teléfono debe tener exactamente 8 dígitos');
    if (!isStrongEnough(form.password)) errs.push('La contraseña debe tener mínimo 8 caracteres, con letras y números');
    if (form.password !== form.confirm) errs.push('Las contraseñas no coinciden');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    const localErrors = validate();
    if (localErrors.length > 0) return setErrors(localErrors);

    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/auth/register', {
        name: form.name,
        surname: form.surname,
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (data.success) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
      } else {
        setErrors([data.message || 'Error al registrarse']);
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors.map((e) => e.message));
      } else {
        setErrors([err.response?.data?.message || 'Error de conexión con el servidor']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background image */}
      <div className="auth-bg" style={{ backgroundImage: "url('/imagenp3.jpg')", backgroundPosition: 'center 40%' }} />

      {/* Brand watermark */}
      <div className="auth-brand">
        <strong>ParkPoint</strong> &nbsp;Solutions © 2025
      </div>

      {/* Glass card — wider for register */}
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🅿</div>
          <div>
            <h2>ParkPoint Solutions</h2>
            <span>Crear nueva cuenta</span>
          </div>
        </div>

        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Completa el formulario para registrarte</p>

        {errors.length > 0 && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className="form-input" name="name" placeholder="Juan" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input className="form-input" name="surname" placeholder="Pérez" value={form.surname} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre de usuario</label>
              <input className="form-input" name="username" placeholder="juanp123" value={form.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" name="phone" placeholder="55551234" value={form.phone} onChange={handleChange} required maxLength={8} />
              <div className="form-hint">Exactamente 8 dígitos</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" name="email" placeholder="juan@email.com" value={form.email} onChange={handleChange} required />
            <div className="form-hint">Se enviará un email de verificación</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" name="password" placeholder="Mín. 8 caracteres" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar</label>
              <input className="form-input" type="password" name="confirm" placeholder="Repetir contraseña" value={form.confirm} onChange={handleChange} required />
            </div>
          </div>

          {form.password && (
            <div style={{ marginTop: -4, marginBottom: 6 }}>
              <div className="pw-meter">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`pw-meter-seg ${i < strength ? STRENGTH_CLASS[strength] : ''}`} />
                ))}
              </div>
              <div
                className="pw-meter-label"
                style={{ color: strength <= 1 ? 'var(--danger)' : strength === 2 ? 'var(--warning)' : 'var(--success)' }}
              >
                Seguridad: {STRENGTH_LABELS[strength]}
              </div>
              {form.confirm && form.password !== form.confirm && (
                <div className="pw-meter-label" style={{ color: 'var(--danger)' }}>
                  Las contraseñas no coinciden
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 6, padding: '13px' }}>
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creando cuenta...</>
            ) : 'Crear Cuenta →'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-center" style={{ fontSize: 13, color: 'var(--text-2)' }}>
          ¿Ya tienes cuenta? <Link className="text-link" to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
