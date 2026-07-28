import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });
  const [error, setError] = useState('');
  const [sessionMsg, setSessionMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = sessionStorage.getItem('pp_auth_msg');
    if (msg) {
      setSessionMsg(msg);
      sessionStorage.removeItem('pp_auth_msg');
    }
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/auth/login', form);
      if (data.success) {
        login(data.token, data.userDetails);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'No se pudo conectar al servidor. Verifica que los servicios estén activos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background image */}
      <div className="auth-bg" style={{ backgroundImage: "url('/imagenp2.jpg')", backgroundPosition: 'center 30%' }} />

      {/* Brand watermark */}
      <div className="auth-brand">
        <strong>ParkPoint</strong> &nbsp;Solutions © 2025
      </div>

      {/* Glass card */}
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🅿</div>
          <div>
            <h2>ParkPoint Solutions</h2>
            <span>Estacionamiento Inteligente</span>
          </div>
        </div>

        <h1 className="auth-title">Bienvenido de vuelta</h1>
        <p className="auth-subtitle">Ingresa tus credenciales para acceder al sistema</p>

        {sessionMsg && (
          <div className="alert" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.3)', color: '#eab308', marginBottom: 4 }}>
            <span className="alert-icon">🔒</span>
            <span>{sessionMsg}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email o usuario</label>
            <input
              className="form-input"
              type="text"
              name="emailOrUsername"
              placeholder="usuario@email.com"
              value={form.emailOrUsername}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
            style={{ marginTop: 10, padding: '13px' }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verificando...</>
            ) : 'Ingresar →'}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-center" style={{ fontSize: 13, color: 'var(--text-2)' }}>
          ¿No tienes cuenta?{' '}
          <Link className="text-link" to="/register">Crear cuenta gratis</Link>
        </p>
      </div>
    </div>
  );
}
