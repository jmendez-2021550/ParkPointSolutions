import { Reservation, ParkingSpot } from '../parking/parking.model.js';
import { sequelize } from '../../configs/db.js';
import { isUserFavorite } from '../favorites/favorites.service.js';

/**
 * Calcula la tasa de ocupación en el momento especificado (o ahora).
 * @param {Date} when
 * @returns {Promise<number>} ratio entre 0 y 1
 */
export const calculateOccupancyRate = async (when = new Date()) => {
  const totalSpots = await ParkingSpot.count();
  if (totalSpots === 0) return 0;

  const occupiedSpots = await Reservation.count({
    where: {
      Status: ['reserved', 'active'],
      StartAt: { [sequelize.Sequelize.Op.lte]: when },
      EndAt: { [sequelize.Sequelize.Op.gte]: when },
    },
  });

  return occupiedSpots / totalSpots;
};

/**
 * Genera un precio dinámico a partir de un precio base y un horario de inicio.
 * Se basa en reglas sencillas: más caro si ocupación alta, más barato si casi vacío.
 * Los multiplicadores pueden ajustarse mediante variables de entorno.
 * @param {number} baseCents Precio base en centavos
 * @param {Date|string} startAt fecha/hora de la reserva
 * @param {string} userId ID del usuario para aplicar descuento de favorito
 * @returns {Promise<number>} precio recomendado en centavos
 */
export const recommendPrice = async (baseCents = 0, startAt = new Date(), userId = null) => {
  const when = startAt ? new Date(startAt) : new Date();
  const rate = await calculateOccupancyRate(when);

  // read thresholds/multipliers from central config for easier overrides
  const { pricing } = await import('../../configs/config.js');
  const highMult = pricing.highMultiplier || 1.5;
  const lowMult = pricing.lowMultiplier || 0.8;
  const highThreshold = pricing.highThreshold || 0.8;
  const lowThreshold = pricing.lowThreshold || 0.3;

  let multiplier = 1;
  if (rate >= highThreshold) {
    multiplier = highMult;
  } else if (rate <= lowThreshold) {
    multiplier = lowMult;
  }

  let price = Math.round(baseCents * multiplier);

  // Aplicar descuento de favorito (10% off)
  if (userId) {
    const isFavorite = await isUserFavorite(userId);
    if (isFavorite) {
      price = Math.round(price * 0.9); // 10% descuento
    }
  }

  return price;
};

/**
 * Endpoint helper: recomienda un precio basándose en parámetros de consulta.
 * @param {object} query baseCents, startAt, userId
 */
export const getQuote = async (query) => {
  const { config } = await import('../../configs/config.js');
  const baseCentsParam = parseInt(query.baseCents || '0', 10);
  const base = baseCentsParam || config.pricing.defaultBasePriceCents || 0;
  const start = query.startAt ? new Date(query.startAt) : new Date();
  const userId = query.userId;
  return {
    baseCents: base,
    recommended: await recommendPrice(base, start, userId),
    occupancyRate: await calculateOccupancyRate(start),
  };
};