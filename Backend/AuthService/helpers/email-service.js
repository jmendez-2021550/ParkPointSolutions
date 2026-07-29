import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';
import { config } from '../configs/config.js';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);

const buildFrontendUrl = () => config.app.frontendUrl || 'http://localhost:3000';

export const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${buildFrontendUrl()}/verify-email?token=${verificationToken}`;

  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email }],
    subject: '¡Bienvenido a Parqueo_Inteligente!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; text-align: center; margin-bottom: 10px;">¡Bienvenido ${name}!</h1>
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 30px;">A <strong style="color: #007bff;">Parqueo_Inteligente</strong></p>
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Gracias por unirte a nuestra comunidad. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href='${verificationUrl}' style='background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verificar Correo</a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="color: #007bff; font-size: 11px; text-align: center; word-break: break-all;">${verificationUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Este enlace de verificación expirará en 24 horas.</p>
          <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, ignora este correo electrónico.</p>
        </div>
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">© 2026 ParkPoint Solutions. Todos los derechos reservados.</p>
      </div>
    `,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendWelcomeEmail = async (email, name) => {
  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email }],
    subject: '¡Cuenta verificada exitosamente!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; text-align: center; margin-bottom: 10px;">¡Cuenta verificada!</h1>
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px; text-align: center;">Hola <strong>${name}</strong>, tu correo ha sido verificado correctamente. Ya puedes iniciar sesión y usar Parqueo_Inteligente.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href='${buildFrontendUrl()}' style='background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Ir a la plataforma</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Si no reconoces esta acción, contacta con soporte.</p>
        </div>
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">© 2026 ParkPoint Solutions. Todos los derechos reservados.</p>
      </div>
    `,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${buildFrontendUrl()}/reset-password?token=${resetToken}`;

  const sendSmtpEmail = {
    sender: { name: config.brevo.fromName, email: config.brevo.fromEmail },
    to: [{ email }],
    subject: 'Recuperación de contraseña - Parqueo_Inteligente',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Restablecimiento de contraseña</h2>
          <p style="color: #555; line-height: 1.6;">Hola ${name}, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Recuperar contraseña</a>
          </div>
          <p style="color: #999; font-size: 12px;">O copia y pega este enlace en tu navegador:</p>
          <p style="color: #007bff; font-size: 11px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Este enlace expirará en 1 hora.</p>
          <p style="color: #999; font-size: 12px;">Si no solicitaste esto, ignora este correo.</p>
        </div>
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">© 2026 ParkPoint Solutions. Todos los derechos reservados.</p>
      </div>
    `,
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};
