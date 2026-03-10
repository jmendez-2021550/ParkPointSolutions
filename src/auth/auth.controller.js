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