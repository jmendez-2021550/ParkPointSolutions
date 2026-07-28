import crypto from 'crypto';
import path from 'path';
import { checkUserExists, createNewUser, findUserByEmailOrUsername, updateEmailVerificationToken, markEmailAsVerified, findUserByEmail, updatePasswordResetToken, updateUserPassword, findUserByEmailVerificationToken, findUserByPasswordResetToken, findUserById } from './user-db.js';
import { generateEmailVerificationToken, generatePasswordResetToken } from '../utils/auth-helpers.js';
import { hashPassword, verifyPassword } from '../utils/password-utils.js';
import { buildUserResponse } from '../utils/user-helpers.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './email-service.js';
import { generateJWT } from './generate-jwt.js';
import { uploadImage } from './cloudinary-service.js';
import { config } from '../configs/config.js';
import { setUserSingleRole } from './role-db.js';
import { SUPER_ADMIN_ROLE, DEFAULT_SUPER_ADMIN_EMAIL, USER_ROLE } from './role-constants.js';

const getExpirationTime = (timeString) => {
  const timeValue = parseInt(timeString, 10);
  const timeUnit = timeString.replace(timeValue.toString(), '');
  switch (timeUnit) {
    case 's':
      return timeValue * 1000;
    case 'm':
      return timeValue * 60 * 1000;
    case 'h':
      return timeValue * 60 * 60 * 1000;
    case 'd':
      return timeValue * 24 * 60 * 60 * 1000;
    default:
      return 30 * 60 * 1000;
  }
};

export const registerUserHelper = async (userData) => {
  const { email, username, password, name, surname, phone, profilePicture } = userData;

  const userExists = await checkUserExists(email, username);
  if (userExists) {
    const err = new Error('Ya existe un usuario con este email o nombre de usuario');
    err.status = 409;
    throw err;
  }

  let profilePictureToStore = profilePicture;
  if (profilePicture) {
    const uploadPath = config.upload.uploadPath;
    const isLocalFile = profilePicture.includes('uploads') || profilePicture.includes(uploadPath) || profilePicture.startsWith('./');
    if (isLocalFile) {
      let normalizedPath = profilePicture.replace(/\\/g, '/');
      if (!path.isAbsolute(normalizedPath)) {
        normalizedPath = path.resolve(normalizedPath).replace(/\\/g, '/');
      }
      const ext = path.extname(normalizedPath);
      const randomHex = crypto.randomBytes(6).toString('hex');
      const cloudinaryFileName = `profile-${randomHex}${ext}`;
      profilePictureToStore = await uploadImage(normalizedPath, cloudinaryFileName);
    } else if (!profilePicture.startsWith('https://res.cloudinary.com/') && !profilePicture.startsWith('http://res.cloudinary.com/')) {
      profilePictureToStore = null;
    }
  }

  const newUser = await createNewUser({ name, surname, username, email, password, phone, profilePicture: profilePictureToStore });

  const roleToAssign = email.toLowerCase() === DEFAULT_SUPER_ADMIN_EMAIL.toLowerCase() ? SUPER_ADMIN_ROLE : USER_ROLE;
  await setUserSingleRole(newUser, roleToAssign);

  const verificationToken = await generateEmailVerificationToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateEmailVerificationToken(newUser.Id, verificationToken, tokenExpiry);

  Promise.resolve().then(() => sendVerificationEmail(email, name, verificationToken)).catch((err) => console.error('Async email send failed:', err));

  return {
    success: true,
    user: buildUserResponse(newUser),
    message: 'Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.',
    emailVerificationRequired: true,
  };
};

export const loginUserHelper = async (emailOrUsername, password) => {
  const user = await findUserByEmailOrUsername(emailOrUsername);
  if (!user) {
    const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
  }

  const isValidPassword = await verifyPassword(user.Password, password);
  if (!isValidPassword) {
    const err = new Error('Credenciales inválidas'); err.status = 401; throw err;
  }

  if (process.env.NODE_ENV !== 'development') {
    if (!user.UserEmail?.EmailVerified) {
      throw new Error('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada o reenvía el email de verificación.');
    }
    if (!user.Status) {
      throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
    }
  }

  const role = user.UserRoles?.[0]?.Role?.Name || 'USER_ROLE';
  const token = await generateJWT(user.Id.toString(), { role });
  const expiresInMs = getExpirationTime(process.env.JWT_EXPIRES_IN || '30m');
  const expiresAt = new Date(Date.now() + expiresInMs);
  const fullUser = buildUserResponse(user);
  const userDetails = { id: fullUser.id, username: fullUser.username, profilePicture: fullUser.profilePicture, role: fullUser.role };

  return { success: true, message: `¡Bienvenido ${user.Name}!`, token, userDetails, expiresAt };
};

export const verifyEmailHelper = async (token) => {
  if (!token || typeof token !== 'string' || token.length < 40) {
    throw new Error('Token inválido para verificación de email');
  }

  const user = await findUserByEmailVerificationToken(token);
  if (!user) {
    throw new Error('Usuario no encontrado o token inválido');
  }

  if (!user.UserEmail || user.UserEmail.EmailVerified) {
    throw new Error('El email ya ha sido verificado');
  }

  await markEmailAsVerified(user.Id);
  Promise.resolve().then(() => sendWelcomeEmail(user.Email, user.Name)).catch((err) => console.error('Async email send (welcome) failed:', err));

  return { success: true, message: 'Email verificado exitosamente. Ya puedes iniciar sesión.', data: { email: user.Email, verified: true } };
};

export const resendVerificationEmailHelper = async (email) => {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return { success: false, message: 'Usuario no encontrado', data: { email, sent: false } };
  }
  if (user.UserEmail?.EmailVerified) {
    return { success: false, message: 'El email ya ha sido verificado', data: { email: user.Email, verified: true } };
  }

  const verificationToken = await generateEmailVerificationToken();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateEmailVerificationToken(user.Id, verificationToken, tokenExpiry);

  try {
    await sendVerificationEmail(user.Email, user.Name, verificationToken);
    return { success: true, message: 'Email de verificación enviado exitosamente', data: { email: user.Email, sent: true } };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Error al enviar el email de verificación. Por favor, intenta nuevamente más tarde.', data: { email: user.Email, sent: false } };
  }
};

export const forgotPasswordHelper = async (email) => {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    return { success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación', data: { email, initiated: true } };
  }
  const resetToken = await generatePasswordResetToken();
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await updatePasswordResetToken(user.Id, resetToken, tokenExpiry);
  Promise.resolve().then(() => sendPasswordResetEmail(user.Email, user.Name, resetToken)).catch((emailError) => console.error('Error sending password reset email:', emailError));
  return { success: true, message: 'Si el email existe, se ha enviado un enlace de recuperación', data: { email, initiated: true } };
};

export const resetPasswordHelper = async (token, newPassword) => {
  if (!token || typeof token !== 'string' || token.length < 40) {
    throw new Error('Token inválido para reset de contraseña');
  }
  const user = await findUserByPasswordResetToken(token);
  if (!user) {
    throw new Error('Usuario no encontrado o token inválido');
  }
  const hashedPassword = await hashPassword(newPassword);
  await updateUserPassword(user.Id, hashedPassword);
  Promise.resolve().then(() => sendPasswordResetEmail(user.Email, user.Name, token)).catch((emailErr) => console.error('Error sending password changed email:', emailErr));
  return { success: true, message: 'Contraseña actualizada exitosamente', data: { email: user.Email, reset: true } };
};

export const getUserProfileHelper = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return buildUserResponse(user);
};
