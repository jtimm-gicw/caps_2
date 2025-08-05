'use strict'; // Enables strict mode for safer JavaScript

// Load environment variables from a .env file (if present)
require('dotenv').config();

// Import the Server class from socket.io
const { Server } = require('socket.io');

// Define the port to listen on (from .env or default to 3002)
const PORT = process.env.PORT || 3002;

// Create a single instance (singleton) of the Socket.IO server
const server = new Server();

// Create a namespace called '/caps' to isolate communication related to the delivery system
const caps = server.of('/caps');

// Handle new client connections to the /caps namespace
caps.on('connection', (socket) => {
  console.log('connect to the caps namespace', socket.id);

  // Log all events received on this socket with a timestamp and payload
  socket.onAny((event, payload) => {
    const time = new Date();
    console.log('EVENT:', { event, time, payload });
  });

  // When a 'PICKUP' event is received, broadcast it to all other clients
  socket.on('PICKUP', (payload) => {
    socket.broadcast.emit('PICKUP', payload);
  });

  // When a package is in transit, broadcast the 'IN-TRANSIT' event to all other clients
  socket.on('IN-TRANSIT', (payload) => {
    socket.broadcast.emit('IN-TRANSIT', payload);
  });

  // When a package is delivered, broadcast the 'DELIVERY' event to all other clients
  socket.on('DELIVERY', (payload) => {
    socket.broadcast.emit('DELIVERY', payload);
  });
});

// Start the Socket.IO server and begin listening on the specified port
console.log('listening on port', PORT);
server.listen(PORT);
