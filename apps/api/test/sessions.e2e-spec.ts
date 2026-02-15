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

describe('Sessions Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionProfileId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'session-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const comp = await registerCompanion({
      email: 'session-comp@example.com',
      password: 'Password123!',
      baseRate: 25,
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;

    // Approve companion
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

  // ── Create Session ────────────────────────────────────────────────────

  describe('POST /api/v1/sessions', () => {
    it('should create a FOCUS session', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS', plannedDuration: 60 })
        .expect(201);

      expect(res.body.type).toBe('FOCUS');
      expect(res.body.status).toBe('PENDING_MATCH');
      expect(res.body.plannedDuration).toBe(60);
      expect(res.body.userId).toBe(userId);
    });

    it('should create a DECISION session with scheduled time', async () => {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();

      const res = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'DECISION', plannedDuration: 30, scheduledAt })
        .expect(201);

      expect(res.body.type).toBe('DECISION');
      expect(res.body.scheduledAt).toBeDefined();
    });

    it('should create session with default duration (30)', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'PLANNING' })
        .expect(201);

      expect(res.body.plannedDuration).toBe(30);
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .post('/api/v1/sessions')
        .send({ type: 'FOCUS' })
        .expect(401);
    });
  });

  // ── List Sessions ─────────────────────────────────────────────────────

  describe('GET /api/v1/sessions', () => {
    it('should list user sessions', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/sessions?status=PENDING_MATCH')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      for (const session of res.body) {
        expect(session.status).toBe('PENDING_MATCH');
      }
    });
  });

  // ── Get Session by ID ─────────────────────────────────────────────────

  describe('GET /api/v1/sessions/:id', () => {
    it('should return session with relations', async () => {
      // Create a session first
      const createRes = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'EMOTIONAL_UNLOAD' })
        .expect(201);

      const res = await request(getHttpServer())
        .get(`/api/v1/sessions/${createRes.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.id).toBe(createRes.body.id);
      expect(res.body.type).toBe('EMOTIONAL_UNLOAD');
    });

    it('should return 404 for non-existent session', async () => {
      await request(getHttpServer())
        .get('/api/v1/sessions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  // ── Full Session Lifecycle ────────────────────────────────────────────

  describe('Session State Transitions', () => {
    let sessionId: string;

    it('should create a session (PENDING_MATCH)', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS', plannedDuration: 60 })
        .expect(201);

      sessionId = res.body.id;
      expect(res.body.status).toBe('PENDING_MATCH');
    });

    it('should transition to MATCHED (via direct DB update for E2E)', async () => {
      // Assign companion and move to MATCHED
      await getPrisma().session.update({
        where: { id: sessionId },
        data: { companionId: companionProfileId, status: 'MATCHED' },
      });

      const session = await getPrisma().session.findUnique({ where: { id: sessionId } });
      expect(session!.status).toBe('MATCHED');
    });

    it('should transition to PAYMENT_AUTHORIZED (via DB)', async () => {
      await getPrisma().session.update({
        where: { id: sessionId },
        data: { status: 'PAYMENT_AUTHORIZED' },
      });

      const session = await getPrisma().session.findUnique({ where: { id: sessionId } });
      expect(session!.status).toBe('PAYMENT_AUTHORIZED');
    });

    it('should mark session as READY', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/ready`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body.status).toBe('READY');
    });

    it('should start session (READY → IN_PROGRESS)', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/start`)
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(201);

      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.startedAt).toBeDefined();
    });

    it('should pause session (IN_PROGRESS → PAUSED)', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/pause`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body.status).toBe('PAUSED');
    });

    it('should resume session (PAUSED → IN_PROGRESS)', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/resume`)
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(201);

      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('should end session (IN_PROGRESS → COMPLETED)', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.endedAt).toBeDefined();
      expect(res.body.durationMinutes).toBeDefined();
    });
  });

  // ── Cancel Session ────────────────────────────────────────────────────

  describe('POST /api/v1/sessions/:id/cancel', () => {
    it('should cancel a PENDING_MATCH session', async () => {
      const createRes = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      const res = await request(getHttpServer())
        .post(`/api/v1/sessions/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(201);

      expect(res.body.status).toBe('CANCELLED');
      expect(res.body.cancellationReason).toBe('Changed my mind');
    });

    it('should reject cancelling a COMPLETED session', async () => {
      // Create and complete a session
      const createRes = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      // Move it to COMPLETED via DB
      await getPrisma().session.update({
        where: { id: createRes.body.id },
        data: {
          companionId: companionProfileId,
          status: 'COMPLETED',
          startedAt: new Date(),
          endedAt: new Date(),
        },
      });

      await request(getHttpServer())
        .post(`/api/v1/sessions/${createRes.body.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Too late' })
        .expect(400);
    });
  });

  // ── Invalid Transitions ───────────────────────────────────────────────

  describe('Invalid State Transitions', () => {
    it('should reject starting a session that is PENDING_MATCH', async () => {
      const createRes = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      await request(getHttpServer())
        .post(`/api/v1/sessions/${createRes.body.id}/start`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });

    it('should reject non-participant from transitioning', async () => {
      const createRes = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      // Assign a companion and move to READY
      await getPrisma().session.update({
        where: { id: createRes.body.id },
        data: {
          companionId: companionProfileId,
          status: 'READY',
        },
      });

      // A different user tries to start it
      const otherUser = await registerUser({
        email: 'other-session@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post(`/api/v1/sessions/${createRes.body.id}/start`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403);
    });
  });
});
