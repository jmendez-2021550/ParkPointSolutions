import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { sendWeeklyReport, seedDemoReservations, getReportsSummary } from './reports.controller.js';

const router = Router();

router.get('/admin/summary', validateJWT, getReportsSummary);
router.post('/send-weekly', validateJWT, sendWeeklyReport);
router.post('/send-email', validateJWT, sendWeeklyReport);
router.post('/seed-demo', validateJWT, seedDemoReservations);

export default router;
