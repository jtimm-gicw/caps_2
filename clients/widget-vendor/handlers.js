'use strict'; // Enables strict mode for better error-checking and secure JavaScript

// Import the Chance library to generate random data
const Chance = require('chance');
const chance = new Chance(); // Create an instance of Chance

const { io } = require('socket.io-client');
// importing socket
const socket = require('./lib/socket');

// *NEW
const socket = io('http://localhost:3001/caps');

socket.on('connect', () => {
  socket.emit('SUBSCRIBE', { queueId: 'widgets' });
  console.log('Widget Inc. subscribed to widgets queue');
});
/**
 * Simulates generating a new order from a vendor.
 * Emits a 'PICKUP' event with order details to notify the system a package is ready.
 *
 * @param {object} socket - The socket connection used to emit events
 * @param {object|null} payload - Optional custom order details; if not provided, random data is generated
 */
const generateOrder = (socket, payload = null) => {
  if (!payload) {
    // Generate random order data using Chance if no payload is provided
    payload = {
      store: 'Widget Inc.',
      id: chance.guid(),
      customer: chance.name(),
      address: chance.address(),
    };
  }

  console.log('VENDOR: Widget order ready for pickup.');

  // Emit a 'PICKUP' event to notify the driver/system that a new order is ready
  socket.emit('PICKUP', payload);
};
/**
 * Simulates a vendor thanking the driver after delivery
 *
 * @param {object} payload - Contains order and customer info
 */
const thankDriver = (payload) => {
  console.log('Thanks for delivering the widgets to', payload.customer);
};

// Export the functions so they can be used in other parts of the app
module.exports = { generateOrder, thankDriver };
