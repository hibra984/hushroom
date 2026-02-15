import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  registerUser,
  registerCompanion,
  getPrisma,
} from './helpers/test-app';

describe('Ratings Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionProfileId: string;
  let companionUserId: string;
  let completedSessionId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'rating-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const comp = await registerCompanion({
      email: 'rating-comp@example.com',
      password: 'Password123!',
      baseRate: 25,
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;
    companionUserId = comp.user.id;

    await getPrisma().companionProfile.update({
      where: { id: companionProfileId },
      data: { status: 'APPROVED' },
    });

    // Create a completed session
    const session = await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 60 })
      .expect(201);

    completedSessionId = session.body.id;

    await getPrisma().session.update({
      where: { id: completedSessionId },
      data: {
        companionId: companionProfileId,
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(),
        durationMinutes: 60,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Create Rating ─────────────────────────────────────────────────────

  describe('POST /api/v1/ratings', () => {
    it('should create a rating for a completed session (user rates companion)', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: completedSessionId,
          overallScore: 5,
          goalAchievement: 4,
          presenceQuality: 5,
          contractAdherence: 5,
          communication: 4,
          comment: 'Great session!',
          isPublic: true,
        })
        .expect(201);

      expect(res.body.overallScore).toBe(5);
      expect(res.body.raterId).toBe(userId);
      expect(res.body.ratedUserId).toBe(companionUserId);
      expect(res.body.comment).toBe('Great session!');
      expect(res.body.isPublic).toBe(true);
    });

    it('should reject duplicate rating from same user', async () => {
      await request(getHttpServer())
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: completedSessionId,
          overallScore: 3,
        })
        .expect(400);
    });

    it('should allow companion to also rate the session (rates user)', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          sessionId: completedSessionId,
          overallScore: 4,
          presenceQuality: 4,
          comment: 'Good user to work with',
        })
        .expect(201);

      expect(res.body.raterId).toBe(companionUserId);
      expect(res.body.ratedUserId).toBe(userId);
    });

    it('should reject rating for non-completed session', async () => {
      const pendingSession = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      await request(getHttpServer())
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: pendingSession.body.id,
          overallScore: 5,
        })
        .expect(400);
    });

    it('should reject rating from non-participant', async () => {
      const otherUser = await registerUser({
        email: 'rating-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/ratings')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({
          sessionId: completedSessionId,
          overallScore: 1,
        })
        .expect(403);
    });
  });

  // ── Get Ratings by Session ────────────────────────────────────────────

  describe('GET /api/v1/ratings/session/:sessionId', () => {
    it('should return ratings for a session', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/ratings/session/${completedSessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // user + companion
      expect(res.body[0].rater).toBeDefined();
      expect(res.body[0].ratedUser).toBeDefined();
    });
  });

  // ── Get Companion Ratings ─────────────────────────────────────────────

  describe('GET /api/v1/ratings/companion/:companionId', () => {
    it('should return public ratings for a companion', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/ratings/companion/${companionProfileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.ratings).toBeDefined();
      expect(res.body.total).toBeDefined();
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/ratings/companion/${companionProfileId}?page=1&limit=5`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.limit).toBe(5);
    });
  });

  // ── Get My Ratings ────────────────────────────────────────────────────

  describe('GET /api/v1/ratings/me', () => {
    it('should return ratings given and received by current user', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/ratings/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.given).toBeDefined();
      expect(res.body.received).toBeDefined();
      expect(Array.isArray(res.body.given)).toBe(true);
      expect(Array.isArray(res.body.received)).toBe(true);
      expect(res.body.given.length).toBeGreaterThanOrEqual(1);
    });
  });
});
