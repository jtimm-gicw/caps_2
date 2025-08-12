'use strict'; // Enforces stricter parsing and error handling in JavaScript

// Import the Socket.IO client library
const { io } = require('socket.io-client');
// importing socket
const socket = require('../lib/socket');

// Connect to the CAPS (Courier and Package System) namespace on the Socket.IO server
const socket = io('http://localhost:3001/caps');

// *NEW
// Subscribe immediately when connected
socket.on('connect', () => {
  socket.emit('SUBSCRIBE', { queueId: 'driver' }); // note: singular 'driver' to match your server code
  console.log('Driver subscribed to driver queue');
});

// Listen for 'PICKUP' events from the server, which signal that a package is ready for pickup
socket.on('PICKUP', (payload) => {
  
  // Simulate the driver picking up the package after 1 second
  setTimeout(() => {
    console.log('DRIVER: picked up package.');

    // Notify the server that the package is now in transit
    socket.emit('IN-TRANSIT', payload);
  }, 1000);

  // Simulate the driver delivering the package after 2 seconds
  setTimeout(() => {
    console.log('DRIVER: package has been delivered');

    // Notify the server that the delivery is complete
    socket.emit('DELIVERY', payload);
  }, 2000);

  
});
