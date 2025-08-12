'use strict'; // Enables strict mode for cleaner, safer JavaScript

// Import Socket.IO client and helper functions
const { io } = require('socket.io-client');
const { generateOrder, thankDriver } = require('./handlers');

// Connect to the CAPS (Courier and Package System) namespace on the server
const socket = io('http://localhost:3001/caps');

// Listen for 'DELIVERY' events, which notify the vendor that a package has been successfully delivered
socket.on('DELIVERY', (payload) => {
  // Respond by thanking the driver using the imported helper function
  thankDriver(payload);
});

// Every 5 seconds, simulate the vendor creating a new order
// This triggers a 'PICKUP' event sent to the server with the order details
setInterval(() => {
  generateOrder(socket);
}, 5000);


