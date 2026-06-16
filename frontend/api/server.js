const serverless = require('serverless-http');
const path = require('path');

// Import the Express app from backend
const app = require(path.resolve(__dirname, '../../backend/src/index.js'));

module.exports = serverless(app);
