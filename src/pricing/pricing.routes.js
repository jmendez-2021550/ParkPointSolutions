import { Router } from 'express';
import { quotePrice } from './pricing.controller.js';

const router = Router();

// obtener cotización de precio dinámico
router.get('/quote', quotePrice);

export default router;
