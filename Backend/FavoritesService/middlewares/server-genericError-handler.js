import { randomUUID } from 'crypto';

export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);
  const traceId = err.traceId || randomUUID();
  const timestamp = new Date().toISOString();
  const errorCode = err.errorCode || null;

  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message || 'Error del servidor', errorCode, traceId, timestamp });
  }

  return res.status(500).json({ success: false, message: 'Error interno del servidor', errorCode, traceId, timestamp });
};

export const notFound = (req, res) => {
  const traceId = randomUUID();
  const timestamp = new Date().toISOString();
  res.status(404).json({ success: false, message: `Ruta ${req.originalUrl} no encontrada`, errorCode: null, traceId, timestamp });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
