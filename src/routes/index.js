const express = require('express');
const authRoutes = require('./auth.routes');
const locationRoutes = require('./location.routes');
const { getDBHealth } = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const teacherRoutes = require('./teacher.routes');
const coordinatorRoutes = require('./coordinator.routes');
const studentRoutes = require('./student.routes');
const programRoutes = require('./program.routes');



const router = express.Router();

/**
 * Health check handler
*/
const healthHandler = (req, res) => {
  const dbHealth = getDBHealth();
  const isHealthy = dbHealth.isConnected;
  const statusCode = isHealthy ? 200 : 503;
  
  return ApiResponse.success(res, statusCode, isHealthy ? 'Service is healthy' : 'Service unhealthy: database disconnected', {
    status: isHealthy ? 'ok' : 'degraded',
    database: dbHealth.status,
    timestamp: new Date().toISOString()
  });
};

// Health Check Endpoints
router.get('/health', healthHandler);

const studyCenterRoutes = require('./studyCenter.routes');
const dashboardRoutes = require('./dashboard.routes');

// Module Route Registration
router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/study-centers', studyCenterRoutes);
// Teachers Routes
router.use('/teachers', teacherRoutes);
// Coordinators Routes
router.use('/coordinators', coordinatorRoutes);
// Student routes
router.use('/students', studentRoutes);
// Program routes
router.use('/programs', programRoutes);
// dashboard summary
router.use('/dashboard', dashboardRoutes);
module.exports = router;