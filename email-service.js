// helpers/email-service.js
import nodemailer from 'nodemailer';

// Debug: Verificar que las variables se cargan correctamente
console.log('SMTP Configuration:');
console.log('- HOST:', process.env.SMTP_HOST);
console.log('- PORT:', process.env.SMTP_PORT);
console.log('- USER:', process.env.SMTP_USERNAME);
console.log('- PASSWORD LENGTH:', process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 'NO CONFIGURADO');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: { rejectUnauthorized: false },
});

export const sendVerificationEmail = async (email, name, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '¡Bienvenido a Parqueo_Inteligente!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; text-align: center; margin-bottom: 10px;">¡Bienvenido ${name}!</h1>
          <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 30px;">A <strong style="color: #007bff;">Parqueo_Inteligente</strong></p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Gracias por unirte a nuestra comunidad. Estamos emocionados de tenerte aquí. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href='${verificationUrl}' style='background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verificar Correo</a>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="color: #007bff; font-size: 11px; text-align: center; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Este enlace de verificación expirará en 24 horas.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            Si no creaste esta cuenta, ignora este correo electrónico.
          </p>
        </div>
        
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
          © 2026 ParkPoint Solutions. Todos los derechos reservados.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Recupera tu contraseña - Parqueo_Inteligente',
    html: `
      <h2>Restablecimiento de contraseña</h2>
      <p>Hola ${name}, haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href='${resetUrl}' style='background:#dc3545;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;'>Restablecer contraseña</a>
      <p>O copia y pega: ${resetUrl}</p>
      <p>Este enlace expira en 1 hora.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: '¡Bienvenido a Parqueo_Inteligente!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; text-align: center; margin-bottom: 10px;">¡Cuenta Verificada!</h1>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px; text-align: center;">
            Hola <strong>${name}</strong>, tu correo ha sido verificado exitosamente.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
            Ya estás listo para comenzar a usar Parqueo_Inteligente. 
            Visualiza espacios disponibles, reserva y accede fácilmente a tus estacionamientos.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href='${process.env.FRONTEND_URL || 'http://localhost:5173'}' style='background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Ir a la Plataforma</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #555; margin-bottom: 15px; font-weight: bold;">
            📌 Consejos para aprovechar al máximo:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>💭 Comparte tus opiniones más sinceras y reflexivas</li>
            <li>❤️ Agrega publicaciones a favoritos para leerlas después</li>
            <li>👍 Interactúa con otros usuarios mediante likes y comentarios</li>
            <li>🏷️ Organiza tus opiniones por categorías</li>
            <li>💬 Participa en discusiones constructivas</li>
          </ul>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Si tienes preguntas o necesitas ayuda, no dudes en contactarnos.
          </p>
        </div>
        
        <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
          © 2026 ParkPoint Solutions. Todos los derechos reservados.
        </p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

export const sendPasswordChangedEmail = async (email, name) => {
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Tu contraseña ha sido cambiada',
    html: `
      <h2>Hola ${name}</h2>
      <p>Te notificamos que tu contraseña ha sido actualizada correctamente.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};
