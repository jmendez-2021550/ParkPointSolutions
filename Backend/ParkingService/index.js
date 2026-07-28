import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import parkingRoutes from './src/parking/parking.routes.js';
import { dbConnection } from './configs/db.js';
import { dbMongoConnection } from './configs/dbMongo.js';
import { errorHandler, notFound } from './middlewares/server-genericError-handler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/api/v1/parking', parkingRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'Parking Service healthy' });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await dbConnection();
  await dbMongoConnection();
  app.listen(PORT, () => {
    console.log(`Parking Service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Parking Service failed to start:', error);
  process.exit(1);
});
