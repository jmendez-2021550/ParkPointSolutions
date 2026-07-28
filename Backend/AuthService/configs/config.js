import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  upload: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'parkpoint',
    defaultAvatarPath: process.env.CLOUDINARY_DEFAULT_AVATAR || 'avatars/default.png',
  },
  security: {
    passwordMinLength: 8,
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'parkpoint_auth',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: process.env.DB_SQL_LOGGING === 'true',
  },
};
