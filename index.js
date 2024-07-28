require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('node:http');
const mongoose = require('mongoose');

const socketIO = require('socket.io');

const app = express();
app.use(cors());
app.use(morgan('dev'));

const httpServer = http.createServer(app);
const io = socketIO(httpServer);

const INACTIVITY_TIMEOUT = 300000;

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  let inactivityTimer;

  const resetInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
      console.log('Desconectando por inactividad:', socket.id);
      socket.disconnect();
    }, INACTIVITY_TIMEOUT);
  };

  socket.on('updateLocation', async (data) => {
    console.log(data);
    io.emit('locations', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
  });

  resetInactivityTimer();
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
