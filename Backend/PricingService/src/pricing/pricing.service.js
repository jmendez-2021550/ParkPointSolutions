import { Op } from 'sequelize';
import { ParkingSpot, Reservation } from '../parking/parking.model.js';
import { config } from '../../configs/config.js';
import { isUserFavorite } from '../../helpers/favorites.service.js';

export const calculateOccupancyRate = async (when = new Date()) => {
  const totalSpots = await ParkingSpot.count();
  if (totalSpots === 0) return 0;

  const occupiedSpots = await Reservation.count({
    where: {
      Status: ['reserved', 'active'],
      StartAt: { [Op.lte]: when },
      EndAt: { [Op.gte]: when },
    },
  });

  return occupiedSpots / totalSpots;
};

export const recommendPrice = async (baseCents = 0, startAt = new Date(), userId = null) => {
  const when = startAt ? new Date(startAt) : new Date();
  const rate = await calculateOccupancyRate(when);

  const highMult = config.pricing.highMultiplier;
  const lowMult = config.pricing.lowMultiplier;
  const highThreshold = config.pricing.highThreshold;
  const lowThreshold = config.pricing.lowThreshold;

  let multiplier = 1;
  if (rate >= highThreshold) {
    multiplier = highMult;
  } else if (rate <= lowThreshold) {
    multiplier = lowMult;
  }

  let price = Math.round(baseCents * multiplier);
  if (userId) {
    const favorite = await isUserFavorite(userId);
    if (favorite) {
      price = Math.round(price * 0.9);
    }
  }

  return price;
};
