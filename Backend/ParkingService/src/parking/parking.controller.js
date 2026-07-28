import { ParkingSpot, Reservation } from './parking.model.js';
import { serializeParkingSpot, serializeParkingSpots, serializeReservation, serializeReservations } from '../../helpers/parking-serializer.js';
import { User } from '../users/user.model.js';
import Stripe from 'stripe';
import { sequelize } from '../../configs/db.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export const getSpots = async (req, res, next) => {
  try {
    const spots = await ParkingSpot.findAll({ order: [['Code', 'ASC']] });
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

    const spot = await ParkingSpot.findByPk(parkingSpotId);
    if (!spot) return res.status(404).json({ error: 'Espacio de estacionamiento no encontrado' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let paymentIntent = null;
    if (priceCents > 0 && process.env.STRIPE_SECRET_KEY) {
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

    // Mark the spot as reserved so the map reflects it immediately
    await spot.update({ Status: 'reserved' });

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

export const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id, { include: ['User', 'ParkingSpot'] });
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(serializeReservation(reservation));
  } catch (err) {
    next(err);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id);
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

    await reservation.update({ Status: 'cancelled' });

    // Free the spot back to available
    const spot = await ParkingSpot.findByPk(reservation.ParkingSpotId);
    if (spot) await spot.update({ Status: 'available' });

    try {
      const { updateReservationStatusInMongo } = await import('../../helpers/mongo-sync.js');
      await updateReservationStatusInMongo(reservation.Id, 'cancelled');
    } catch (mongoErr) {
      console.warn('MongoDB sync warning:', mongoErr.message);
    }

    res.json({ mensaje: 'Reserva cancelada', reserva: serializeReservation(reservation) });
  } catch (err) {
    next(err);
  }
};

export const checkoutReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id, { include: ['User', 'ParkingSpot'] });
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });

    const isOwner = req.userId === reservation.UserId;
    const isAdmin = req.userRole === 'ADMIN_ROLE' || req.userRole === 'SUPER_ADMIN_ROLE';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ bufferPages: true, margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      try {
        const { sendInvoiceEmail } = await import('../../helpers/email-service.js');
        const userEmail = reservation.User?.Email;
        const userName = reservation.User?.Name;
        const userSurname = reservation.User?.Surname;

        if (!userEmail) {
          console.error('Checkout: usuario sin email, no se puede enviar factura', reservation.Id);
          await reservation.update({ Status: 'completed' });
          return res.status(200).json({ mensaje: 'Checkout realizado, pero sin código de verificación para email', reserva: serializeReservation(reservation) });
        }

        console.log(`Checkout: enviando factura a ${userEmail} para reserva ${reservation.Id}`);
        await sendInvoiceEmail(userEmail, userName, userSurname, pdfBuffer);
        console.log('Checkout: factura enviada correctamente');

        await reservation.update({ Status: 'completed' });

        // Free the spot back to available
        const spot = await ParkingSpot.findByPk(reservation.ParkingSpotId);
        if (spot) await spot.update({ Status: 'available' });

        try {
          const { MongoReservation } = await import('./reservation.mongo.model.js');
          await MongoReservation.updateOne(
            { reservationId: reservation.Id },
            { status: 'completed', syncedFromPostgres: new Date() }
          );
        } catch (mongoErr) {
          console.warn('MongoDB sync warning:', mongoErr.message);
        }

        res.json({ mensaje: 'Checkout realizado, factura enviada', reserva: serializeReservation(reservation) });
      } catch (emailErr) {
        console.error('Checkout: error al enviar factura por correo:', emailErr);
        await reservation.update({ Status: 'completed' });
        return res.status(200).json({ mensaje: 'Checkout realizado, pero fallo al enviar la factura', error: emailErr.message, reserva: serializeReservation(reservation) });
      }
    });

    const amountGTQ = (reservation.PriceCents / 100).toFixed(2);
    const reservationDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = new Date(reservation.StartAt).toLocaleString('es-ES');
    const endTime = new Date(reservation.EndAt).toLocaleString('es-ES');

    doc.fontSize(24).font('Helvetica-Bold').text('ParkPoint Solutions', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Sistema de Estacionamiento Inteligente', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Avenida Principal, Guatemala | Tel: +502-1234-5678', { align: 'center' });
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#007bff');
    doc.moveDown();

    doc.fontSize(16).font('Helvetica-Bold').text('FACTURA DE RESERVA', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    doc.text(`Número de Factura: ${reservation.Id}`, 40);
    doc.text(`Fecha: ${reservationDate}`);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${reservation.User.Name} ${reservation.User.Surname}`);
    doc.text(`Email: ${reservation.User.Email}`);
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').text('DETALLES DE LA RESERVA');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Espacio de Estacionamiento: ${reservation.ParkingSpot.Code}`);
    doc.text(`Inicio: ${startTime}`);
    doc.text(`Fin: ${endTime}`);
    const horasReservadas = Math.ceil((new Date(reservation.EndAt) - new Date(reservation.StartAt)) / (1000 * 60 * 60));
    doc.text(`Horas Reservadas: ${horasReservadas} horas`);
    doc.moveDown();

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#007bff');
    doc.fontSize(10).font('Helvetica-Bold');
    const priceY = doc.y + 10;
    doc.text('Concepto', 40, priceY);
    doc.text('Cantidad', 350, priceY);
    doc.text('Precio', 450, priceY, { width: 100, align: 'right' });
    doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke('#e0e0e0');
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    doc.text('Estacionamiento', 40);
    doc.text('1', 350);
    doc.text(`Q ${amountGTQ}`, 450, doc.y - 10, { width: 100, align: 'right' });
    doc.moveDown();

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#007bff');
    doc.fontSize(12).font('Helvetica-Bold');
    const totalY = doc.y + 10;
    doc.text('TOTAL', 350, totalY);
    doc.text(`Q ${amountGTQ}`, 450, totalY, { width: 100, align: 'right' });
    doc.moveDown();

    doc.moveTo(40, doc.y + 10).lineTo(555, doc.y + 10).stroke('#007bff');
    doc.moveDown();
    doc.fontSize(9).font('Helvetica').text('Gracias por usar ParkPoint Solutions. Para consultas, contacta a soporte@parkpoint.com', { align: 'center' });
    doc.text('Este documento es valido como comprobante de pago. Favor conservar para su registro.', { align: 'center' });
    doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};

export const getAllReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.findAll({
      include: ['User', 'ParkingSpot'],
      order: [['CreatedAt', 'DESC']],
    });
    res.json(serializeReservations(reservations));
  } catch (err) {
    next(err);
  }
};

export const getOccupancy = async (req, res, next) => {
  try {
    const totalSpots = await ParkingSpot.count();
    const now = new Date();
    const occupiedSpots = await Reservation.count({
      where: {
        Status: ['reserved', 'active'],
        StartAt: { [sequelize.Sequelize.Op.lte]: now },
        EndAt: { [sequelize.Sequelize.Op.gte]: now },
      },
    });

    const availableSpots = totalSpots - occupiedSpots;
    const occupancyRate = totalSpots > 0 ? ((occupiedSpots / totalSpots) * 100).toFixed(2) : '0.00';

    res.json({
      total: totalSpots,
      ocupados: occupiedSpots,
      disponibles: availableSpots,
      porcentajeOcupacion: `${occupancyRate}%`,
    });
  } catch (err) {
    next(err);
  }
};

export const webhookStripe = async (req, res) => {
  res.status(200).send('ok');
};
