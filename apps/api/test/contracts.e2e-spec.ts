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

describe('Contracts Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionProfileId: string;
  let sessionId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'contract-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const comp = await registerCompanion({
      email: 'contract-comp@example.com',
      password: 'Password123!',
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;

    await getPrisma().companionProfile.update({
      where: { id: companionProfileId },
      data: { status: 'APPROVED' },
    });

    // Create a session and assign companion
    const sessionRes = await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 60 })
      .expect(201);

    sessionId = sessionRes.body.id;

    await getPrisma().session.update({
      where: { id: sessionId },
      data: { companionId: companionProfileId, status: 'MATCHED' },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Templates ─────────────────────────────────────────────────────────

  describe('GET /api/v1/contracts/templates', () => {
    it('should return contract templates (may be empty)', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/contracts/templates')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter templates by session type', async () => {
      // Create a template first
      await getPrisma().contractTemplate.create({
        data: {
          name: 'Focus Template',
          description: 'Standard focus session rules',
          sessionType: 'FOCUS',
          mode: 'MODERATE',
          rules: [{ type: 'no-phone', description: 'No phone during session' }],
        },
      });

      const res = await request(getHttpServer())
        .get('/api/v1/contracts/templates?sessionType=FOCUS')
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      for (const template of res.body) {
        expect(template.sessionType).toBe('FOCUS');
      }
    });
  });

  describe('GET /api/v1/contracts/templates/:id', () => {
    it('should return a specific template', async () => {
      const templates = await getPrisma().contractTemplate.findMany();
      if (templates.length > 0) {
        const res = await request(getHttpServer())
          .get(`/api/v1/contracts/templates/${templates[0].id}`)
          .expect(200);

        expect(res.body.id).toBe(templates[0].id);
        expect(res.body.name).toBeDefined();
      }
    });

    it('should return 404 for non-existent template', async () => {
      await request(getHttpServer())
        .get('/api/v1/contracts/templates/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // ── Create Contract ───────────────────────────────────────────────────

  describe('POST /api/v1/contracts', () => {
    let contractId: string;

    it('should create a contract for a session', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId,
          mode: 'STRICT',
          rules: [
            { type: 'no-phone', description: 'No phone usage during session' },
            { type: 'stay-focused', description: 'Stay on topic' },
          ],
        })
        .expect(201);

      contractId = res.body.id;
      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.mode).toBe('STRICT');
      expect(res.body.acceptedByUser).toBe(false);
      expect(res.body.acceptedByCompanion).toBe(false);
    });

    it('should reject duplicate contract for same session', async () => {
      await request(getHttpServer())
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sessionId, mode: 'FLEXIBLE', rules: [] })
        .expect(409);
    });

    it('should reject contract from non-session-owner', async () => {
      const newSession = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'PLANNING' })
        .expect(201);

      const otherUser = await registerUser({
        email: 'contract-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ sessionId: newSession.body.id, mode: 'MODERATE', rules: [] })
        .expect(403);
    });

    // ── Get Contract ──────────────────────────────────────────────────

    it('should get contract by ID', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/contracts/${contractId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.id).toBe(contractId);
      expect(res.body.session).toBeDefined();
    });

    // ── Accept Contract ─────────────────────────────────────────────────

    it('should accept contract as user', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/contracts/${contractId}/accept`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body.acceptedByUser).toBe(true);
      expect(res.body.acceptedByCompanion).toBe(false);
      expect(res.body.acceptedAt).toBeNull();
    });

    it('should accept contract as companion and set acceptedAt', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/contracts/${contractId}/accept`)
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(201);

      expect(res.body.acceptedByCompanion).toBe(true);
      expect(res.body.acceptedByUser).toBe(true);
      expect(res.body.acceptedAt).toBeDefined();
    });

    it('should reject acceptance from non-participant', async () => {
      const otherUser = await registerUser({
        email: 'contract-nonpart@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post(`/api/v1/contracts/${contractId}/accept`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403);
    });
  });
});
