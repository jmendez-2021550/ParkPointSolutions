import { Router } from 'express';
import { getQuote } from './pricing.controller.js';

const router = Router();

router.get('/quote', getQuote);

export default router;
