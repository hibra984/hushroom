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

describe('Availability Module (e2e)', () => {
  let userToken: string;
  let companionToken: string;
  let companionProfileId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'avail-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;

    const comp = await registerCompanion({
      email: 'avail-comp@example.com',
      password: 'Password123!',
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;

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

  // ── Set Availability ──────────────────────────────────────────────────

  describe('PUT /api/v1/availability/me', () => {
    it('should set companion availability slots', async () => {
      const res = await request(getHttpServer())
        .put('/api/v1/availability/me')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          slots: [
            {
              dayOfWeek: 'MONDAY',
              startTime: '09:00',
              endTime: '12:00',
              timezone: 'Europe/Paris',
              isRecurring: true,
            },
            {
              dayOfWeek: 'MONDAY',
              startTime: '14:00',
              endTime: '18:00',
              timezone: 'Europe/Paris',
              isRecurring: true,
            },
            {
              dayOfWeek: 'WEDNESDAY',
              startTime: '10:00',
              endTime: '16:00',
            },
          ],
        })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('should replace existing availability', async () => {
      const res = await request(getHttpServer())
        .put('/api/v1/availability/me')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          slots: [
            {
              dayOfWeek: 'FRIDAY',
              startTime: '08:00',
              endTime: '20:00',
            },
          ],
        })
        .expect(200);

      // Should only have 1 non-blocked slot now (previous 3 were replaced)
      const nonBlocked = res.body.filter((s: any) => !s.isBlocked);
      expect(nonBlocked.length).toBe(1);
      expect(nonBlocked[0].dayOfWeek).toBe('FRIDAY');
    });

    it('should reject for non-companion user', async () => {
      await request(getHttpServer())
        .put('/api/v1/availability/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ slots: [] })
        .expect(403);
    });
  });

  // ── Get My Availability ───────────────────────────────────────────────

  describe('GET /api/v1/availability/me', () => {
    it('should return companion own availability', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/availability/me')
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject for non-companion user', async () => {
      await request(getHttpServer())
        .get('/api/v1/availability/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  // ── Get Companion Availability (public) ───────────────────────────────

  describe('GET /api/v1/availability/:companionId', () => {
    it('should return public companion availability (no auth needed)', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/availability/${companionProfileId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── Block Date ────────────────────────────────────────────────────────

  describe('POST /api/v1/availability/me/block', () => {
    let blockId: string;

    it('should block a specific date', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/availability/me/block')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({
          date: '2026-03-15',
          startTime: '10:00',
          endTime: '14:00',
        })
        .expect(201);

      blockId = res.body.id;
      expect(res.body.isBlocked).toBe(true);
      expect(res.body.isRecurring).toBe(false);
      expect(res.body.specificDate).toBeDefined();
    });

    it('should block a full day', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/availability/me/block')
        .set('Authorization', `Bearer ${companionToken}`)
        .send({ date: '2026-03-20' })
        .expect(201);

      expect(res.body.startTime).toBe('00:00');
      expect(res.body.endTime).toBe('23:59');
    });

    // ── Remove Block ──────────────────────────────────────────────────

    it('should remove a blocked date', async () => {
      await request(getHttpServer())
        .delete(`/api/v1/availability/me/block/${blockId}`)
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent block', async () => {
      await request(getHttpServer())
        .delete('/api/v1/availability/me/block/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(404);
    });
  });
});
