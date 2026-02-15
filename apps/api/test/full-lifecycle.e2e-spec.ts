import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  getPrisma,
} from './helpers/test-app';

/**
 * Full end-to-end lifecycle test:
 * 1. Register a user
 * 2. Register a companion
 * 3. Admin approves companion
 * 4. User creates a session
 * 5. User creates a goal
 * 6. User searches for companions
 * 7. User runs matching
 * 8. User selects a companion
 * 9. User creates a contract
 * 10. Both parties accept the contract
 * 11. Session transitions through full lifecycle
 * 12. User rates the companion
 * 13. Companion rates the user
 * 14. Verify reputation updated
 */
describe('Full Session Lifecycle (e2e)', () => {
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionUserId: string;
  let companionProfileId: string;
  let adminToken: string;
  let sessionId: string;
  let goalId: string;
  let contractId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Step 1: Register Users ────────────────────────────────────────────

  it('Step 1: Register a regular user', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'lifecycle-user@example.com',
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Johnson',
        dateOfBirth: '1992-03-15',
      })
      .expect(201);

    userId = res.body.user.id;
    userToken = res.body.accessToken;
    expect(res.body.user.role).toBe('USER');
  });

  it('Step 2: Register a companion', async () => {
    // Register base user
    const reg = await request(getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'lifecycle-comp@example.com',
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Smith',
        dateOfBirth: '1988-07-22',
      })
      .expect(201);

    const tempToken = reg.body.accessToken;

    // Register as companion
    const compRes = await request(getHttpServer())
      .post('/api/v1/companions/register')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({
        bio: 'Certified productivity coach with 5 years experience',
        baseRate: 25,
        expertiseTags: ['productivity', 'focus', 'accountability'],
        driftEnforcement: 'MODERATE',
      })
      .expect(201);

    companionProfileId = compRes.body.id;
    expect(compRes.body.status).toBe('PENDING_REVIEW');

    // Re-login to get COMPANION role token
    const loginRes = await request(getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'lifecycle-comp@example.com', password: 'Password123!' })
      .expect(201);

    companionToken = loginRes.body.accessToken;
    companionUserId = loginRes.body.user.id;
  });

  it('Step 3: Create admin and approve companion', async () => {
    // Create admin
    const adminReg = await request(getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'lifecycle-admin@hushroom.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        dateOfBirth: '1985-01-01',
      })
      .expect(201);

    await getPrisma().user.update({
      where: { id: adminReg.body.user.id },
      data: { role: 'ADMIN' },
    });

    const adminLogin = await request(getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'lifecycle-admin@hushroom.com', password: 'Password123!' })
      .expect(201);

    adminToken = adminLogin.body.accessToken;

    // Admin approves companion
    const approveRes = await request(getHttpServer())
      .post(`/api/v1/admin/companions/${companionProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(approveRes.body.status).toBe('APPROVED');
  });

  // ── Step 4-5: Create Session + Goal ───────────────────────────────────

  it('Step 4: User creates a FOCUS session', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 60 })
      .expect(201);

    sessionId = res.body.id;
    expect(res.body.status).toBe('PENDING_MATCH');
    expect(res.body.type).toBe('FOCUS');
  });

  it('Step 5: User creates a goal for the session', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sessionId,
        title: 'Write project proposal',
        description: 'Draft the full project proposal including budget and timeline sections',
        successCriteria: [
          'Introduction section completed',
          'Budget drafted',
          'Timeline created',
        ],
        keywords: ['productivity', 'writing', 'focus'],
      })
      .expect(201);

    goalId = res.body.id;
    expect(res.body.title).toBe('Write project proposal');
  });

  // ── Step 6: Search Companions ─────────────────────────────────────────

  it('Step 6: User searches for companions', async () => {
    // Set companion online first
    await request(getHttpServer())
      .patch('/api/v1/companions/me/online')
      .set('Authorization', `Bearer ${companionToken}`)
      .send({ isOnline: true })
      .expect(200);

    const res = await request(getHttpServer())
      .get('/api/v1/companions?expertiseTag=productivity')
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const found = res.body.data.find(
      (c: any) => c.id === companionProfileId,
    );
    expect(found).toBeDefined();
  });

  // ── Step 7: Run Matching ──────────────────────────────────────────────

  it('Step 7: User runs matching algorithm', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/matching/find')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sessionId,
        maxPrice: 50,
        expertiseTag: 'productivity',
      })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const match = res.body.find(
      (m: any) => m.companionId === companionProfileId,
    );
    expect(match).toBeDefined();
    expect(match.score).toBeGreaterThan(0);
  });

  // ── Step 8: Select Companion ──────────────────────────────────────────

  it('Step 8: User selects a companion', async () => {
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
  });

  // ── Step 9: Create Contract ───────────────────────────────────────────

  it('Step 9: User creates a session contract', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/contracts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sessionId,
        mode: 'MODERATE',
        rules: [
          { type: 'no-phone', description: 'No phone usage' },
          { type: 'stay-on-topic', description: 'Stay focused on the goal' },
        ],
      })
      .expect(201);

    contractId = res.body.id;
    expect(res.body.mode).toBe('MODERATE');
  });

  // ── Step 10: Both Accept Contract ─────────────────────────────────────

  it('Step 10a: User accepts the contract', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/contracts/${contractId}/accept`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    expect(res.body.acceptedByUser).toBe(true);
    expect(res.body.acceptedByCompanion).toBe(false);
  });

  it('Step 10b: Companion accepts the contract', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/contracts/${contractId}/accept`)
      .set('Authorization', `Bearer ${companionToken}`)
      .expect(201);

    expect(res.body.acceptedByUser).toBe(true);
    expect(res.body.acceptedByCompanion).toBe(true);
    expect(res.body.acceptedAt).toBeDefined();
  });

  // ── Step 11: Session Lifecycle ────────────────────────────────────────

  it('Step 11a: Transition to PAYMENT_AUTHORIZED (DB)', async () => {
    // In a real flow, payment would be authorized via Stripe.
    // For E2E without Stripe, we simulate this step.
    await getPrisma().session.update({
      where: { id: sessionId },
      data: { status: 'PAYMENT_AUTHORIZED' },
    });

    const session = await getPrisma().session.findUnique({ where: { id: sessionId } });
    expect(session!.status).toBe('PAYMENT_AUTHORIZED');
  });

  it('Step 11b: Mark session READY', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/sessions/${sessionId}/ready`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    expect(res.body.status).toBe('READY');
  });

  it('Step 11c: Companion starts the session', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${companionToken}`)
      .expect(201);

    expect(res.body.status).toBe('IN_PROGRESS');
    expect(res.body.startedAt).toBeDefined();
  });

  it('Step 11d: User pauses the session', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    expect(res.body.status).toBe('PAUSED');
  });

  it('Step 11e: Companion resumes the session', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/sessions/${sessionId}/resume`)
      .set('Authorization', `Bearer ${companionToken}`)
      .expect(201);

    expect(res.body.status).toBe('IN_PROGRESS');
  });

  it('Step 11f: User ends the session', async () => {
    const res = await request(getHttpServer())
      .post(`/api/v1/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.endedAt).toBeDefined();
    expect(res.body.durationMinutes).toBeDefined();
  });

  // ── Step 12: Mark Goal Achieved ───────────────────────────────────────

  it('Step 12: User marks goal as achieved', async () => {
    const res = await request(getHttpServer())
      .patch(`/api/v1/goals/${goalId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        isAchieved: true,
        achievementNote: 'All three sections completed and reviewed!',
      })
      .expect(200);

    expect(res.body.isAchieved).toBe(true);
  });

  // ── Step 13: Ratings ──────────────────────────────────────────────────

  it('Step 13a: User rates the companion', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/ratings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sessionId,
        overallScore: 5,
        goalAchievement: 5,
        presenceQuality: 5,
        contractAdherence: 4,
        communication: 5,
        comment: 'Excellent companion, helped me stay focused throughout!',
        isPublic: true,
      })
      .expect(201);

    expect(res.body.overallScore).toBe(5);
    expect(res.body.raterId).toBe(userId);
    expect(res.body.ratedUserId).toBe(companionUserId);
  });

  it('Step 13b: Companion rates the user', async () => {
    const res = await request(getHttpServer())
      .post('/api/v1/ratings')
      .set('Authorization', `Bearer ${companionToken}`)
      .send({
        sessionId,
        overallScore: 4,
        goalAchievement: 5,
        presenceQuality: 4,
        comment: 'Dedicated user, great to work with',
      })
      .expect(201);

    expect(res.body.raterId).toBe(companionUserId);
    expect(res.body.ratedUserId).toBe(userId);
  });

  // ── Step 14: Verify Final State ───────────────────────────────────────

  it('Step 14a: Verify session is COMPLETED with all data', async () => {
    const res = await request(getHttpServer())
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.goal).toBeDefined();
    expect(res.body.goal.isAchieved).toBe(true);
    expect(res.body.contract).toBeDefined();
    expect(res.body.companion).toBeDefined();
  });

  it('Step 14b: Verify session ratings exist', async () => {
    const res = await request(getHttpServer())
      .get(`/api/v1/ratings/session/${sessionId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it('Step 14c: Verify companion reputation updated', async () => {
    const companion = await getPrisma().companionProfile.findUnique({
      where: { id: companionProfileId },
    });

    expect(Number(companion!.averageRating)).toBeGreaterThan(0);
    expect(Number(companion!.reputationScore)).toBeGreaterThan(0);
  });

  it('Step 14d: Admin can see the session in dashboard', async () => {
    const res = await request(getHttpServer())
      .get('/api/v1/admin/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const found = res.body.sessions.find((s: any) => s.id === sessionId);
    expect(found).toBeDefined();
    expect(found.status).toBe('COMPLETED');
  });

  it('Step 14e: Admin can see audit logs', async () => {
    const res = await request(getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.logs.length).toBeGreaterThan(0);

    const actions = res.body.logs.map((l: any) => l.action);
    expect(actions).toContain('USER_REGISTER');
    expect(actions).toContain('SESSION_CREATE');
  });
});
