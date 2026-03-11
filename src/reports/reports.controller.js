import PDFDocument from 'pdfkit';
import { Reservation, ParkingSpot } from '../parking/parking.model.js';
import { sequelize } from '../../configs/db.js';
import { getUserRoleNames } from '../../helpers/role-db.js';
import { SUPER_ADMIN_ROLE } from '../../helpers/role-constants.js';
import { sendReportEmail } from '../../helpers/email-service.js';

// helper que revisa si el usuario actual es superadmin
const ensureSuperAdmin = async (req) => {
  const currentUserId = req.userId;
  if (!currentUserId) return false;
  const roles =
    req.user?.UserRoles?.map((ur) => ur.Role?.Name).filter(Boolean) ??
    (await getUserRoleNames(currentUserId));
  return roles.includes(SUPER_ADMIN_ROLE);
};

export const sendWeeklyReport = async (req, res, next) => {
  try {
    if (!(await ensureSuperAdmin(req))) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const reservations = await Reservation.findAll({
      where: {
        CreatedAt: { [sequelize.Sequelize.Op.gte]: oneWeekAgo },
      },
      include: [{ model: ParkingSpot, as: 'ParkingSpot' }],
    });

    const total = reservations.length;
    const bySlot = {};
    const byDay = {};
    const byHour = {};
    reservations.forEach((r) => {
      const code = r.ParkingSpot?.Code || 'N/A';
      bySlot[code] = (bySlot[code] || 0) + 1;
      const day = r.CreatedAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      const hour = new Date(r.StartAt || r.CreatedAt).getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });

    const totalSpots = await ParkingSpot.count();
    const occupancyRate = total > 0 ? ((total / (totalSpots * 7)) * 100).toFixed(2) : 0;

    const doc = new PDFDocument({
      bufferPages: true,
      margin: 40,
    });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      console.log('Report PDF generated, size:', pdfBuffer.length, 'bytes');
      await sendReportEmail(pdfBuffer);
      res.json({ message: 'Reporte generado y enviado' });
    });

    const startDate = oneWeekAgo.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Encabezado
    doc.fontSize(24).font('Helvetica-Bold').text('ParkPoint Solutions', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Sistema de Estacionamiento Inteligente', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text('Avenida Principal, Guatemala | Tel: +502-1234-5678', { align: 'center' });
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#007bff');
    doc.moveDown();

    doc.fontSize(18).font('Helvetica-Bold').text('REPORTE SEMANAL DE OCUPACION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Periodo: ${startDate} hasta ${endDate}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('RESUMEN EJECUTIVO');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e0e0e0');
    doc.moveDown();

    const summaryBoxY = doc.y;
    doc.rect(40, summaryBoxY, 150, 80).stroke('#007bff');
    doc.fontSize(10).font('Helvetica').text('Total de Reservas', 50, summaryBoxY + 10);
    doc.fontSize(20).font('Helvetica-Bold').text(total.toString(), 50, summaryBoxY + 30, { width: 130, align: 'center' });
    doc.font('Helvetica').fontSize(9).text('(ultimo 7 dias)', 50, summaryBoxY + 60, { width: 130, align: 'center' });

    doc.rect(200, summaryBoxY, 150, 80).stroke('#28a745');
    doc.fontSize(10).font('Helvetica').text('Espacios Totales', 210, summaryBoxY + 10);
    doc.fontSize(20).font('Helvetica-Bold').text(totalSpots.toString(), 210, summaryBoxY + 30, { width: 130, align: 'center' });
    doc.font('Helvetica').fontSize(9).text('disponibles', 210, summaryBoxY + 60, { width: 130, align: 'center' });

    doc.rect(360, summaryBoxY, 150, 80).stroke('#ffc107');
    doc.fontSize(10).font('Helvetica').text('Ocupacion Promedio', 370, summaryBoxY + 10);
    doc.fontSize(20).font('Helvetica-Bold').text(`${occupancyRate}%`, 370, summaryBoxY + 30, { width: 130, align: 'center' });
    doc.font('Helvetica').fontSize(9).text('de la capacidad', 370, summaryBoxY + 60, { width: 130, align: 'center' });

    doc.y = summaryBoxY + 100;
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('RESERVAS POR DIA');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e0e0e0');
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');
    Object.entries(byDay).sort().forEach(([day, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      doc.text(`${day}: ${count} reservas (${percentage}%)`, 50);
    });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('RESERVAS POR ESPACIO');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e0e0e0');
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');
    Object.entries(bySlot).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([slot, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      doc.text(`Espacio ${slot}: ${count} reservas (${percentage}%)`, 50);
    });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('HORAS CON MAS DEMANDA');
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e0e0e0');
    doc.moveDown();
    doc.fontSize(9).font('Helvetica');
    Object.entries(byHour).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([hour, count]) => {
      const h = hour.toString().padStart(2, '0');
      const percentage = ((count / total) * 100).toFixed(1);
      doc.text(`${h}:00 - ${h}:59: ${count} reservas (${percentage}%)`, 50);
    });

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#007bff');
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text('Reporte generado automaticamente por ParkPoint Solutions', { align: 'center' });
    doc.text(`Fecha de generacion: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
    doc.text('2026 ParkPoint Solutions. Sistema de Estacionamiento Inteligente.', { align: 'center' });
    doc.end();
  } catch (err) {
    next(err);
  }
};
