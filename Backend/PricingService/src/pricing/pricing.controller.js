import { recommendPrice, calculateOccupancyRate } from './pricing.service.js';
import { config } from '../../configs/config.js';

export const getQuote = async (req, res, next) => {
  try {
    const { baseCents, startAt, userId } = req.query;

    const base = baseCents
      ? parseInt(baseCents, 10)
      : config.pricing.defaultBasePriceCents;

    const when = startAt ? new Date(startAt) : new Date();

    const [finalPrice, occupancyRate] = await Promise.all([
      recommendPrice(base, when, userId || null),
      calculateOccupancyRate(when),
    ]);

    return res.json({
      baseCents: base,
      finalPriceCents: finalPrice,
      occupancyRate: parseFloat((occupancyRate * 100).toFixed(2)),
      startAt: when.toISOString(),
      userId: userId || null,
    });
  } catch (err) {
    next(err);
  }
};
