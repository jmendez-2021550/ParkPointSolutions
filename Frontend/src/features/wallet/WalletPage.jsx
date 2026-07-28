import { useState, useEffect } from 'react';
import {
  CreditCard, Car, Clock, X as XIcon, ClipboardList, Lock, Eye, EyeOff, Sparkles,
} from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';
import { luhnValid, expiryValid, cvvValid } from '../../shared/utils/validators.js';

const MAX_BALANCE = 300;
// One balance key per user — different accounts don't share the same wallet
const walletKey  = (uid) => `pp_wallet_${uid}`;
const getBalance = (uid) => parseFloat(localStorage.getItem(walletKey(uid)) || '0');
const saveBalance = (uid, v) => {
  localStorage.setItem(walletKey(uid), Math.min(v, MAX_BALANCE).toFixed(2));
  window.dispatchEvent(new Event('pp_wallet_update'));
};

const PRESETS = [40, 80, 120, 200];
const BONUS_CAP = 25; // max bonus in quetzales per recharge

const fmt = (dt) =>
  dt ? new Date(dt).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// Format card number into groups of 4
const fmtCard = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

// Format expiry as MM/YY
const fmtExpiry = (v) => {
  const clean = v.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
  return clean;
};

// Detect card brand from first digit
function cardBrand(num) {
  const n = num.replace(/\s/g, '');
  if (n.startsWith('4')) return { label: 'VISA', color: '#f7b600' };
  if (n.startsWith('5')) return { label: 'Mastercard', color: '#ff5f00' };
  if (n.startsWith('3')) return { label: 'AMEX', color: '#6cc5f0' };
  return { label: '', color: 'rgba(255,255,255,.8)' };
}

