import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  registerUser,
} from './helpers/test-app';

describe('Goals Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let sessionId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'goal-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    // Create a session
    const sessionRes = await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 60 })
      .expect(201);

    sessionId = sessionRes.body.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Create Goal ───────────────────────────────────────────────────────

  describe('POST /api/v1/goals', () => {
    let goalId: string;

    it('should create a goal for a session', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          title: 'Complete project proposal',
          description: 'Draft and finalize the full project proposal document with all sections',
          successCriteria: ['Draft completed', 'All sections filled', 'Reviewed once'],
          keywords: ['productivity', 'writing'],
        })
        .expect(201);

      goalId = res.body.id;
      expect(res.body.title).toBe('Complete project proposal');
      expect(res.body.successCriteria).toHaveLength(3);
      expect(res.body.keywords).toContain('productivity');
      expect(res.body.isAchieved).toBeNull();
    });

    it('should reject duplicate goal for same session', async () => {
      await request(getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          title: 'Duplicate',
          description: 'This should fail because goal already exists',
          successCriteria: ['fail'],
        })
        .expect(409);
    });

    it('should reject goal from non-session-owner', async () => {
      const otherUser = await registerUser({
        email: 'goal-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({
          sessionId,
          title: 'Hacked goal',
          description: 'Should not be allowed by non-owner of the session',
          successCriteria: ['hack'],
        })
        .expect(403);
    });

    it('should reject goal with missing required fields', async () => {
      // Create a new session for this test
      const newSession = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'PLANNING' })
        .expect(201);

      await request(getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: newSession.body.id,
          // Missing title, description, successCriteria
        })
        .expect(400);
    });

    // ── Get Goal by Session ID ────────────────────────────────────────

    it('should get goal by session ID', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/goals/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.title).toBe('Complete project proposal');
    });

    it('should return 404 for session without a goal', async () => {
      const newSession = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'DECISION' })
        .expect(201);

      await request(getHttpServer())
        .get(`/api/v1/goals/${newSession.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    // ── Update Goal ─────────────────────────────────────────────────────

    it('should update goal achievement status', async () => {
      const res = await request(getHttpServer())
        .patch(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isAchieved: true,
          achievementNote: 'All criteria met successfully!',
        })
        .expect(200);

      expect(res.body.isAchieved).toBe(true);
      expect(res.body.achievementNote).toBe('All criteria met successfully!');
    });

    it('should reject update from non-session-owner', async () => {
      const otherUser = await registerUser({
        email: 'goal-update-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .patch(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ isAchieved: false })
        .expect(403);
    });
  });
});
