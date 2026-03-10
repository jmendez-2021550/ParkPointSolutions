import {
    registerUserHelper,
    loginUserHelper,
    verifyEmailHelper,
    resendVerificationEmailHelper,
    forgotPasswordHelper,
    resetPasswordHelper,
} from '../../helpers/auth-operations.js';

import { getUserProfileHelper } from '../../helpers/profile-operations.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const register = asyncHandler(async (req, res) => {
    try {
        const userData = {
            ...req.body,
            profilePicture: req.file ? req.file.path : null,
        };

        const result = await registerUserHelper(userData);
        res.status(201).json(result);

    } catch (error) {
        console.error('Error in register controller:', error);

        let statusCode = 400;
        if (
            error.message.includes('ya está registrado') ||
            error.message.includes('ya está en uso') ||
            error.message.includes('Ya existe un usuario')
        ) {
            statusCode = 409;
        }
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Error en el registro',
            error: error.message,
        });
    }
});

export const login = asyncHandler(async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;