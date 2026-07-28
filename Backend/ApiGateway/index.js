import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// No body parsing here — gateway is a transparent proxy.
// Parsing the body would consume the stream and break http-proxy-middleware.
app.use(cors());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const proxyOptions = {
  changeOrigin: true,
  secure: false,
  xfwd: true,
};

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const parkingServiceUrl = process.env.PARKING_SERVICE_URL || 'http://localhost:4002';
const pricingServiceUrl = process.env.PRICING_SERVICE_URL || 'http://localhost:4003';
const favoritesServiceUrl = process.env.FAVORITES_SERVICE_URL || 'http://localhost:4004';
const reportsServiceUrl = process.env.REPORTS_SERVICE_URL || 'http://localhost:4005';

app.use('/api/v1/auth', createProxyMiddleware({ target: authServiceUrl, ...proxyOptions }));
app.use('/api/v1/users', createProxyMiddleware({ target: authServiceUrl, ...proxyOptions }));
app.use('/api/v1/parking', createProxyMiddleware({ target: parkingServiceUrl, ...proxyOptions }));
app.use('/api/v1/pricing', createProxyMiddleware({ target: pricingServiceUrl, ...proxyOptions }));
app.use('/api/v1/favorites', createProxyMiddleware({ target: favoritesServiceUrl, ...proxyOptions }));
app.use('/api/v1/reports', createProxyMiddleware({ target: reportsServiceUrl, ...proxyOptions }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway healthy' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxy auth > ${authServiceUrl}`);
  console.log(`Proxy parking > ${parkingServiceUrl}`);
  console.log(`Proxy pricing > ${pricingServiceUrl}`);
  console.log(`Proxy favorites > ${favoritesServiceUrl}`);
  console.log(`Proxy reports > ${reportsServiceUrl}`);
});
