'use strict'; // Enables strict mode for safer JavaScript

// Load environment variables from a .env file (if present)
require('dotenv').config();

// Import the Server class from socket.io
const { Server } = require('socket.io');

// Define the port to listen on (from .env or default to 3002)
const PORT = process.env.PORT || 3002;

// Create a single instance (singleton) of the Socket.IO server
const server = new Server();

// ^NEW
// importing queue
const Queue = require('./lib/queue');
const capsQueue = new Queue();

// To store subscribers
// Object to store subscriptions: { queueId (store) : Set of socket IDs }
const subscriptions = {};

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

  // *NEW
  // Listens for subscribers
  socket.on('SUBSCRIBE', (payload) => {
  const { queueId } = payload;  // e.g. 'flowers' or 'widgets' or 'drivers'
  if (!subscriptions[queueId]) {
    subscriptions[queueId] = new Set(); // use a Set to avoid duplicates
  }
  subscriptions[queueId].add(socket.id);
  console.log(`Socket ${socket.id} subscribed to ${queueId}`);
});

  // *NEW
  // read messages
  socket.on('DELIVERED', (payload) => {
    let vendorQueue = capsQueue.read(payload.queueId);

    if (!vendorQueue) {
      let vendorKey = capsQueue.store(payload.queueId, new Queue());
      vendorQueue = capsQueue.read(vendorKey);
    }
    vendorQueue.store(payload.messageId, payload);

    socket.to(payload.queueId).emit('DELIVERED', payload);
  });

  // *NEW
  // ADDED emitToSubscribers
  socket.on('PICKUP', (payload) => {
  emitToSubscribers(payload.queueId, 'PICKUP', payload);
});

socket.on('IN-TRANSIT', (payload) => {
  emitToSubscribers(payload.queueId, 'IN-TRANSIT', payload);
});

socket.on('DELIVERY', (payload) => {
  emitToSubscribers(payload.queueId, 'DELIVERY', payload);
});

  // listening for 'RECEIVED'
  socket.on('RECEIVED', (payload) => {
    console.log('Server: Received event registered');
    let currentQueue = capsQueue.read(payload.queueId);
    /* 
    We look up a specific queue in our capsQueue system, using the queueId from the payload.
    Think of capsQueue like a filing cabinet, and queueId is the label on the drawer we’re opening.
    */
    if (!currentQueue) {
      throw new Error('we have payloads, but no queue');
    }
    /* 
    This checks: "Did we actually find that queue?"
    If we didn’t, it’s an error — meaning we got a package (payload) but can’t find where it belongs.
    */
    currentQueue.remove(payload.messageId);
    /* If we did find the queue, we remove the message with the messageId from that queue.
    It’s like crossing that message off the "to-do" list because it’s been confirmed as received
    */
  });

  //REMOVES subscriptions, when the socket disconnects so does the sub
socket.on('disconnect', () => {
  for (const queueId in subscriptions) {
    subscriptions[queueId].delete(socket.id);
    if (subscriptions[queueId].size === 0) {
      delete subscriptions[queueId];
    }
  }
  console.log(`Socket ${socket.id} disconnected and unsubscribed.`);
});

  // listens for GET-ALL
  socket.on('GET-ALL', (payload) => {
    // This listens for a "GET-ALL" event from the client and sends all the messages that are currently in a specific queue back to the client.
    console.log('attempting to get all');
    let currentQueue = capsQueue.read(payload.queueId); // Looks inside capsQueue for the queue with the matching queueId
    if (currentQueue && currentQueue.data) { // Checks if the queue actually exists and has some data inside.
      Object.keys(currentQueue.data).forEach(messageId => { // Gets a list of all the message IDs inside the queue and loops through them one by one
        let payload = currentQueue.read(messageId);  
        socket.emit(payload.event, payload); // Sends that message back to the client using the event type stored in payload.event
      });
    } // ✅ Fixed missing closing brace
  });

});

// *NEW
//  Subscriber  helper function 
// Helper function to emit to all subscribers of a queueId
function emitToSubscribers(queueId, event, payload) {
  const subs = subscriptions[queueId];
  if (!subs) return; // no subscribers yet

  subs.forEach(socketId => {
    const clientSocket = caps.sockets.get(socketId);
    if (clientSocket) {
      clientSocket.emit(event, payload);
    }
  });
}


// Start the Socket.IO server and begin listening on the specified port
console.log('listening on port', PORT);
server.listen(PORT);
