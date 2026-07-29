import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 4005,
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
};
