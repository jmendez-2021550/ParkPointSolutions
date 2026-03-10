'use strict';

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL (igual que la API .NET)
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  logging: process.env.DB_SQL_LOGGING === 'true' ? console.log : false,
  define: {
    freezeTableName: true, // Usar nombres exactos sin pluralización
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true, // Usar snake_case para todos los campos
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Función para conectar a la base de datos
export const dbConnection = async () => {
  try {
    console.log('PostgreSQL | Trying to connect...');

    await sequelize.authenticate();
    console.log('PostgreSQL | Connected to PostgreSQL');
    console.log('PostgreSQL | Connection to database established');

    // En desarrollo evitamos modificar automáticamente constraints complejas
    // para prevenir errores inesperados al sincronizar esquemas.
    if (process.env.NODE_ENV === 'development') {
      const syncLogging =
        process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
      // Sincroniza automáticamente los cambios en el esquema
      await sequelize.sync({ alter: true, logging: syncLogging });
      console.log('PostgreSQL | Models synced with alter enabled');
    }
  } catch (error) {
    console.error('PostgreSQL | Could not connect to PostgreSQL');
    console.error('PostgreSQL | Error:', error.message);
    // If database doesn't exist, try to create it and retry
    const dbName = process.env.DB_NAME;
    const invalidCatalog =
      error && error.original && error.original.code === '3D000';
    if (invalidCatalog && dbName) {
      console.log(`PostgreSQL | Database ${dbName} not found, attempting to create it...`);
      try {
        const { Client } = await import('pg');
        const adminClient = new Client({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: 'postgres',
        });
        await adminClient.connect();
        const exists = await adminClient.query(
          'SELECT 1 FROM pg_database WHERE datname=$1',
          [dbName]
        );
        if (exists.rowCount === 0) {
          await adminClient.query(`CREATE DATABASE "${dbName}"`);
          console.log(`PostgreSQL | Created database ${dbName}`);
        } else {
          console.log(`PostgreSQL | Database ${dbName} already exists (race?)`);
        }
        await adminClient.end();

        // Retry original connect and sync
        const syncLogging = process.env.DB_SQL_LOGGING === 'true' ? console.log : false;
        await sequelize.authenticate();
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ alter: true, logging: syncLogging });
          console.log('PostgreSQL | Models synced with alter enabled');
        }
        return;
      } catch (createErr) {
        console.error('PostgreSQL | Could not create database:', createErr.message);
        console.error(createErr.stack);
        process.exit(1);
      }
    }

    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(
    `PostgreSQL | Received ${signal}. Closing database connection...`
  );
  try {
    await sequelize.close();
    console.log('PostgreSQL | Database connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error(
      'PostgreSQL | Error during graceful shutdown:',
      error.message
    );
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restarts
