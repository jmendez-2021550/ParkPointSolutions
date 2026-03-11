import dotenv from 'dotenv';
import { initServer } from './configs/app.js';
import { initSocket } from './configs/socket.js';

// Configurar variables de entorno
dotenv.config();

// Manejar errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Inicializar servidor y socket
initServer().then((server) => {
  if (server) {
    initSocket(server);
  }
});
