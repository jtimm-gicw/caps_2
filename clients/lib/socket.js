'use strict';

const { io } = require('socket.io-client'); // requiring the clinet side
const socket = io('http://localhost:3001/caps'); // joining namespace created in the server

module.exports = socket;
