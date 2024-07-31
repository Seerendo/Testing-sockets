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

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
