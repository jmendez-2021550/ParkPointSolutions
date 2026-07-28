import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 4002,
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
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ParkPointSolutions',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'SuperSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    issuer: process.env.JWT_ISSUER || 'parkpoint-auth',
    audience: process.env.JWT_AUDIENCE || 'parkpoint-users',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    enableSsl: process.env.SMTP_SECURE === 'true',
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.EMAIL_FROM || 'no-reply@parkpoint.com',
    fromName: process.env.EMAIL_FROM_NAME || 'ParkPoint Solutions',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
  pricing: {
    defaultBasePriceCents: parseInt(process.env.DEFAULT_BASE_PRICE_CENTS, 10) || 500,
    highMultiplier: parseFloat(process.env.PRICING_HIGH_MULTIPLIER) || 1.5,
    lowMultiplier: parseFloat(process.env.PRICING_LOW_MULTIPLIER) || 0.8,
    highThreshold: parseFloat(process.env.PRICING_HIGH_THRESHOLD) || 0.8,
    lowThreshold: parseFloat(process.env.PRICING_LOW_THRESHOLD) || 0.3,
  },
};
