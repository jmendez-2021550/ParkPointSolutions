import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { config } from '../configs/config.js';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

export const sendInvoiceEmail = async (email, name, surname, pdfBuffer) => {
  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email }],
    subject: 'Factura de tu reserva - ParkPoint Solutions',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h1 style="color: #007bff;">ParkPoint Solutions</h1>
          <p>Hola ${name} ${surname},</p>
          <p>Gracias por tu reserva. Adjuntamos la factura de tu reserva.</p>
          <p>Saludos,<br/>Equipo ParkPoint</p>
        </div>
      </div>
    `,
    attachment: [
      {
        name: 'factura.pdf',
        content: pdfBuffer.toString('base64'),
      },
    ],
  };

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Invoice email sent:', result.body?.messageId || 'OK');
  return result;
};
