import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
} from './helpers/test-app';

describe('Health Module (e2e)', () => {
  beforeAll(async () => {
    await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', () => {
      return request(getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('GET /api/v1/health/db', () => {
    it('should return database health', () => {
      return request(getHttpServer())
        .get('/api/v1/health/db')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('database');
        });
    });
  });

  describe('GET /api/v1/health/redis', () => {
    it('should return redis health', () => {
      return request(getHttpServer())
        .get('/api/v1/health/redis')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('redis');
        });
    });
  });
});
