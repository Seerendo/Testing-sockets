require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('node:http');

const socketIO = require('socket.io');

const app = express();
app.use(cors());
app.use(morgan('dev'));

const httpServer = http.createServer(app);
const io = socketIO(httpServer);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('identify', (userId) => {
    socket.userId = userId;
  });

  socket.on('updateLocation', async (data) => {
    console.log(data);
    io.emit('locations', data);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      io.emit('userDisconnected', { userId: socket.userId });
    }
    console.log('Cliente desconectado');
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on PORT 3000');
});
