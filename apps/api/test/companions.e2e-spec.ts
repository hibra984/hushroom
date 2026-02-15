import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  registerUser,
  loginUser,
  registerCompanion,
  getPrisma,
} from './helpers/test-app';

describe('Companions Module (e2e)', () => {
  let userToken: string;
  let companionToken: string;
  let companionProfileId: string;
  let companionUserId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    // Create a regular user
    const user = await registerUser({
      email: 'comp-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;

    // Create an approved companion
    const comp = await registerCompanion({
      email: 'comp-companion@example.com',
      password: 'Password123!',
      bio: 'Expert life coach specializing in productivity',
      baseRate: 30,
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;
    companionUserId = comp.user.id;

    // Approve the companion so it appears in search
    await getPrisma().companionProfile.update({
      where: { id: companionProfileId },
      data: { status: 'APPROVED' },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Register as Companion ─────────────────────────────────────────────

  describe('POST /api/v1/companions/register', () => {
    it('should register a user as a companion', async () => {
      const newUser = await registerUser({
        email: 'new-comp@example.com',
        password: 'Password123!',
      });

      const res = await request(getHttpServer())
        .post('/api/v1/companions/register')
        .set('Authorization', `Bearer ${newUser.accessToken}`)
        .send({
          bio: 'New companion bio',
          baseRate: 20,
          expertiseTags: ['focus', 'mindfulness'],
          driftEnforcement: 'FLEXIBLE',
        })
        .expect(201);

      expect(res.body.bio).toBe('New companion bio');
      expect(res.body.baseRate).toBe(20);
      expect(res.body.status).toBe('PENDING_REVIEW');
      expect(res.body.type).toBe('STANDARD');
      expect(res.body.expertiseTags).toContain('focus');
    });

    it('should reject duplicate companion registration', async () => {
      await request(getHttpServer())
        .post('/api/v1/companions/register')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          bio: 'Duplicate',
          baseRate: 20,
        })
        .expect(409);
    });

    it('should require authentication', async () => {
      await request(getHttpServer())
        .post('/api/v1/companions/register')
        .send({ bio: 'No auth', baseRate: 20 })
        .expect(401);
    });
  });

  // ── Get Own Profile ───────────────────────────────────────────────────

  describe('GET /api/v1/companions/me', () => {
    it('should return companion own profile', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/companions/me')
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(200);

      expect(res.body.bio).toBeDefined();
      expect(res.body.baseRate).toBe(30);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('COMPANION');
    });

    it('should reject non-companion user', async () => {
      await request(getHttpServer())
        .get('/api/v1/companions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // ── Update Profile ────────────────────────────────────────────────────

  describe('PATCH /api/v1/companions/me', () => {
    it('should update companion profile', async () => {
      const res = await request(getHttpServer())
        .patch('/api/v1/companions/me')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          bio: 'Updated bio for testing',
          baseRate: 35,
          maxConcurrent: 3,
        })
        .expect(200);

      expect(res.body.bio).toBe('Updated bio for testing');
      expect(res.body.baseRate).toBe(35);
    });

    it('should reject non-companion user', async () => {
      await request(getHttpServer())
        .patch('/api/v1/companions/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bio: 'Hacked' })
        .expect(403);
    });
  });

  // ── Toggle Online ─────────────────────────────────────────────────────

  describe('PATCH /api/v1/companions/me/online', () => {
    it('should toggle companion online status', async () => {
      const res = await request(getHttpServer())
        .patch('/api/v1/companions/me/online')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({ isOnline: true })
        .expect(200);

      expect(res.body.isOnline).toBe(true);
      expect(res.body.lastActiveAt).toBeDefined();
    });

    it('should toggle offline', async () => {
      const res = await request(getHttpServer())
        .patch('/api/v1/companions/me/online')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({ isOnline: false })
        .expect(200);

      expect(res.body.isOnline).toBe(false);
    });
  });

  // ── Search Companions ─────────────────────────────────────────────────

  describe('GET /api/v1/companions', () => {
    it('should return approved companions', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/companions')
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/companions?take=1&skip=0')
        .expect(200);

      expect(res.body.take).toBe(1);
      expect(res.body.skip).toBe(0);
    });

    it('should filter by expertise tag', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/companions?expertiseTag=productivity')
        .expect(200);

      for (const companion of res.body.data) {
        expect(companion.expertiseTags).toContain('productivity');
      }
    });
  });

  // ── Get Public Profile ────────────────────────────────────────────────

  describe('GET /api/v1/companions/:id', () => {
    it('should return a public companion profile', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/companions/${companionProfileId}`)
        .expect(200);

      expect(res.body.id).toBe(companionProfileId);
      expect(res.body.bio).toBeDefined();
      expect(res.body.displayName).toBeDefined();
    });

    it('should return 404 for non-existent companion', async () => {
      await request(getHttpServer())
        .get('/api/v1/companions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
