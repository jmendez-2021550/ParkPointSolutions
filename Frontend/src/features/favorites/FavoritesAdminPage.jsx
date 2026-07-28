import { useState, useEffect } from 'react';
import { Star, Trophy, RefreshCw, Mail, DollarSign, BarChart3, Info } from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useToast } from '../../shared/components/Toast.jsx';

const PROGRAM_POINTS = [
  { Icon: RefreshCw, title: 'Actualización', desc: 'Se ejecuta manualmente o puede automatizarse mensualmente' },
  { Icon: Mail, title: 'Notificación', desc: 'Se envía email personalizado a cada usuario favorito' },
  { Icon: DollarSign, title: 'Descuento', desc: '10% en todas sus reservas mientras mantengan el estatus' },
];

const HOW_STEPS = [
  { step: '1', Icon: BarChart3, title: 'Análisis', desc: 'El sistema analiza las reservas completadas de los últimos 30 días para todos los usuarios.' },
  { step: '2', Icon: Trophy, title: 'Selección', desc: 'Los 10 usuarios con más reservas completadas son marcados como favoritos.' },
  { step: '3', Icon: Mail, title: 'Notificación', desc: 'Se envía un email personalizado a cada usuario favorito informándoles de su beneficio del 10%.' },
];

export default function FavoritesAdminPage() {
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [occupancy, setOccupancy] = useState(null);

  useEffect(() => {
    api.get('/api/v1/parking/analytics/occupancy')
      .then(({ data }) => setOccupancy(data))
      .catch(() => {});
  }, []);

  const handleProcess = async () => {
    if (!confirm('¿Procesar usuarios favoritos del último mes?')) return;
    setProcessing(true);
    try {
      await api.post('/api/v1/favorites/process');
      toast('Usuarios favoritos actualizados. Se enviaron emails de notificación.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Error al procesar favoritos', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Usuarios Favoritos</h2>
        <p>Procesa y administra los beneficios de los usuarios más frecuentes</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Star size={18} /> Programa de Favoritos</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--gold-dim)', borderRadius: 10, border: '1px solid rgba(201,162,39,.3)', marginBottom: 12 }}>
                <span style={{ color: 'var(--gold)', display: 'flex' }}><Trophy size={28} /></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Top 10 usuarios del mes</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Con más reservas completadas reciben 10% de descuento</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PROGRAM_POINTS.map(({ Icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--gold)', display: 'flex', marginTop: 1 }}><Icon size={16} /></span>
                    <div><strong>{title}</strong>: {desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-gold btn-full" onClick={handleProcess} disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {processing ? 'Procesando...' : <><Star size={16} /> Procesar Usuarios Favoritos</>}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={18} /> Estado del Sistema</h3></div>
          <div className="card-body">
            {occupancy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Total de espacios', value: occupancy.total, color: 'var(--blue)' },
                  { label: 'Disponibles ahora', value: occupancy.disponibles, color: 'var(--success)' },
                  { label: 'Ocupados ahora', value: occupancy.ocupados, color: 'var(--danger)' },
                  { label: 'Ocupación actual', value: occupancy.porcentajeOcupacion, color: 'var(--gold)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                    <strong style={{ color }}>{value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="loading-box" style={{ padding: 30 }}>
                <div className="spinner" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Info size={18} /> ¿Cómo funciona el programa?</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {HOW_STEPS.map(({ step, Icon, title, desc }) => (
              <div key={step} style={{ padding: '18px', background: 'var(--bg)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', color: 'var(--gold)' }}><Icon size={30} /></div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{step}. {title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
