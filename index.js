require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('node:http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const mongoURI =
  'mongodb+srv://roannamo:Roannamo123_@clusteruser.odhhlrs.mongodb.net/';
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'shorturl',
  })
  .then(() => {
    console.log('Conectado a MongoDB');
  })
  .catch((err) => {
    console.error('Error al conectar a MongoDB', err);
  });

const locationSchema = new mongoose.Schema({
  userId: String,
  latitude: Number,
  longitude: Number,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Location = mongoose.model('Location', locationSchema);

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

const haversineDistance = (lat1, lon1, lat2, lon2) => {
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
  return distancia;
};

io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('listenLocations', async (data) => {
    const { userId, latitude, longitude } = data;
    socket.userId = userId;
    await Location.findOneAndUpdate(
      { userId: socket.userId },
      { latitude, longitude, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
  });

  socket.on('emitLocations', async (data) => {
    const { userId, latitude, longitude } = data;
    console.log(latitude, latitude);
    const locations = await Location.find({ userId: { $ne: userId } });
    const nearbyUsers = locations.filter((location) => {
      if (!location.latitude || !location.longitude) return false;

      const distance = haversineDistance(
        location.latitude,
        location.longitude,
        latitude,
        longitude
      );

      // Distancia en metros (2000 -> 2km)
      return distance <= 2000;
    });
    console.log(nearbyUsers);
    io.emit('locations', nearbyUsers);
  });

  socket.on('disconnect', async () => {
    await Location.findOneAndDelete({ userId: socket.userId });
    io.emit('userDisconnected', { userId: socket.userId });
    console.log('Cliente desconectado');
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
