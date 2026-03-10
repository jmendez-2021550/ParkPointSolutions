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

export const createReservation = async (req, res, next) => {
    try {
        const { userId, parkingSpotId, startAt, endAt, priceCents } = req.body;

        // Validar que el espacio existe
        const spot = await ParkingSpot.findByPk(parkingSpotId);
        if (!spot) return res.status(404).json({ error: 'Espacio de estacionamiento no encontrado' });

        // Obtener datos del usuario
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Crear Stripe PaymentIntent
        let paymentIntent = null;
        if (priceCents > 0 && process.env.STRIPE_SECRET_KEY) {
            // Usar GTQ como moneda local
            paymentIntent = await stripe.paymentIntents.create({ amount: priceCents, currency: 'gtq' });
        }

        const reservation = await Reservation.create({
            UserId: userId,
            ParkingSpotId: parkingSpotId,
            StartAt: new Date(startAt),
            EndAt: new Date(endAt),
            PriceCents: priceCents,
            PaymentIntentId: paymentIntent?.id || null,
        });

        // Guardar en MongoDB
        try {
            const { MongoReservation } = await import('./reservation.mongo.model.js');
            await MongoReservation.create({
                reservationId: reservation.Id,
                userId: userId,
                parkingSpotId: parkingSpotId,
                spotCode: spot.Code,
                startAt: new Date(startAt),
                endAt: new Date(endAt),
                priceCents: priceCents,
                status: 'reserved',
                paymentIntentId: paymentIntent?.id || null,
                userName: user.Name,
                userEmail: user.Email,
                userSurname: user.Surname,
            });
            console.log('Reservation synced to MongoDB:', reservation.Id);
        } catch (mongoErr) {
            console.warn('Warning: Failed to sync reservation to MongoDB:', mongoErr.message);
            // No abortamos si MongoDB falla
        }

        res.status(201).json({
            reserva: serializeReservation(reservation),
            secretoCliente: paymentIntent?.client_secret || null,
        });
    } catch (err) {
        next(err);
    }
};

export const getReservations = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const reservations = await Reservation.findAll({
            where: { UserId: userId },
            include: ['User', 'ParkingSpot'],
            order: [['CreatedAt', 'DESC']],
        });
        res.json(serializeReservations(reservations));
    } catch (err) {
        next(err);
    }
};