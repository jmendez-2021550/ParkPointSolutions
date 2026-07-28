import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import favoritesRoutes from './src/favorites/favorites.routes.js';
import { dbConnection } from './configs/db.js';
import { errorHandler, notFound } from './middlewares/server-genericError-handler.js';
import { config } from './configs/config.js';

dotenv.config();

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

app.use('/api/v1/favorites', favoritesRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'Favorites Service healthy' });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await dbConnection();
  app.listen(PORT, () => {
    console.log(`Favorites Service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Favorites Service failed to start:', error);
  process.exit(1);
});
