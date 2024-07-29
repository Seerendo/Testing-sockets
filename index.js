require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('node:http');
const socketIO = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const httpServer = http.createServer(app);
const io = socketIO(httpServer, {
  cors: {
    origin: '*', // Permitir todas las conexiones
    methods: ['GET', 'POST'],
  },
});

const users = {};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  console.log(lat1);
  console.log(lat2);
  console.log(lon1);
  console.log(lon2);
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distancia = R * c; // Distancia en metros
  console.log(distancia);
  return distancia;
};

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado', socket.id);

  socket.on('identify', (userId) => {
    console.log(userId);
    socket.userId = userId;
    users[userId] = { userId: userId, socketId: socket.id, location: null };
  });

  socket.on('updateLocation', async (data) => {
    const { userId, latitude, longitude } = data;

    users[socket.userId].location = { latitude, longitude };

    const nearbyUsers = Object.values(users).filter((user) => {
      if (!user.location || user.socketId === socket.id) return false;

      const distance = haversineDistance(
        user.location.latitude,
        user.location.longitude,
        latitude,
        longitude
      );

      return distance <= 2000;
    });

    io.emit('locations', nearbyUsers);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete users[socket.userId];
      io.emit('userDisconnected', { userId: socket.userId });
    }
    console.log('Cliente desconectado');
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
