/**
 * Sincroniza una reserva de PostgreSQL a MongoDB
 * @param {Reservation} reservation - Objeto de reserva de Sequelize
 */
export const syncReservationToMongo = async (reservation) => {
  try {
    if (!reservation || !reservation.Id) {
      console.warn('Sync: Invalid reservation object');
      return;
    }

    const { MongoReservation } = await import('../src/parking/reservation.mongo.model.js');

    const mongoData = {
      reservationId: reservation.Id,
      userId: reservation.UserId,
      parkingSpotId: reservation.ParkingSpotId,
      startAt: reservation.StartAt,
      endAt: reservation.EndAt,
      priceCents: reservation.PriceCents,
      status: reservation.Status || 'reserved',
      paymentIntentId: reservation.PaymentIntentId,
      syncedFromPostgres: new Date(),
    };

    // Actualizar o crear en MongoDB
    await MongoReservation.findOneAndUpdate(
      { reservationId: reservation.Id },
      mongoData,
      { upsert: true }
    );

    console.log(`✓ Reservation ${reservation.Id} synced to MongoDB`);
  } catch (error) {
    console.warn(`⚠ MongoDB sync failed for ${reservation?.Id}:`, error.message);
    // No lanzamos error para no interrumpir operaciones PostgreSQL
  }
};

/**
 * Actualiza el estado de una reserva en MongoDB
 * @param {string} reservationId
 * @param {string} newStatus
 */
export const updateReservationStatusInMongo = async (reservationId, newStatus) => {
  try {
    const { MongoReservation } = await import('../src/parking/reservation.mongo.model.js');
    
    await MongoReservation.updateOne(
      { reservationId },
      {
        status: newStatus,
        syncedFromPostgres: new Date(),
      }
    );
    console.log(`✓ Reservation ${reservationId} status updated to ${newStatus} in MongoDB`);
  } catch (error) {
    console.warn(`⚠ MongoDB status update failed for ${reservationId}:`, error.message);
  }
};