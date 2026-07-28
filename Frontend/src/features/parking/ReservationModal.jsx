import { useState, useEffect } from 'react';
import {
  Wallet, Clock, TriangleAlert, Check, Star, TrendingUp, TrendingDown, Activity,
} from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';


const toLocal = (d) => {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 16);
};

export default function ReservationModal({ spot, onClose, onReserved, warnActive = false }) {
  const { user } = useAuth();
  const toast = useToast();
  const now = new Date();
  const plusOne = new Date(now.getTime() + 60 * 60 * 1000);

  const [startAt, setStartAt] = useState(toLocal(now));
  const [endAt, setEndAt] = useState(toLocal(plusOne));
  const [arrivalMinutes, setArrivalMinutes] = useState(30);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState('');

  const walletBalance = parseFloat(localStorage.getItem(`pp_wallet_${user?.id}`) || '0');

  useEffect(() => {
    if (!startAt) return;
    const t = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const { data } = await api.get('/api/v1/pricing/quote', {
          params: { baseCents: 4000, startAt, userId: user?.id || '' },
        });
        setQuote(data);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [startAt, user?.id]);

  const durationHours = startAt && endAt
    ? Math.max(0, Math.ceil((new Date(endAt) - new Date(startAt)) / (1000 * 60 * 60)))
    : 0;

  const totalCents = quote ? quote.finalPriceCents * durationHours : 0;
  const totalQuetzales = (totalCents / 100).toFixed(2);
  const insufficient = totalCents > 0 && walletBalance < totalCents / 100;

  const handleSubmit = async () => {
    setError('');
    if (!startAt || !endAt) return setError('Selecciona fecha y hora de inicio y fin');
    if (new Date(startAt).getTime() < Date.now() - 2 * 60 * 1000) return setError('La hora de entrada no puede ser en el pasado');
    if (new Date(endAt) <= new Date(startAt)) return setError('La hora de fin debe ser posterior al inicio');
    if ((new Date(endAt) - new Date(startAt)) < 30 * 60 * 1000) return setError('La duración mínima de una reserva es de 30 minutos');
    if (durationHours > 24) return setError('La duración máxima de una reserva es de 24 horas');
    if (new Date(startAt) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) return setError('Solo puedes reservar con un máximo de 30 días de anticipación');
    if (!user?.id) return setError('No se pudo identificar tu usuario');
    if (totalCents <= 0) return setError('No se pudo calcular el precio, intenta de nuevo');
    if (insufficient) return setError(`Saldo insuficiente. Tu billetera tiene Q. ${walletBalance.toFixed(2)} y el costo es Q. ${totalQuetzales}.`);

    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/parking/reservations', {
        userId: user.id,
        parkingSpotId: spot.id,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        priceCents: totalCents,
      });

      // Deduct from wallet balance
      const newBalance = walletBalance - totalCents / 100;
      localStorage.setItem(`pp_wallet_${user?.id}`, newBalance.toFixed(2));
      window.dispatchEvent(new Event('pp_wallet_update'));

      // Store pending arrival for countdown
      const deadline = new Date(Date.now() + arrivalMinutes * 60 * 1000).toISOString();
      localStorage.setItem('pp_pending_arrival', JSON.stringify({
        reservationId: data.reserva?.id,
        spotCodigo: spot.codigo,
        deadline,
        arrivalMinutes,
      }));
      window.dispatchEvent(new Event('pp_arrival_set'));

      toast(`Espacio ${spot.codigo} reservado. Tienes ${arrivalMinutes} min para llegar.`, 'success');
      onReserved();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3>Reservar Espacio {spot.codigo}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Piso {spot.piso || spot.nivel || '1'} • Precio dinámico según ocupación
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {warnActive && (
            <div className="alert" style={{ background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.3)', color: '#eab308', marginBottom: 12 }}>
              <span className="alert-icon"><TriangleAlert size={16} /></span>
              <span>Ya tienes una reserva activa en el sistema. Puedes crear otra si lo necesitas.</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon"><TriangleAlert size={16} /></span>
              <span>{error}</span>
            </div>
          )}

          {/* Wallet balance info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: insufficient ? 'rgba(251,90,114,.08)' : 'rgba(6,214,160,.07)',
            border: `1px solid ${insufficient ? 'rgba(251,90,114,.25)' : 'rgba(6,214,160,.2)'}`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Wallet size={15} /> Saldo disponible
            </span>
            <span style={{
              fontWeight: 700,
              color: insufficient ? '#fb5a72' : '#06d6a0',
            }}>
              Q. {walletBalance.toFixed(2)}
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Entrada</label>
              <input
                className="form-input"
                type="datetime-local"
                value={startAt}
                min={toLocal(new Date())}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Salida</label>
              <input
                className="form-input"
                type="datetime-local"
                value={endAt}
                min={startAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          {/* Arrival time selector */}
          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Tiempo máximo para llegar (minutos)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                className="form-input"
                type="number"
                min="5"
                max="120"
                value={arrivalMinutes}
                onChange={(e) => {
                  const v = Math.max(5, Math.min(120, parseInt(e.target.value) || 5));
                  setArrivalMinutes(v);
                }}
                style={{ width: 90, textAlign: 'center', fontWeight: 700, fontSize: 16 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                {[10, 20, 30, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setArrivalMinutes(m)}
                    style={{
                      padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                      background: arrivalMinutes === m ? 'rgba(47,125,255,.25)' : 'rgba(255,255,255,.06)',
                      border: `1px solid ${arrivalMinutes === m ? 'rgba(47,125,255,.5)' : 'rgba(255,255,255,.1)'}`,
                      color: arrivalMinutes === m ? '#5b9dff' : 'var(--text-2)',
                      transition: 'all .15s',
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              Entre 5 y 120 minutos. Si no llegas en este tiempo, la reserva se cancelará automáticamente.
            </p>
          </div>

          {durationHours > 0 && (
            <div className="price-summary">
              <div className="price-summary-row">
                <div>
                  <div className="price-summary-label">
                    {quoteLoading ? 'Calculando precio dinámico...' : `Total por ${durationHours} hora${durationHours !== 1 ? 's' : ''}`}
                  </div>
                  {quote && !quoteLoading && (
                    <div className="price-occupancy" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      Ocupación actual: {quote.occupancyRate}%
                      {quote.occupancyRate >= 80
                        ? <><TrendingUp size={13} color="var(--warning)" /> Alta demanda</>
                        : quote.occupancyRate <= 30
                          ? <><TrendingDown size={13} color="var(--teal)" /> Tarifa reducida</>
                          : <><Activity size={13} /> Normal</>}
                    </div>
                  )}
                </div>
                <div className="price-summary-value" style={{ color: insufficient ? '#fb5a72' : undefined }}>
                  {quoteLoading ? '...' : `Q. ${totalQuetzales}`}
                </div>
              </div>
              {user?.isFavorite && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={13} fill="currentColor" /> Cliente favorito — 10% de descuento ya aplicado
                </div>
              )}
              {insufficient && !quoteLoading && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fb5a72', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TriangleAlert size={13} /> Fondos insuficientes. Recarga tu billetera antes de reservar.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || durationHours <= 0 || quoteLoading || insufficient}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            {loading ? 'Reservando...' : <><Check size={16} /> Confirmar Reserva</>}
          </button>
        </div>
      </div>
    </div>
  );
}