export default function WalletPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [balance, setBalanceState] = useState(() => getBalance(user?.id));
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');

  // Card form state
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    api.get(`/api/v1/parking/user/${user.id}`)
      .then(({ data }) => setReservations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalSpent = reservations
    .filter(r => r.estado === 'completado')
    .reduce((sum, r) => sum + (r.precioCentavos || 0), 0) / 100;

  const finalAmount = selectedAmount ?? (parseFloat(customAmount) || 0);
  const brand = cardBrand(cardNum);

  // Returns first validation error message, or null if the card+amount are valid
  const cardError = () => {
    if (finalAmount <= 0) return 'Selecciona un monto a recargar';
    if (balance >= MAX_BALANCE) return `Ya tienes el saldo máximo permitido de Q. ${MAX_BALANCE}.00`;
    if (balance + finalAmount > MAX_BALANCE) return `El monto excede el límite. Solo puedes recargar Q. ${(MAX_BALANCE - balance).toFixed(2)} más`;
    if (finalAmount > MAX_BALANCE) return `El monto máximo por recarga es Q. ${MAX_BALANCE}.00`;
    if (!luhnValid(cardNum)) return 'El número de tarjeta no es válido';
    if (cardName.trim().length < 3) return 'Ingresa el nombre del titular';
    if (!expiryValid(cardExpiry)) return 'La fecha de vencimiento es inválida o la tarjeta expiró';
    if (!cvvValid(cardCvv, cardNum)) return `El CVV debe tener ${cardNum.replace(/\D/g, '').startsWith('3') ? 4 : 3} dígitos`;
    return null;
  };

  const isCardValid = () => cardError() === null;

  const handleRecharge = () => {
    const err = cardError();
    if (err) {
      toast(err, 'error');
      return;
    }
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      // 10% bonus on recharges of Q80+, capped at Q25 to protect margins
      const bonus = finalAmount >= 80 ? Math.min(finalAmount * 0.10, BONUS_CAP) : 0;
      // Cap total so balance never exceeds Q300
      const rawTotal = finalAmount + bonus;
      const total = Math.min(rawTotal, MAX_BALANCE - balance);
      const newBal = balance + total;
      saveBalance(user.id, newBal);
      setBalanceState(newBal);
      if (bonus > 0 && rawTotal === total) {
        toast(`Recarga exitosa. Q. ${finalAmount.toFixed(2)} + Q. ${bonus.toFixed(2)} de bono = Q. ${total.toFixed(2)}`, 'success');
      } else if (rawTotal > total) {
        toast(`Recarga ajustada a Q. ${total.toFixed(2)} para no exceder el límite de Q. ${MAX_BALANCE}.00`, 'warning');
      } else {
        toast(`Se recargaron Q. ${total.toFixed(2)} a tu billetera`, 'success');
      }
      // Reset form
      setCardNum(''); setCardName(''); setCardExpiry(''); setCardCvv('');
      setSelectedAmount(null); setCustomAmount('');
      setProcessing(false);
    }, 1800);
  };

  const completedReservations = reservations.filter(r => r.estado === 'completado');
  const activeReservations = reservations.filter(r => r.estado === 'reservado' || r.estado === 'activo');

  const maskedNum = cardNum
    ? cardNum.replace(/\s/g, '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••';

  return (
    <div>
      <div className="page-header">
        <h2>Mi Billetera</h2>
        <p>Gestiona tu saldo y recarga con tu tarjeta de crédito o débito</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: balance + history ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Balance card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--dark-4) 0%, var(--dark-5) 100%)',
            border: '1px solid var(--border-2)', borderRadius: 16,
            padding: '28px 28px 22px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%',
              background: 'rgba(47,125,255,.07)', border: '1px solid rgba(47,125,255,.1)',
            }} />
            <div style={{
              position: 'absolute', top: 20, right: 20,
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--blue-dim)', border: '1px solid rgba(47,125,255,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><CreditCard size={20} color="#5b9dff" /></div>

            <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 10 }}>
              Saldo disponible
            </div>
            <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>
              Q. {balance.toFixed(2)}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: `${Math.min((balance / MAX_BALANCE) * 100, 100)}%`, background: balance >= MAX_BALANCE ? 'var(--rose)' : 'linear-gradient(90deg, var(--teal), #4f8ef7)', transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Límite: Q. {MAX_BALANCE}.00
              </span>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Total recargado</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--teal)' }}>
                  + Q. {(balance + totalSpent).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Total gastado</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--rose)' }}>
                  - Q. {totalSpent.toFixed(2)}
                </div>
              </div>
              {activeReservations.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Reservas activas</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warning)' }}>
                    {activeReservations.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction history */}
          <div className="card">
            <div className="card-header">
              <h3>Historial de Transacciones</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tus movimientos recientes</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>
            ) : reservations.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon"><ClipboardList size={40} /></div>
                <h3>Sin transacciones</h3>
                <p>Realiza tu primera reserva para ver el historial</p>
              </div>
            ) : (
              <div>
                {reservations.map((r) => {
                  const isCompleted = r.estado === 'completado';
                  const isCancelled = r.estado === 'cancelado';
                  const isActive = r.estado === 'reservado' || r.estado === 'activo';
                  const amount = r.precioCentavos ? (r.precioCentavos / 100).toFixed(2) : null;
                  return (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 22px', borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCompleted ? 'var(--rose-dim)' : isActive ? 'var(--blue-dim)' : 'var(--glass-2)',
                      }}>
                        {isCompleted ? <Car size={18} color="var(--rose)" /> : isActive ? <Clock size={18} color="#5b9dff" /> : <XIcon size={18} color="var(--text-muted)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#fff' }}>
                          Parking — Espacio {r.espacio?.codigo || r.espacioId}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {fmt(r.inicioReserva || r.creadoEn)}
                          {' · '}
                          <span className={`badge ${isCompleted ? 'badge-danger' : isActive ? 'badge-blue' : 'badge-muted'}`}
                            style={{ fontSize: 10, padding: '1px 7px' }}>
                            {isCompleted ? 'Pagado' : isActive ? 'Pendiente' : 'Cancelado'}
                          </span>
                        </div>
                      </div>
                      {amount && (
                        <div style={{
                          fontWeight: 800, fontSize: 15,
                          color: isCompleted ? 'var(--rose)' : isActive ? 'var(--text-2)' : 'var(--text-muted)',
                        }}>
                          {isCompleted ? '- ' : ''}Q. {amount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: recharge with credit card ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '18px 22px 0' }}>
            <h3>Recargar Saldo</h3>
          </div>

          <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── Virtual card preview ── */}
            <div
              className="wallet-card-preview"
              style={{
                perspective: 800,
                cursor: 'pointer',
              }}
              onClick={() => setCardFlipped(f => !f)}
            >
              <div style={{
                position: 'relative', height: 160, borderRadius: 14, overflow: 'hidden',
                background: `linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%)`,
                boxShadow: '0 8px 24px rgba(0,0,0,.45)',
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'transform .3s',
              }}>
                {/* Shine */}
                <div style={{
                  position: 'absolute', top: 0, left: '-60%', width: '80%', height: '100%',
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,.07) 50%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
                {/* Chip + brand */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 30, borderRadius: 5,
                    background: 'linear-gradient(135deg, #ffd700, #ffa000)',
                    border: '1px solid rgba(255,200,0,.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 26, height: 18, border: '1px solid rgba(0,0,0,.25)', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {brand.label && (
                      <span style={{ fontSize: 16, fontWeight: 900, color: brand.color, letterSpacing: 1, fontStyle: 'italic' }}>
                        {brand.label}
                      </span>
                    )}
                    <CreditCard size={24} color="rgba(255,255,255,.85)" />
                  </div>
                </div>
                {/* Card number */}
                <div style={{
                  fontFamily: 'monospace', fontSize: 17, letterSpacing: 3,
                  color: 'rgba(255,255,255,.92)', fontWeight: 700,
                }}>
                  {maskedNum}
                </div>
                {/* Name + expiry */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Titular</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                      {cardName || 'NOMBRE APELLIDO'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Vence</div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>
                      {cardExpiry || 'MM/AA'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Amount selection ── */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Monto a recargar
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                {PRESETS.map((amt) => (
                  <button
                    key={amt}
                    className="btn"
                    style={{
                      padding: '10px 4px', fontSize: 14, fontWeight: 800,
                      background: selectedAmount === amt ? 'rgba(47,125,255,.22)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${selectedAmount === amt ? 'rgba(47,125,255,.55)' : 'rgba(255,255,255,.1)'}`,
                      color: selectedAmount === amt ? '#5b9dff' : 'var(--text-2)',
                      borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                    }}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  >
                    Q.{amt}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 700 }}>Q.</span>
                  <input
                    className="form-input"
                    type="number" min="1" step="0.01" placeholder="Otro monto"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    style={{ paddingLeft: 28, fontSize: 14 }}
                  />
                </div>
              </div>
              {finalAmount > 0 && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(6,214,160,.08)', border: '1px solid rgba(6,214,160,.2)',
                  fontSize: 13, color: 'var(--teal)', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  {(() => {
                    const bonus = finalAmount >= 80 ? Math.min(finalAmount * 0.10, BONUS_CAP) : 0;
                    const wouldExceed = balance + finalAmount + bonus > MAX_BALANCE;
                    return bonus > 0 && !wouldExceed
                      ? <><Sparkles size={15} style={{ flexShrink: 0 }} /> ¡Bono! Recibirás Q. {(finalAmount + bonus).toFixed(2)} (Q. {bonus.toFixed(2)} extra)</>
                      : <>Total a acreditar: Q. {Math.min(finalAmount, MAX_BALANCE - balance).toFixed(2)}</>;
                  })()}
                </div>
              )}
            </div>

            {/* ── Card form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                Datos de la tarjeta
              </div>

              {/* Card number */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Número de tarjeta</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={cardNum}
                    onChange={(e) => setCardNum(fmtCard(e.target.value))}
                    style={{ paddingRight: 44, fontFamily: 'monospace', letterSpacing: 2 }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <CreditCard size={18} color="var(--text-muted)" />
                  </span>
                </div>
              </div>

              {/* Cardholder name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Nombre del titular</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="NOMBRE APELLIDO"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', letterSpacing: 1 }}
                />
              </div>

              {/* Expiry + CVV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Vencimiento</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))}
                    style={{ fontFamily: 'monospace', letterSpacing: 2, textAlign: 'center' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>CVV</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showCvv ? 'text' : 'password'}
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onFocus={() => setCardFlipped(true)}
                      onBlur={() => setCardFlipped(false)}
                      style={{ fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(s => !s)}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center',
                      }}
                    >{showCvv ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Security notice ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(47,125,255,.07)', border: '1px solid rgba(47,125,255,.15)',
              borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--text-2)',
            }}>
              <Lock size={14} color="#5b9dff" style={{ flexShrink: 0 }} />
              Tus datos están protegidos con encriptación SSL de 256 bits
            </div>

            {/* ── Submit button ── */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
              onClick={handleRecharge}
              disabled={processing || finalAmount <= 0}
            >
              {processing ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Procesando pago...
                </span>
              ) : (
                finalAmount > 0
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CreditCard size={17} /> Recargar Q. {finalAmount.toFixed(2)}</span>
                  : 'Selecciona un monto'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
