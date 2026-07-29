import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { config } from '../configs/config.js';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

export const sendReportEmail = async (pdfBuffer, toEmail) => {
  const recipient = toEmail || process.env.SUPER_ADMIN_EMAIL || 'admin@parkpoint.com';
  console.log(`Sending weekly report to ${recipient}`);

  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email: recipient }],
    subject: 'Reporte de ocupación - ParkPoint Solutions',
    textContent: 'Adjunto encontrarás el reporte de ocupación del estacionamiento generado desde el panel de administración de ParkPoint Solutions.',
    attachment: [
      {
        name: 'reporte_ocupacion.pdf',
        content: pdfBuffer.toString('base64'),
      },
    ],
  };

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Report email sent:', result.body?.messageId || 'OK', '->', recipient);
  return { info: result, recipient };
};
