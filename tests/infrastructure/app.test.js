const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, teardownTestDB } = require('../setup');

describe('Infrastructure & Health Endpoint Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /health', () => {
    it('should return 200 OK with health status and database status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'ok');
      expect(res.body.data).toHaveProperty('database', 'connected');
      expect(res.body.data).toHaveProperty('timestamp');
    });

    it('should respond to /api/v1/health endpoint', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('404 Route Handler', () => {
    it('should return 404 Not Found for undefined routes', async () => {
      const res = await request(app).get('/api/v1/nonexistent-route-path');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toContain('Endpoint not found');
    });
  });
});
