import { recommendPrice, getQuote } from './pricing.service.js';

export const quotePrice = async (req, res, next) => {
  try {
    const result = await getQuote(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// middleware to apply dynamic price when creating a reservation
export const applyDynamicPrice = async (req, res, next) => {
  try {
    const { priceCents, startAt } = req.body;
    if (!priceCents || priceCents === 0) {
      // compute recommendation using default base price or 0 from config
      const { config } = await import('../../configs/config.js');
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
