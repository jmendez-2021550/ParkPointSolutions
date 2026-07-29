import express from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import {
  getSpots,
  getSpotById,
  createSpot,
  updateSpotStatus,
  deleteSpot,
  createReservation,
  getReservations,
  getAllReservations,
  getReservationById,
  cancelReservation,
  checkoutReservation,
  getOccupancy,
} from './parking.controller.js';
import { applyDynamicPrice } from '../pricing/pricing.controller.js';

const router = express.Router();

// Analytics (before /:id to avoid route conflict)
router.get('/analytics/occupancy', getOccupancy);

// Reservations (before /:id to avoid route conflict)
router.get('/reservations', validateJWT, getAllReservations);
router.post('/reservations', validateJWT, applyDynamicPrice, createReservation);
router.get('/reservations/:id', validateJWT, getReservationById);
router.delete('/reservations/:id/cancel', validateJWT, cancelReservation);
router.post('/reservations/:id/checkout', validateJWT, checkoutReservation);
router.get('/user/:userId', validateJWT, getReservations);

// Parking Spots (/:id must come last)
router.get('/', getSpots);
router.post('/', validateJWT, createSpot);
router.get('/:id', getSpotById);
router.put('/:id/status', updateSpotStatus);
router.delete('/:id', validateJWT, deleteSpot);

export default router;
