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
    // Acepta MONGODB_URI (nombre estandar) o URI_MONGO (nombre usado en el README).
    uri:
      process.env.MONGODB_URI ||
      process.env.URI_MONGO ||
      'mongodb://localhost:27017/Parqueo_Inteligente',
    dbName: process.env.MONGODB_DB_NAME || 'Parqueo_Inteligente',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'SuperSecretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    issuer: process.env.JWT_ISSUER || 'parkpoint-auth',
    audience: process.env.JWT_AUDIENCE || 'parkpoint-users',
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    fromEmail: process.env.BREVO_FROM_EMAIL || 'miguelhillofuentes223@gmail.com',
    fromName: process.env.BREVO_FROM_NAME || 'ParkPoint',
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
