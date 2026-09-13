const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const ApiResponse = require('./utils/apiResponse');
const ERROR_CODES = require('./constants/errorCodes');
const env = require('./config/env');
const { getDBHealth } = require('./config/db');

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root Health check endpoint for load balancers
app.get('/health', (req, res) => {
  const dbHealth = getDBHealth();
  const isHealthy = dbHealth.isConnected;
  const statusCode = isHealthy ? 200 : 503;

  return ApiResponse.success(res, statusCode, isHealthy ? 'Service is healthy' : 'Service unhealthy: database disconnected', {
    status: isHealthy ? 'ok' : 'degraded',
    database: dbHealth.status,
    timestamp: new Date().toISOString()
  });
});

// Main API Router Registration under /api/v1
app.use('/api/v1', routes);

// 404 Not Found Middleware Handler
app.use((req, res, next) => {
  return ApiResponse.error(
    res,
    404,
    ERROR_CODES.NOT_FOUND,
    `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`
  );
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
