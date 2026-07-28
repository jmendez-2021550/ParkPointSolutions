import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    parking: process.env.PARKING_SERVICE_URL || 'http://localhost:4002',
    pricing: process.env.PRICING_SERVICE_URL || 'http://localhost:4003',
    favorites: process.env.FAVORITES_SERVICE_URL || 'http://localhost:4004',
    reports: process.env.REPORTS_SERVICE_URL || 'http://localhost:4005',
  },
};
