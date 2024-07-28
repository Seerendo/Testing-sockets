require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('node:http');
const mongoose = require('mongoose');

const socketIO = require('socket.io');

/* const mongoURI =
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
  userLocation: String,
  latitude: Number,
  longitude: Number,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Location = mongoose.model('Location', locationSchema); */

const app = express();
app.use(cors());
app.use(morgan('dev'));

const httpServer = http.createServer(app);
const io = socketIO(httpServer);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('updateLocation', async (data) => {
    console.log(data);
    io.emit('locations', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
