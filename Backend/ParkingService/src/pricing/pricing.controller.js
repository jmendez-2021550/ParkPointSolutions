import { recommendPrice } from './pricing.service.js';
import { config } from '../../configs/config.js';

export const applyDynamicPrice = async (req, res, next) => {
  try {
    const { priceCents, startAt } = req.body;
    if (!priceCents || priceCents === 0) {
      const base = config.pricing.defaultBasePriceCents || 0;
      const recommended = await recommendPrice(base, startAt, req.userId);
      req.body.priceCents = recommended;
      console.log('Pricing: applied dynamic price', recommended, 'for user', req.userId);
    }
    next();
  } catch (err) {
    next(err);
  }
};
