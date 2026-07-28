import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import reportsRoutes from './src/reports/reports.routes.js';
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

app.use('/api/v1/reports', reportsRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'Reports Service healthy' });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await dbConnection();
  app.listen(PORT, () => {
    console.log(`Reports Service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Reports Service failed to start:', error);
  process.exit(1);
});
