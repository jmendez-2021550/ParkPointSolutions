import {
  registerUserHelper,
  loginUserHelper,
  verifyEmailHelper,
  resendVerificationEmailHelper,
  forgotPasswordHelper,
  resetPasswordHelper,
  changePasswordHelper,
} from '../../helpers/auth-operations.js';
import { getUserProfileHelper, updateProfileHelper } from '../../helpers/profile-operations.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const register = asyncHandler(async (req, res) => {
  const userData = {
    ...req.body,
    profilePicture: req.body.profilePicture || null,
  };

  const result = await registerUserHelper(userData);
  return res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const result = await loginUserHelper(emailOrUsername, password);
  return res.status(200).json(result);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await verifyEmailHelper(token);
  return res.status(200).json(result);
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await resendVerificationEmailHelper(email);
  if (!result.success) {
    const status = result.message.includes('no encontrado') ? 404 : 400;
    return res.status(status).json(result);
  }
  return res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await forgotPasswordHelper(email);
  return res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await resetPasswordHelper(token, newPassword);
  return res.status(200).json(result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const data = await getUserProfileHelper(userId);
  return res.status(200).json({ success: true, message: 'Perfil obtenido exitosamente', data });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'El userId es requerido' });
  }
  const data = await getUserProfileHelper(userId);
  return res.status(200).json({ success: true, message: 'Perfil obtenido exitosamente', data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, surname, phone } = req.body;
  const data = await updateProfileHelper(userId, { name, surname, phone });
  return res.status(200).json({ success: true, message: 'Perfil actualizado exitosamente', data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'La contraseña actual y la nueva son requeridas' });
  }
  const result = await changePasswordHelper(userId, currentPassword, newPassword);
  return res.status(200).json(result);
});
