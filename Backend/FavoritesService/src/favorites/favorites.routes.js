import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { processFavoritesHandler } from './favorites.controller.js';

const router = Router();

router.post('/process', validateJWT, processFavoritesHandler);

export default router;
