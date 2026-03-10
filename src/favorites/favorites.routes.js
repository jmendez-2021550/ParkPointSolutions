import { Router } from 'express';
import { processFavoritesHandler } from './favorites.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

// Ruta para procesar favoritos (solo admin o super-admin)
router.post('/process', validateJWT, processFavoritesHandler);

export default router;