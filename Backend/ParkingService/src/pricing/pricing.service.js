import { Reservation, ParkingSpot } from '../parking/parking.model.js';
import { sequelize } from '../../configs/db.js';
import { config } from '../../configs/config.js';
import { isUserFavorite } from '../../helpers/favorites.service.js';

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

export const recommendPrice = async (baseCents = 0, startAt = new Date(), userId = null) => {
  const when = startAt ? new Date(startAt) : new Date();
  const rate = await calculateOccupancyRate(when);

  const highMult = config.pricing.highMultiplier || 1.5;
  const lowMult = config.pricing.lowMultiplier || 0.8;
  const highThreshold = config.pricing.highThreshold || 0.8;
  const lowThreshold = config.pricing.lowThreshold || 0.3;

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
