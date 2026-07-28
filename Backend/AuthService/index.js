import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './src/auth/auth.routes.js';
import userRoutes from './src/users/user.routes.js';
import { dbConnection } from './configs/db.js';
import { errorHandler, notFound } from './middlewares/server-genericError-handler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'Auth Service healthy' });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await dbConnection();
  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Auth Service failed to start:', error);
  process.exit(1);
});
