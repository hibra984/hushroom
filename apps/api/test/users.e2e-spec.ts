import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  registerUser,
  loginUser,
} from './helpers/test-app';

describe('Users Module (e2e)', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const reg = await registerUser({
      email: 'user-test@example.com',
      password: 'Password123!',
      firstName: 'User',
      lastName: 'Test',
    });
    userId = reg.user.id;
    userToken = reg.accessToken;
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Get Profile ───────────────────────────────────────────────────────

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe('user-test@example.com');
      expect(res.body.firstName).toBe('User');
      expect(res.body.role).toBe('USER');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  // ── Update Profile ────────────────────────────────────────────────────

  describe('PATCH /api/v1/users/me', () => {
    it('should update user profile fields', async () => {
      const res = await request(getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          displayName: 'Updated U.',
          preferredLanguage: 'fr',
          timezone: 'Europe/Paris',
        })
        .expect(200);

      expect(res.body.firstName).toBe('Updated');
      expect(res.body.displayName).toBe('Updated U.');
      expect(res.body.preferredLanguage).toBe('fr');
      expect(res.body.timezone).toBe('Europe/Paris');
    });

    it('should reject extra/unknown fields', async () => {
      await request(getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ isAdmin: true })
        .expect(400);
    });
  });

  // ── Languages ─────────────────────────────────────────────────────────

  describe('GET /api/v1/users/me/languages', () => {
    it('should return empty languages initially', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/users/me/languages')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/v1/users/me/languages', () => {
    it('should set user languages', async () => {
      const res = await request(getHttpServer())
        .put('/api/v1/users/me/languages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          languages: [
            { language: 'en', proficiency: 'native', isPreferred: true },
            { language: 'fr', proficiency: 'fluent', isPreferred: false },
          ],
        })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].language).toBe('en');
      expect(res.body[1].language).toBe('fr');
    });

    it('should replace existing languages', async () => {
      const res = await request(getHttpServer())
        .put('/api/v1/users/me/languages')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          languages: [
            { language: 'de', proficiency: 'beginner', isPreferred: true },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].language).toBe('de');
    });
  });

  // ── Data Export ───────────────────────────────────────────────────────

  describe('POST /api/v1/users/me/data-export', () => {
    it('should request data export', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/users/me/data-export')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.message).toContain('export');
    });
  });

  // ── Delete Account ────────────────────────────────────────────────────

  describe('DELETE /api/v1/users/me', () => {
    it('should soft-delete the user account', async () => {
      // Register a disposable user
      const reg = await registerUser({
        email: 'delete-me@example.com',
        password: 'Password123!',
      });

      const res = await request(getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${reg.accessToken}`)
        .expect(200);

      expect(res.body.message).toContain('deleted');

      // User should no longer be able to login
      await request(getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'delete-me@example.com', password: 'Password123!' })
        .expect(401);
    });
  });
});
