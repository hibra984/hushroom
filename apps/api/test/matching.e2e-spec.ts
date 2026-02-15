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

describe('Matching Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionProfileId: string;
  let sessionId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'match-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    // Create an approved companion
    const comp = await registerCompanion({
      email: 'match-comp@example.com',
      password: 'Password123!',
      bio: 'Productivity expert',
      baseRate: 25,
    });
    companionProfileId = comp.companionProfile.id;

    await getPrisma().companionProfile.update({
      where: { id: companionProfileId },
      data: {
        status: 'APPROVED',
        isOnline: true,
        averageRating: 4.5,
        reputationScore: 4.0,
      },
    });

    // Create a session for matching
    const sessionRes = await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 60 })
      .expect(201);

    sessionId = sessionRes.body.id;

    // Create a goal with keywords to help matching
    await request(getHttpServer())
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sessionId,
        title: 'Focus on productivity',
        description: 'Need to improve my productivity and focus during work',
        successCriteria: ['Stay focused for 1 hour'],
        keywords: ['productivity', 'focus'],
      })
      .expect(201);
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Find Matches ──────────────────────────────────────────────────────

  describe('POST /api/v1/matching/find', () => {
    it('should find matching companions', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/matching/find')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          maxPrice: 50,
        })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const match = res.body[0];
      expect(match.companionId).toBeDefined();
      expect(match.score).toBeDefined();
      expect(match.breakdown).toBeDefined();
      expect(match.breakdown.goalMatch).toBeDefined();
      expect(match.breakdown.reputation).toBeDefined();
    });

    it('should reject matching for non-PENDING_MATCH session', async () => {
      const session2 = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      // Move to CANCELLED
      await getPrisma().session.update({
        where: { id: session2.body.id },
        data: { status: 'CANCELLED' },
      });

      await request(getHttpServer())
        .post('/api/v1/matching/find')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sessionId: session2.body.id })
        .expect(400);
    });

    it('should reject matching by non-session-owner', async () => {
      const otherUser = await registerUser({
        email: 'match-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/matching/find')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ sessionId })
        .expect(403);
    });
  });

  // ── Get Results ───────────────────────────────────────────────────────

  describe('GET /api/v1/matching/results/:sessionId', () => {
    it('should return cached matching results', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/matching/results/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Select Companion ──────────────────────────────────────────────────

  describe('POST /api/v1/matching/select', () => {
    it('should select a companion and transition to MATCHED', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/matching/select')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          companionId: companionProfileId,
        })
        .expect(201);

      expect(res.body.status).toBe('MATCHED');
      expect(res.body.companionId).toBe(companionProfileId);
      expect(res.body.companion).toBeDefined();
    });

    it('should reject selecting for already-matched session', async () => {
      await request(getHttpServer())
        .post('/api/v1/matching/select')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          companionId: companionProfileId,
        })
        .expect(400);
    });

    it('should reject selecting by non-session-owner', async () => {
      const newSession = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      const otherUser = await registerUser({
        email: 'match-select-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/matching/select')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({
          sessionId: newSession.body.id,
          companionId: companionProfileId,
        })
        .expect(403);
    });
  });
});
