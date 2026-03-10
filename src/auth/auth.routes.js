import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

import {
    authRateLimit,
    requestLimit,
} from '../../middlewares/request-limit.js';