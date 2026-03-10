import express from 'express';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import {
    getSpots,
    getSpotById,
    updateSpotStatus,
    createReservation,
    getReservations,
    getReservationById,
    cancelReservation,
    getOccupancy,
} from './parking.controller.js';

const router = express.Router();

// Parking Spots endpoints
router.get('/', getSpots);
router.get('/:id', getSpotById);
router.put('/:id/status', updateSpotStatus);

// Reservations endpoints
import { applyDynamicPrice } from '../pricing/pricing.controller.js';
router.post('/reservations', validateJWT, applyDynamicPrice, createReservation);
router.get('/user/:userId', validateJWT, getReservations);
router.get('/reservations/:id', validateJWT, getReservationById);
router.delete('/reservations/:id/cancel', validateJWT, cancelReservation);

// factura / checkout: actualizar estado y enviar PDF al usuario
import { checkoutReservation } from './parking.controller.js';
router.post('/reservations/:id/checkout', validateJWT, checkoutReservation);

// Analytics endpoints
router.get('/analytics/occupancy', getOccupancy);

export default router;
