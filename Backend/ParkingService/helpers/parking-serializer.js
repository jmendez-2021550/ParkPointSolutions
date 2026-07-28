const translateStatus = (status) => {
  const translations = {
    available: 'disponible',
    occupied: 'ocupado',
    reserved: 'reservado',
    maintenance: 'mantenimiento',
    active: 'activo',
    cancelled: 'cancelado',
  };
  return translations[status?.toLowerCase()] || status;
};

export const serializeParkingSpot = (spot) => {
  if (!spot) return null;
  const data = spot.toJSON ? spot.toJSON() : spot;
  return {
    id: data.Id || data.id,
    codigo: data.Code || data.code,
    nivel: data.Level || data.level,
    estado: translateStatus(data.Status || data.status),
    tipoSensor: data.SensorType || data.sensor_type,
    ultimaVez: data.LastSeenAt || data.last_seen_at,
    creadoEn: data.CreatedAt || data.created_at,
    actualizadoEn: data.UpdatedAt || data.updated_at,
  };
};

export const serializeParkingSpots = (spots) => spots.map(serializeParkingSpot);

export const serializeReservation = (reservation) => {
  if (!reservation) return null;
  const data = reservation.toJSON ? reservation.toJSON() : reservation;
  return {
    id: data.Id || data.id,
    usuarioId: data.UserId || data.user_id,
    espacioId: data.ParkingSpotId || data.parking_spot_id,
    inicioReserva: data.StartAt || data.start_at,
    finReserva: data.EndAt || data.end_at,
    estado: translateStatus(data.Status || data.status),
    precioCentavos: data.PriceCents || data.price_cents,
    idPagamentoStripe: data.PaymentIntentId || data.payment_intent_id,
    creadoEn: data.CreatedAt || data.created_at,
    actualizadoEn: data.UpdatedAt || data.updated_at,
    usuario: data.User ? serializeUsuario(data.User) : undefined,
    espacio: data.ParkingSpot ? serializeParkingSpot(data.ParkingSpot) : undefined,
  };
};

export const serializeReservations = (reservations) => reservations.map(serializeReservation);

export const serializeUsuario = (user) => {
  if (!user) return null;
  const data = user.toJSON ? user.toJSON() : user;
  return {
    id: data.Id || data.id,
    nombre: data.Name || data.name,
    apellido: data.Surname || data.surname,
    nombreUsuario: data.Username || data.username,
    email: data.Email || data.email,
  };
};
