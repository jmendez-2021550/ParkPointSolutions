import { useState, useEffect } from 'react';
import {
  BarChart3, ClipboardList, CircleCheck, CircleX, DollarSign,
  TrendingUp, Mail, Info, Send,
} from 'lucide-react';
import api from '../../shared/api/axiosClient.js';
import { useAuth } from '../../shared/context/AuthContext.jsx';
import { useToast } from '../../shared/components/Toast.jsx';

export default function ReportsPage() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/v1/reports/admin/summary?period=${period}`)
      .catch(() => api.get('/api/v1/reports/admin/all'))
      .then(({ data }) => {
        if (data?.totalReservaciones !== undefined) {
          setReport(data);
        } else {
          const list = Array.isArray(data) ? data : data.reservaciones || [];
          setReport({
            totalReservaciones: list.length,
            completadas: list.filter((r) => r.status === 'completado').length,
            canceladas: list.filter((r) => r.status === 'cancelado').length,
            ingresoTotal: list.reduce((s, r) => s + (Number(r.costoFinal) || 0), 0).toFixed(2),
          });
        }
      })
      .catch(() => toast('Error al cargar reporte', 'error'))
      .finally(() => setLoading(false));
  }, [period]);

  const handleEmailReport = async () => {
    setSending(true);
    try {
      const { data } = await api.post('/api/v1/reports/send-email');
      toast(data?.message || 'Reporte enviado al correo del administrador', 'success');
    } catch (err) {
      toast(err.response?.data?.error || err.response?.data?.message || 'Error al enviar reporte', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={24} /> Reportes del Sistema
        </h2>
        <p>Análisis y estadísticas de uso del parqueo</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-tabs">
          {[['day', 'Hoy'], ['week', 'Esta Semana'], ['month', 'Este Mes'], ['year', 'Este Año']].map(([key, label]) => (
            <button key={key} className={`filter-tab${period === key ? ' active' : ''}`} onClick={() => setPeriod(key)}>{label}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleEmailReport} disabled={sending}>
          {sending ? <><Send size={15} /> Enviando...</> : <><Mail size={15} /> Enviar por Email</>}
        </button>
      </div>

      {loading ? (
        <div className="loading-box"><div className="spinner" /><span>Generando reporte...</span></div>
      ) : (
        <>
          <div className="stats-grid">
            {[
              { Icon: ClipboardList, label: 'Total Reservaciones', value: report?.totalReservaciones ?? '—', color: 'blue' },
              { Icon: CircleCheck, label: 'Completadas', value: report?.completadas ?? '—', color: 'green' },
              { Icon: CircleX, label: 'Canceladas', value: report?.canceladas ?? '—', color: 'red' },
              { Icon: DollarSign, label: 'Ingreso Total', value: report?.ingresoTotal ? `Q. ${report.ingresoTotal}` : '—', color: 'gold' },
            ].map(({ Icon, label, value, color }) => (
              <div key={label} className={`stat-card ${color}`}>
                <div className="stat-top"><div className={`stat-icon-wrap ${color}`}><Icon size={20} /></div></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {report && (
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={18} /> Análisis</h3></div>
                <div className="card-body">
                  {[
                    { label: 'Tasa de completado', value: report.totalReservaciones > 0 ? `${Math.round((report.completadas / report.totalReservaciones) * 100)}%` : '—', color: 'var(--success)' },
                    { label: 'Tasa de cancelación', value: report.totalReservaciones > 0 ? `${Math.round((report.canceladas / report.totalReservaciones) * 100)}%` : '—', color: 'var(--danger)' },
                    { label: 'Ingreso promedio por reserva', value: report.completadas > 0 ? `Q. ${(Number(report.ingresoTotal) / report.completadas).toFixed(2)}` : '—', color: 'var(--gold)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="info-row">
                      <span className="info-label">{label}</span>
                      <strong style={{ color }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={18} /> Reporte por Email</h3></div>
                <div className="card-body">
                  <div className="alert alert-info" style={{ marginBottom: 16 }}>
                    <span className="alert-icon"><Info size={16} /></span>
                    <div>Se enviará un reporte completo al correo del administrador configurado en el sistema.</div>
                  </div>
                  <button className="btn btn-primary btn-full" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleEmailReport} disabled={sending}>
                    {sending ? <><Send size={16} /> Enviando...</> : <><Mail size={16} /> Enviar Reporte Ahora</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
