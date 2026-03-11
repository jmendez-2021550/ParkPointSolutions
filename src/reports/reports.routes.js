import { Router } from 'express';
import { sendWeeklyReport } from './reports.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

// sólo superadministrador puede solicitar el envío de reporte semanal
router.post('/send-weekly', validateJWT, sendWeeklyReport);

// ruta de prueba para generar reservas de ejemplo (dev only)
router.post('/seed-demo', validateJWT, async (req, res, next) => {
  try {
    const { seedDemoReservations } = await import('./reports.controller.js');
    await seedDemoReservations(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
