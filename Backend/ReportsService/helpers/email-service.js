import nodemailer from 'nodemailer';
import { config } from '../configs/config.js';

const createTransporter = () => {
  if (!config.smtp.username || !config.smtp.password) {
    console.warn('SMTP credentials not configured. Email functionality may fail.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.enableSsl,
    auth: { user: config.smtp.username, pass: config.smtp.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: { rejectUnauthorized: false },
  });
};

const transporter = createTransporter();

export const sendReportEmail = async (pdfBuffer, toEmail) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  // Send to the requesting super admin; fall back to configured address
  const recipient = toEmail || process.env.SUPER_ADMIN_EMAIL || 'admin@parkpoint.com';
  console.log(`Sending weekly report to ${recipient}`);

  const mailOptions = {
    from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to: recipient,
    subject: 'Reporte de ocupación - ParkPoint Solutions',
    text: 'Adjunto encontrarás el reporte de ocupación del estacionamiento generado desde el panel de administración de ParkPoint Solutions.',
    attachments: [{ filename: 'reporte_ocupacion.pdf', content: pdfBuffer }],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Report email sent:', info.messageId, '->', recipient);
  return { info, recipient };
};
