import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../shared/api/axiosClient.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email') || '';

  // 'pending' | 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState(tokenFromUrl ? 'verifying' : 'pending');
  const [errorMsg, setErrorMsg] = useState('');

  // Manual token input
  const [tokenInput, setTokenInput] = useState('');

  // Resend form
  const [resendEmail, setResendEmail] = useState(emailFromUrl);
  const [resendStatus, setResendStatus] = useState('idle'); // 'idle'|'sending'|'sent'|'error'
  const [resendMsg, setResendMsg] = useState('');

  const verifyToken = async (token) => {
    setStatus('verifying');
    setErrorMsg('');
    try {
      const { data } = await api.post('/api/v1/auth/verify-email', { token });
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Token inválido o expirado.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Token inválido o expirado. Por favor reenvía el correo.');
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    verifyToken(trimmed);
  };

  const handleResend = async (e) => {
    e.preventDefault();
    const email = resendEmail.trim().toLowerCase();
    if (!email) return;
    setResendStatus('sending');
    setResendMsg('');
    try {
      const { data } = await api.post('/api/v1/auth/resend-verification', { email });
      if (data.success) {
        setResendStatus('sent');
        setResendMsg('¡Correo enviado! Revisa tu bandeja de entrada.');
      } else {
        setResendStatus('error');
        setResendMsg(data.message || 'No se pudo reenviar el correo.');
      }
    } catch (err) {
      setResendStatus('error');
      setResendMsg(err.response?.data?.message || 'Error al reenviar el correo. Intenta de nuevo.');
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-bg"
        style={{ backgroundImage: "url('/imagenp3.jpg')", backgroundPosition: 'center 40%' }}
      />
      <div className="auth-brand">
        <strong>ParkPoint</strong>&nbsp;Solutions © 2025
      </div>

      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🅿</div>
          <div>
            <h2>ParkPoint Solutions</h2>
            <span>Verificación de correo</span>
          </div>
        </div>

        {/* ── VERIFYING ── */}
        {status === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 20px' }} />
            <h1 className="auth-title">Verificando correo…</h1>
            <p className="auth-subtitle">Un momento, estamos validando tu token.</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(31,212,94,.15)', border: '2px solid var(--status-available)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 20px',
            }}>✓</div>
            <h1 className="auth-title" style={{ color: 'var(--status-available)' }}>¡Email verificado!</h1>
            <p className="auth-subtitle" style={{ marginBottom: 28 }}>
              Tu correo ha sido confirmado exitosamente. Ya puedes iniciar sesión.
            </p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ display: 'block', padding: '13px', textAlign: 'center' }}>
              Ir a Iniciar Sesión →
            </Link>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(239,68,68,.12)', border: '2px solid var(--status-occupied)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 16px',
            }}>✕</div>
            <h1 className="auth-title" style={{ color: 'var(--status-occupied)' }}>Token inválido</h1>
            <div className="alert alert-error" style={{ textAlign: 'left' }}>
              <span className="alert-icon">⚠</span>
              <span>{errorMsg}</span>
            </div>
            <p className="auth-subtitle" style={{ margin: '16px 0 8px' }}>
              Reenvía el correo de verificación a tu email:
            </p>
            <ResendForm
              email={resendEmail}
              setEmail={setResendEmail}
              onSubmit={handleResend}
              resendStatus={resendStatus}
              resendMsg={resendMsg}
            />
          </div>
        )}

        {/* ── PENDING (no token in URL, arrived from register) ── */}
        {status === 'pending' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--gold-dim)', border: '2px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 16px',
              }}>✉</div>
              <h1 className="auth-title">Revisa tu correo</h1>
              <p className="auth-subtitle">
                Te enviamos un enlace de verificación
                {emailFromUrl && <> a <strong style={{ color: 'var(--gold)' }}>{emailFromUrl}</strong></>}.
                Haz clic en el enlace del correo o pega el token aquí abajo.
              </p>
            </div>

            {/* Manual token entry */}
            <form onSubmit={handleManualSubmit} style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Token de verificación</label>
                <input
                  className="form-input"
                  placeholder="Pega el código del correo aquí"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  autoComplete="off"
                />
                <div className="form-hint">
                  El token está en el enlace del correo (después de <code>?token=</code>)
                </div>
              </div>
              <button
                className="btn btn-primary btn-full"
                type="submit"
                disabled={!tokenInput.trim()}
                style={{ padding: '13px' }}
              >
                Verificar correo →
              </button>
            </form>

            <hr className="divider" />

            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, textAlign: 'center' }}>
              ¿No recibiste el correo? Reenvíalo:
            </p>
            <ResendForm
              email={resendEmail}
              setEmail={setResendEmail}
              onSubmit={handleResend}
              resendStatus={resendStatus}
              resendMsg={resendMsg}
            />
          </>
        )}

        <hr className="divider" style={{ marginTop: 24 }} />
        <p className="text-center" style={{ fontSize: 13, color: 'var(--text-2)' }}>
          ¿Ya verificaste?{' '}
          <Link className="text-link" to="/login">Iniciar sesión</Link>
          {' · '}
          <Link className="text-link" to="/register">Crear otra cuenta</Link>
        </p>
      </div>
    </div>
  );
}

function ResendForm({ email, setEmail, onSubmit, resendStatus, resendMsg }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <input
          className="form-input"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {resendMsg && (
        <div className={`alert ${resendStatus === 'sent' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 10 }}>
          <span className="alert-icon">{resendStatus === 'sent' ? '✓' : '⚠'}</span>
          <span>{resendMsg}</span>
        </div>
      )}
      <button
        className="btn btn-primary btn-full"
        type="submit"
        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
        style={{ padding: '11px' }}
      >
        {resendStatus === 'sending' ? (
          <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Enviando…</>
        ) : resendStatus === 'sent' ? '¡Correo enviado!' : 'Reenviar correo de verificación'}
      </button>
    </form>
  );
}
