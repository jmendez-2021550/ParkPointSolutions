import nodemailer from 'nodemailer';
import { config } from '../configs/config.js';

// Configurar el transportador de email (aligned with .NET SmtpSettings)
const createTransporter = () => {
  console.log('📧 SMTP Configuration:');
  console.log('   HOST:', config.smtp.host);
  console.log('   PORT:', config.smtp.port);
  console.log('   SECURE (SSL):', config.smtp.enableSsl);
  console.log('   USERNAME:', config.smtp.username ? '✓ Configured' : '✗ NOT SET');
  console.log('   PASSWORD:', config.smtp.password ? '✓ Configured' : '✗ NOT SET');
  console.log('   FROM EMAIL:', config.smtp.fromEmail);
  console.log('   FROM NAME:', config.smtp.fromName);
  
  if (!config.smtp.username || !config.smtp.password) {
    console.error(
      '❌ SMTP credentials not configured. Email functionality will not work.'
    );
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.enableSsl, // true para 465, false para 587
    auth: {
      user: config.smtp.username,
      pass: config.smtp.password,
    },
    // Evitar que las peticiones HTTP queden colgadas si SMTP no responde
    connectionTimeout: 10_000, // 10s
    greetingTimeout: 10_000, // 10s
    socketTimeout: 10_000, // 10s
    tls: {
      rejectUnauthorized: false,
    },
  });
  
  console.log('✅ SMTP Transporter created successfully');
  return transporter;
};

const transporter = createTransporter();

export const sendVerificationEmail = async (email, name, verificationToken) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: '¡Bienvenido a Parqueo_Inteligente!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 10px;">¡Bienvenido ${name}!</h1>
            <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 30px;">A <strong style="color: #007bff;">Parqueo_Inteligente</strong></p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Gracias por unirte a nuestro sistema de estacionamiento inteligente. Estamos emocionados de tenerte aquí. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href='${verificationUrl}' style='background-color: #007bff; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Verificar Correo</a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="color: #007bff; font-size: 11px; text-align: center; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #555; margin-bottom: 15px;">
              <strong>¿Qué puedes hacer en Parqueo_Inteligente?</strong>
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>🅿️ Visualiza espacios disponibles en tiempo real en nuestro mapa interactivo</li>
              <li>📅 Reserva tu espacio de estacionamiento con anticipación</li>
              <li>💳 Realiza pagos digitales seguros y automatizados</li>
              <li>🚗 Accesa mediante reconocimiento de placas (LPR) o códigos QR</li>
              <li>📊 Consulta analíticas sobre ocupación y horarios pico</li>
            </ul>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Este enlace de verificación expirará en 24 horas.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Si no creaste esta cuenta, ignora este correo electrónico.
            </p>
          </div>
          
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 Parqueo_Inteligente. Todos los derechos reservados.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const frontendUrl = config.app.frontendUrl || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Recupera tu contraseña en Parqueo_Inteligente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Solicitud de Recuperación de Contraseña</h2>
            <p style="color: #555;">Hola ${name},</p>
            <p style="color: #555; line-height: 1.6;">Recibimos una solicitud para recuperar tu contraseña. Haz clic en el enlace de abajo para restablecerla:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href='${resetUrl}' style='background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>
                  Recuperar Contraseña
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
            <p style="color: #007bff; font-size: 11px; word-break: break-all;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px;">Este enlace expirará en 1 hora.</p>
            <p style="color: #999; font-size: 12px;">Si no solicitaste esto, ignora este correo electrónico y tu contraseña permanecerá sin cambios.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Envía un reporte en PDF al super administrador.
 * @param {Buffer} pdfBuffer
 */
