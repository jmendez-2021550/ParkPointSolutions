'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { dbConnection as dbMongoConnection } from './dbMongo.js';
// Ensure models are registered before DB sync
import '../src/users/user.model.js';
import '../src/auth/role.model.js';
import '../src/parking/parking.model.js';
import '../src/favorites/favorites.model.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import {
  errorHandler,
  notFound,
} from '../middlewares/server-genericError-handler.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(cors(corsOptions));
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = async (app) => {
  app.use(`${BASE_PATH}/auth`, authRoutes);
  app.use(`${BASE_PATH}/users`, userRoutes);
  // Parking module
  const parkingRoutes = (await import('../src/parking/parking.routes.js')).default;
  app.use(`${BASE_PATH}/parking`, parkingRoutes);
  // pricing helper
  const pricingRoutes = (await import('../src/pricing/pricing.routes.js')).default;
  app.use(`${BASE_PATH}/pricing`, pricingRoutes);

  // reportes (sólo super administrador puede dispararlos)
  const reportsRoutes = (await import('../src/reports/reports.routes.js')).default;
  app.use(`${BASE_PATH}/reports`, reportsRoutes);

  // favorites
  const favoritesRoutes = (await import('../src/favorites/favorites.routes.js')).default;
  app.use(`${BASE_PATH}/favorites`, favoritesRoutes);

  app.get(`${BASE_PATH}/health`, (req, res) => {
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      service: 'Parqueo Inteligente - Auth Service',
    });
  });
  // 404 handler (standardized)
  app.use(notFound);
};

export const initServer = async () => {
  const app = express();
  const PORT = process.env.PORT;
  app.set('trust proxy', 1);

  try {
    // Conectar PostgreSQL
    await dbConnection();
    console.log('✅ PostgreSQL connected successfully');

    // Conectar MongoDB
    await dbMongoConnection();
    console.log('✅ MongoDB connected successfully');

    // Seed essential data (roles)
    const { seedRoles } = await import('../helpers/role-seed.js');
    await seedRoles();

    // Seed parking spots
    const { seedParkingSpots } = await import('../helpers/parking-seed.js');
    await seedParkingSpots();



    middlewares(app);
    await routes(app);

    app.use(errorHandler);

    const server = app.listen(PORT, () => {
      console.log(`Parqueo Inteligente API Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
    });
    return server;
  } catch (err) {
    console.error(`Error starting Parqueo Inteligente API Server: ${err.message}`);
    process.exit(1);
  }
};