import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { config } from '../configs/config.js';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

export const sendFavoriteEmail = async (email, name) => {
  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email }],
    subject: '¡Felicidades! Eres un Usuario Favorito en ParkPoint Solutions',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; text-align: center;">¡Felicidades ${name}!</h1>
          <p style="color: #666; text-align: center;">Has sido seleccionado como <strong style="color: #007bff;">Usuario Favorito</strong> en ParkPoint Solutions</p>
          <div style="background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">Beneficios de Usuario Favorito:</h3>
            <ul style="color: #388e3c; line-height: 1.8;">
              <li>10% de descuento en todas tus reservas</li>
              <li>Este estatus se revisa mensualmente</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Gracias por ser parte de ParkPoint Solutions.</p>
        </div>
      </div>
    `,
  };

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Favorite email sent:', result.body?.messageId || 'OK');
  return result;
};
