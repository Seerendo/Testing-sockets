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
  id: mongoose.Types.ObjectId,
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

// Almacenar temporalmente a los usuarios
const users = {};

// Formula para calcular la distancia
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
  console.log('Nuevo cliente conectado', socket.id);

  // Guardiar la id del usuario
  socket.on('streamLocation', async (data) => {
    const { userId, latitude, longitude } = data;
    socket.userId = userId;
    await Location.findOneAndUpdate(
      { userId: socket.userId },
      { latitude, longitude, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    const locations = await Location.find({ userId: { $ne: socket.userId } });
    io.emit('locations', locations);
  });

  // Actualizar ubicaciones de los usuarios y emitir a los demas
  socket.on('updateLocation', async (data) => {
    const { userId, latitude, longitude } = data;
    /* const { latitude, longitude } = data;

    console.log(latitude, longitude);

    users[socket.userId].location = { latitude, longitude };

    // Verificar la distancia de los usuarios
    const nearbyUsers = Object.values(users).filter((user) => {
      if (!user.location || user.socketId === socket.id) return false;

      const distance = haversineDistance(
        user.location.latitude,
        user.location.longitude,
        latitude,
        longitude
      );

      // Distancia en metros (2000 -> 2km)
      return distance <= 2000;
    }); */
    console.log('updateLocations');
    const locations = await Location.find({ userId: { $ne: socket.id } });
    console.log(locations);

    // Emitir las locaciones de los usuarios cercanos
    io.emit('locations', locations);
  });

  // Desconectar el usuario y borrar su id
  socket.on('disconnect', async () => {
    await Location.findOneAndDelete({ userId: socket.userId });
    /*  if (socket.userId) {
      delete users[socket.userId];
      io.emit('userDisconnected', { userId: socket.userId });
    } */
    io.emit('userDisconnected', { userId: socket.userId });
    console.log('Cliente desconectado');
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
