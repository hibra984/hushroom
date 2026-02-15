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

describe('Admin Module (e2e)', () => {
  let adminToken: string;
  let adminId: string;
  let userToken: string;
  let userId: string;
  let companionToken: string;
  let companionProfileId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    // Create an admin user
    const admin = await registerUser({
      email: 'admin-test@hushroom.com',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'Test',
    });
    adminId = admin.user.id;

    // Promote to admin
    await getPrisma().user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Re-login to get token with ADMIN role
    const adminLogin = await loginUser('admin-test@hushroom.com', 'Password123!');
    adminToken = adminLogin.accessToken;

    // Create a regular user
    const user = await registerUser({
      email: 'admin-user@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    // Create a companion (pending review)
    const comp = await registerCompanion({
      email: 'admin-comp@example.com',
      password: 'Password123!',
    });
    companionToken = comp.accessToken;
    companionProfileId = comp.companionProfile.id;

    // Create a session for stats
    await request(getHttpServer())
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'FOCUS', plannedDuration: 30 })
      .expect(201);
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Role Protection ───────────────────────────────────────────────────

  describe('Role-based access', () => {
    it('should reject non-admin user', async () => {
      await request(getHttpServer())
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .get('/api/v1/admin/stats')
        .expect(401);
    });
  });

  // ── Platform Stats ────────────────────────────────────────────────────

  describe('GET /api/v1/admin/stats', () => {
    it('should return platform statistics', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalUsers).toBeDefined();
      expect(typeof res.body.totalUsers).toBe('number');
      expect(res.body.totalCompanions).toBeDefined();
      expect(res.body.totalSessions).toBeDefined();
      expect(res.body.completedSessions).toBeDefined();
      expect(res.body.totalPayments).toBeDefined();
      expect(res.body.totalRevenue).toBeDefined();
      expect(res.body.pendingReports).toBeDefined();
    });
  });

  // ── Users Management ──────────────────────────────────────────────────

  describe('GET /api/v1/admin/users', () => {
    it('should list all users with pagination', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.page).toBe(1);
      expect(res.body.totalPages).toBeDefined();
    });

    it('should support search', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/users?search=admin-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.limit).toBe(2);
      expect(res.body.users.length).toBeLessThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/admin/users/:id', () => {
    it('should update user active status', async () => {
      const res = await request(getHttpServer())
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);

      // Restore
      await request(getHttpServer())
        .patch(`/api/v1/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);
    });

    it('should update user role', async () => {
      const newUser = await registerUser({
        email: 'promote-me@example.com',
        password: 'Password123!',
      });

      const res = await request(getHttpServer())
        .patch(`/api/v1/admin/users/${newUser.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' })
        .expect(200);

      expect(res.body.role).toBe('ADMIN');
    });
  });

  // ── Companion Management ──────────────────────────────────────────────

  describe('GET /api/v1/admin/companions/pending', () => {
    it('should return pending companions', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/companions/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      for (const comp of res.body) {
        expect(comp.status).toBe('PENDING_REVIEW');
      }
    });
  });

  describe('POST /api/v1/admin/companions/:id/approve', () => {
    it('should approve a pending companion', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/admin/companions/${companionProfileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.status).toBe('APPROVED');
    });

    it('should reject approving already approved companion', async () => {
      await request(getHttpServer())
        .post(`/api/v1/admin/companions/${companionProfileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('POST /api/v1/admin/companions/:id/suspend', () => {
    it('should suspend a companion', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/admin/companions/${companionProfileId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      expect(res.body.status).toBe('SUSPENDED');
      expect(res.body.isOnline).toBe(false);
    });
  });

  // ── Sessions Management ───────────────────────────────────────────────

  describe('GET /api/v1/admin/sessions', () => {
    it('should list all sessions', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.sessions).toBeDefined();
      expect(res.body.total).toBeDefined();
      expect(res.body.page).toBe(1);
    });

    it('should filter by status', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/sessions?status=PENDING_MATCH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const session of res.body.sessions) {
        expect(session.status).toBe('PENDING_MATCH');
      }
    });
  });

  // ── Payments Management ───────────────────────────────────────────────

  describe('GET /api/v1/admin/payments', () => {
    it('should list all payments', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.payments).toBeDefined();
      expect(res.body.total).toBeDefined();
    });
  });

  // ── Audit Logs ────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/audit-logs', () => {
    it('should list audit logs', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.logs).toBeDefined();
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.total).toBeDefined();
    });

    it('should filter by action', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/audit-logs?action=USER_REGISTER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const log of res.body.logs) {
        expect(log.action).toBe('USER_REGISTER');
      }
    });

    it('should support pagination', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.limit).toBe(5);
      expect(res.body.logs.length).toBeLessThanOrEqual(5);
    });
  });
});
