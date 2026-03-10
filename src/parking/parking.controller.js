import { ParkingSpot, Reservation } from './parking.model.js';
import { serializeParkingSpot, serializeParkingSpots, serializeReservation, serializeReservations } from '../../helpers/parking-serializer.js';
import { User } from '../users/user.model.js';
import Stripe from 'stripe';
import { sequelize } from '../../configs/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export const getSpots = async (req, res, next) => {
    try {
        const spots = await ParkingSpot.findAll({
            order: [['Code', 'ASC']],
        });
        res.json(serializeParkingSpots(spots));
    } catch (err) {
        next(err);
    }
};

export const getSpotById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const spot = await ParkingSpot.findByPk(id, { include: ['Reservations'] });
        if (!spot) return res.status(404).json({ error: 'Espacio no encontrado' });
        res.json(serializeParkingSpot(spot));
    } catch (err) {
        next(err);
    }
};

export const updateSpotStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, sensorType } = req.body;
        const spot = await ParkingSpot.findByPk(id);
        if (!spot) return res.status(404).json({ error: 'Espacio no encontrado' });

        await spot.update({ Status: status, SensorType: sensorType || spot.SensorType, LastSeenAt: new Date() });
        res.json(serializeParkingSpot(spot));
    } catch (err) {
        next(err);
    }
};