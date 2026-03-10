import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
    {
        reservationId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        parkingSpotId: {
            type: Number,
        },
        spotCode: {
            type: String,
        },
        startAt: {
            type: Date,
            required: true,
        },
        endAt: {
            type: Date,
            required: true,
        },
        priceCents: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['reserved', 'active', 'completed', 'cancelled'],
            default: 'reserved',
        },
        paymentIntentId: {
            type: String,
        },
        userName: String,
        userEmail: String,
        userSurname: String,
        syncedFromPostgres: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Índices para búsquedas rápidas
reservationSchema.index({ userId: 1, createdAt: -1 });
reservationSchema.index({ spotCode: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ startAt: 1, endAt: 1 });

export const MongoReservation = mongoose.model('Reservation', reservationSchema);
