import { Server } from 'socket.io';

export const initSocket = (server) => {
  const io = new Server(server, { cors: { origin: true, methods: ['GET', 'POST'] } });
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('spot:update', (data) => {
      // Broadcast spot updates to all clients
      io.emit('spot:changed', data);
    });
  });
  return io;
};
