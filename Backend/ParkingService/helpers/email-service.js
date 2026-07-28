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
    auth: {
      user: config.smtp.username,
      pass: config.smtp.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

export const sendInvoiceEmail = async (email, name, surname, pdfBuffer) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  const mailOptions = {
    from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
    to: email,
    subject: 'Factura de tu reserva - ParkPoint Solutions',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #007bff;">ParkPoint Solutions</h1>
          <p>Hola ${name} ${surname},</p>
          <p>Gracias por tu reserva. Adjuntamos la factura de tu reserva.</p>
          <p>Saludos,<br/>Equipo ParkPoint</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'factura.pdf',
        content: pdfBuffer,
      },
    ],
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Invoice email sent:', info.messageId);
  return info;
};
