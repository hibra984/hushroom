import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
} from './helpers/test-app';

describe('AppController (e2e)', () => {
  beforeAll(async () => {
    await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('/api/v1/health (GET)', () => {
    return request(getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
      });
  });
});
