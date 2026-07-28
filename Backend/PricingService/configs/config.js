import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 4003,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'parkpoint',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: process.env.DB_SQL_LOGGING === 'true',
  },
  pricing: {
    defaultBasePriceCents: parseInt(process.env.DEFAULT_BASE_PRICE_CENTS, 10) || 500,
    highMultiplier: parseFloat(process.env.PRICING_HIGH_MULTIPLIER) || 1.5,
    lowMultiplier: parseFloat(process.env.PRICING_LOW_MULTIPLIER) || 0.8,
    highThreshold: parseFloat(process.env.PRICING_HIGH_THRESHOLD) || 0.8,
    lowThreshold: parseFloat(process.env.PRICING_LOW_THRESHOLD) || 0.3,
  },
};
