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