import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

import {
    authRateLimit,
    requestLimit,
} from '../../middlewares/request-limit.js';

import { upload, handleUploadError } from '../../helpers/file-upload.js';
import {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateResetPassword,
} from '../../middlewares/validation.js';

const router = Router();
/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registra un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con validaciones de seguridad
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: name
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre del usuario
 *       - name: surname
 *         in: formData
 *         required: true
 *         type: string
 *         description: Apellido del usuario
 *       - name: username
 *         in: formData
 *         required: true
 *         type: string
 *         description: Nombre de usuario único
 *       - name: email
 *         in: formData
 *         required: true
 *         type: string
 *         description: Email del usuario
 *       - name: password
 *         in: formData
 *         required: true
 *         type: string
 *         description: Contraseña (mínimo 8 caracteres)
 *       - name: phone
 *         in: formData
 *         required: true
 *         type: string
 *         description: Teléfono (8 dígitos)
 *       - name: profilePicture
 *         in: formData
 *         type: file
 *         description: Imagen de perfil (opcional)
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Errores de validación
 *       409:
 *         description: Email o username ya existe
 */

router.post(
    '/register',
    authRateLimit,
    upload.single('profilePicture'),
    handleUploadError,
    validateRegister,
    authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Autentica un usuario
 *     description: Inicia sesión con email/username y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 description: Email o nombre de usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada
 */