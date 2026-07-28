export const syncReservationToMongo = async (reservation) => {
  try {
    if (!reservation || !reservation.Id) {
      console.warn('syncReservationToMongo: invalid reservation payload');
      return;
    }

    const { MongoReservation } = await import('../src/parking/reservation.mongo.model.js');
    await MongoReservation.findOneAndUpdate(
      { reservationId: reservation.Id },
      {
        reservationId: reservation.Id,
        userId: reservation.UserId,
        parkingSpotId: reservation.ParkingSpotId,
        spotCode: reservation.ParkingSpot?.Code || null,
        startAt: reservation.StartAt,
        endAt: reservation.EndAt,
        priceCents: reservation.PriceCents,
        status: reservation.Status || 'reserved',
        paymentIntentId: reservation.PaymentIntentId,
        userName: reservation.User?.Name,
        userEmail: reservation.User?.Email,
        userSurname: reservation.User?.Surname,
        syncedFromPostgres: new Date(),
      },
      { upsert: true }
    );
  } catch (error) {
    console.warn('syncReservationToMongo failed:', error.message);
  }
};

export const updateReservationStatusInMongo = async (reservationId, newStatus) => {
  try {
    const { MongoReservation } = await import('../src/parking/reservation.mongo.model.js');
    await MongoReservation.updateOne(
      { reservationId },
      { status: newStatus, syncedFromPostgres: new Date() }
    );
  } catch (error) {
    console.warn('updateReservationStatusInMongo failed:', error.message);
  }
};
