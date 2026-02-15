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

/**
 * Payment tests that can run without Stripe.
 * Tests that hit Stripe APIs (authorize, capture, refund, onboard) are marked
 * to be conditionally skipped if STRIPE_SECRET_KEY is not set or is a placeholder.
 */
const hasStripe = !!process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

describe('Payments Module (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionProfileId: string;
  let companionUserId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    const user = await registerUser({
      email: 'pay-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    const comp = await registerCompanion({
      email: 'pay-comp@example.com',
      password: 'Password123!',
      baseRate: 30,
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;
    companionUserId = comp.user.id;

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

  // ── Get Payments (empty) ──────────────────────────────────────────────

  describe('GET /api/v1/payments', () => {
    it('should return empty payments list initially', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .get('/api/v1/payments')
        .expect(401);
    });
  });

  // ── Get Payment by ID ─────────────────────────────────────────────────

  describe('GET /api/v1/payments/:id', () => {
    it('should return 404 for non-existent payment', async () => {
      await request(getHttpServer())
        .get('/api/v1/payments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  // ── Authorize Payment ─────────────────────────────────────────────────

  describe('POST /api/v1/payments/authorize', () => {
    it('should reject payment for session without companion', async () => {
      const session = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS', plannedDuration: 60 })
        .expect(201);

      await request(getHttpServer())
        .post('/api/v1/payments/authorize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sessionId: session.body.id })
        .expect(400);
    });

    it('should reject payment for session not in MATCHED status', async () => {
      const session = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      // Session is in PENDING_MATCH, not MATCHED
      await request(getHttpServer())
        .post('/api/v1/payments/authorize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sessionId: session.body.id })
        .expect(400);
    });

    it('should reject payment authorization by non-session-owner', async () => {
      const session = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      await getPrisma().session.update({
        where: { id: session.body.id },
        data: { companionId: companionProfileId, status: 'MATCHED' },
      });

      const otherUser = await registerUser({
        email: 'pay-other@example.com',
        password: 'Password123!',
      });

      await request(getHttpServer())
        .post('/api/v1/payments/authorize')
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({ sessionId: session.body.id })
        .expect(403);
    });
  });

  // ── Payment with DB-seeded data (no Stripe) ──────────────────────────

  describe('Payment operations with seeded data', () => {
    let paymentId: string;
    let testSessionId: string;

    beforeAll(async () => {
      // Create a session matched to companion
      const session = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS', plannedDuration: 60 })
        .expect(201);

      testSessionId = session.body.id;

      await getPrisma().session.update({
        where: { id: testSessionId },
        data: { companionId: companionProfileId, status: 'PAYMENT_AUTHORIZED' },
      });

      // Seed a payment directly in DB
      const payment = await getPrisma().payment.create({
        data: {
          sessionId: testSessionId,
          userId,
          amount: 30,
          companionPayout: 21,
          platformFee: 9,
          commissionRate: 0.3,
          currency: 'EUR',
          status: 'AUTHORIZED',
          authorizedAt: new Date(),
        },
      });

      paymentId = payment.id;
    });

    it('should get payment by ID', async () => {
      const res = await request(getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.id).toBe(paymentId);
      expect(res.body.status).toBe('AUTHORIZED');
      expect(res.body.session).toBeDefined();
    });

    it('should list user payments', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Companion Earnings ────────────────────────────────────────────────

  describe('GET /api/v1/payments/companion/earnings', () => {
    it('should return companion earnings', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/payments/companion/earnings')
        .set('Authorization', `Bearer ${companionToken}`)
        .expect(200);

      expect(res.body.totalEarnings).toBeDefined();
      expect(res.body.pendingPayouts).toBeDefined();
      expect(res.body.completedPayouts).toBeDefined();
      expect(res.body.recentPayments).toBeDefined();
    });

    it('should return zero earnings for user without companion profile', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/payments/companion/earnings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.totalEarnings).toBe(0);
    });
  });
});
