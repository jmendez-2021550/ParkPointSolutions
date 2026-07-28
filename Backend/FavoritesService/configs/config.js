import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 4004,
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
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    enableSsl: process.env.SMTP_SECURE === 'true',
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.EMAIL_FROM || 'no-reply@parkpoint.com',
    fromName: process.env.EMAIL_FROM_NAME || 'ParkPoint Solutions',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
};