export const sendReportEmail = async (pdfBuffer) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'jmendez-2021550@kinal.edu.gt';
    console.log(`sendReportEmail: sending weekly report to ${superAdminEmail}`);
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: superAdminEmail,
      subject: 'Reporte de ocupación semanal - Parqueo_Inteligente',
      text: 'Adjunto encontrarás el reporte de ocupación semanal.',
      attachments: [
        {
          filename: 'reporte_ocupacion.pdf',
          content: pdfBuffer,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('sendReportEmail: email sent, messageId=', info.messageId);
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
};

/**
 * Envía factura en PDF al usuario.
 * @param {string} email
 * @param {string} name
 * @param {string} surname
 * @param {Buffer} pdfBuffer
 */
export const sendInvoiceEmail = async (email, name, surname, pdfBuffer) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    console.log(`sendInvoiceEmail: preparing to send invoice to ${email}`);
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: '✓ Factura de tu Reserva - ParkPoint Solutions',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 3px solid #007bff;">
              <h1 style="color: #007bff; margin: 0 0 5px 0; font-size: 28px;">ParkPoint Solutions</h1>
              <p style="color: #666; margin: 0; font-size: 14px;">Sistema de Estacionamiento Inteligente</p>
            </div>
            
            <h2 style="color: #333; margin: 30px 0 10px 0; font-size: 20px;">¡Hola ${name} ${surname}!</h2>
            <p style="color: #555; line-height: 1.6; margin: 10px 0;">
              Tu reserva de estacionamiento ha sido procesada exitosamente. Adjunto encontrarás tu factura completa.
            </p>
            
            <div style="background-color: #e8f4f8; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #007bff; font-weight: bold;">✓ Pago Completado</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Tu reserva está confirma y tu factura está lista para descargar.</p>
            </div>
            
            <div style="margin: 25px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Documentos Incluidos:</h3>
              <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>📄 Factura detallada de tu reserva (incluida abajo)</li>
                <li>🅿️ Información del espacio reservado</li>
                <li>💳 Detalles del pago procesado</li>
              </ul>
            </div>
            
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>¿Necesitas ayuda?</strong><br>
                Contacta a nuestro equipo de soporte
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
              Este es un correo automático. Por favor no respondas directamente. Si tienes preguntas, contacta a soporte@parkpoint.com
            </p>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; margin-top: 20px;">
              <p style="color: #999; font-size: 11px; margin: 0;">
                © 2026 ParkPoint Solutions. Todos los derechos reservados.
              </p>
            </div>
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
    console.log('sendInvoiceEmail: email sent, messageId=', info.messageId);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: '¡Bienvenido a Parqueo_Inteligente!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">¡Bienvenido a Parqueo_Inteligente, ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">Tu cuenta ha sido verificada y activada exitosamente.</p>
            <p style="color: #555; line-height: 1.6;">Ahora puedes disfrutar de todas las características de nuestro sistema de estacionamiento inteligente:</p>
            <ul style="color: #666; line-height: 1.8;">
              <li>Acceso al mapa interactivo de espacios disponibles</li>
              <li>Reservas y pagos digitales</li>
              <li>Control de acceso automatizado</li>
              <li>Analíticas de ocupación</li>
            </ul>
            <p style="color: #555; line-height: 1.6;">Si tienes preguntas, no dudes en contactar a nuestro equipo de soporte.</p>
            <p style="color: #555; line-height: 1.6;">¡Gracias por unirte a nosotros!</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const sendPasswordChangedEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: 'Contraseña Actualizada en Parqueo_Inteligente',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Contraseña Actualizada</h2>
            <p style="color: #555; line-height: 1.6;">Hola ${name},</p>
            <p style="color: #555; line-height: 1.6;">Tu contraseña ha sido actualizada exitosamente en Parqueo_Inteligente.</p>
            <p style="color: #555; line-height: 1.6;">Si no realizaste este cambio, por favor contacta a nuestro equipo de soporte inmediatamente.</p>
            <p style="color: #999; font-size: 12px;">Este es un correo electrónico automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password changed email:', error);
    throw error;
  }
};

/**
 * Envía email notificando que el usuario es favorito.
 * @param {string} email
 * @param {string} name
 */
export const sendFavoriteEmail = async (email, name) => {
  if (!transporter) {
    throw new Error('SMTP transporter not configured');
  }

  try {
    console.log(`sendFavoriteEmail: sending favorite notification to ${email}`);
    const mailOptions = {
      from: `${config.smtp.fromName} <${config.smtp.fromEmail}>`,
      to: email,
      subject: '¡Felicidades! Eres un Usuario Favorito en ParkPoint Solutions',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 10px;">¡Felicidades ${name}!</h1>
            <p style="color: #666; text-align: center; font-size: 14px; margin-bottom: 30px;">Has sido seleccionado como <strong style="color: #007bff;">Usuario Favorito</strong> en ParkPoint Solutions</p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Gracias a tu fidelidad y uso frecuente de nuestro parqueo inteligente, hemos decidido otorgarte beneficios especiales:
            </p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">🎉 Beneficios de Usuario Favorito:</h3>
              <ul style="color: #388e3c; line-height: 1.8;">
                <li>💰 <strong>Precio reducido:</strong> Disfruta de un 10% de descuento en todas tus reservas</li>
                <li>⚡ <strong>Prioridad en reservas:</strong> Acceso prioritario durante horas pico</li>
                <li>📧 <strong>Notificaciones exclusivas:</strong> Recibe ofertas especiales y actualizaciones primero</li>
                <li>🏆 <strong>Reconocimiento:</strong> Tu estatus de favorito se mantiene mientras sigas siendo uno de nuestros usuarios más activos</li>
              </ul>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Este estatus se revisa mensualmente basado en tu actividad. ¡Sigue usando nuestro parqueo para mantener tus beneficios!
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href='${config.app.frontendUrl || 'http://localhost:5173'}' style='background-color: #4caf50; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>Reservar Ahora</a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">
              Gracias por ser parte de ParkPoint Solutions. ¡Esperamos verte pronto!
            </p>
          </div>
          
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
            © 2026 ParkPoint Solutions. Todos los derechos reservados.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('sendFavoriteEmail: email sent, messageId=', info.messageId);
  } catch (error) {
    console.error('Error sending favorite email:', error);
    throw error;
  }
};
