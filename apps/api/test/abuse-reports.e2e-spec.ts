import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getHttpServer,
  cleanDatabase,
  cleanRedis,
  registerUser,
  loginUser,
  getPrisma,
} from './helpers/test-app';

describe('Abuse Reports Module (e2e)', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let reportedUserId: string;

  beforeAll(async () => {
    await createTestApp();
    await cleanDatabase();
    await cleanRedis();

    // Create admin
    const admin = await registerUser({
      email: 'abuse-admin@hushroom.com',
      password: 'Password123!',
    });
    await getPrisma().user.update({
      where: { id: admin.user.id },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await loginUser('abuse-admin@hushroom.com', 'Password123!');
    adminToken = adminLogin.accessToken;

    // Create reporting user
    const user = await registerUser({
      email: 'abuse-reporter@example.com',
      password: 'Password123!',
    });
    userToken = user.accessToken;
    userId = user.user.id;

    // Create reported user
    const reported = await registerUser({
      email: 'abuse-target@example.com',
      password: 'Password123!',
    });
    reportedUserId = reported.user.id;
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Create Abuse Report ───────────────────────────────────────────────

  describe('POST /api/v1/reports', () => {
    let reportId: string;

    it('should create an abuse report', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId,
          reason: 'Harassment',
          description: 'User was sending inappropriate messages during the session',
        })
        .expect(201);

      reportId = res.body.id;
      expect(res.body.reporterId).toBe(userId);
      expect(res.body.reportedUserId).toBe(reportedUserId);
      expect(res.body.reason).toBe('Harassment');
      expect(res.body.status).toBe('PENDING');
    });

    it('should create a report with sessionId', async () => {
      // Create a session for context
      const session = await request(getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'FOCUS' })
        .expect(201);

      const res = await request(getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId,
          sessionId: session.body.id,
          reason: 'No show',
          description: 'The companion did not show up for the session',
        })
        .expect(201);

      expect(res.body.sessionId).toBe(session.body.id);
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .post('/api/v1/reports')
        .send({
          reportedUserId,
          reason: 'Test',
          description: 'Should fail',
        })
        .expect(401);
    });

    // ── Admin Report Management ───────────────────────────────────────

    it('admin should list reports', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.reports).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('admin should filter reports by status', async () => {
      const res = await request(getHttpServer())
        .get('/api/v1/admin/reports?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const report of res.body.reports) {
        expect(report.status).toBe('PENDING');
      }
    });

    it('admin should resolve a report', async () => {
      const res = await request(getHttpServer())
        .post(`/api/v1/admin/reports/${reportId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminNotes: 'Confirmed harassment, warning issued' })
        .expect(201);

      expect(res.body.status).toBe('RESOLVED');
      expect(res.body.adminNotes).toBe('Confirmed harassment, warning issued');
      expect(res.body.resolvedAt).toBeDefined();
    });

    it('admin should dismiss a report', async () => {
      // Create another report to dismiss
      const newReport = await request(getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportedUserId,
          reason: 'False report',
          description: 'This is a test false report',
        })
        .expect(201);

      const res = await request(getHttpServer())
        .post(`/api/v1/admin/reports/${newReport.body.id}/dismiss`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ adminNotes: 'False report, no action needed' })
        .expect(201);

      expect(res.body.status).toBe('DISMISSED');
    });
  });

  // ── Auto-Suspend ──────────────────────────────────────────────────────

  describe('Auto-suspend on 3+ pending reports', () => {
    it('should auto-suspend user after 3 pending reports in 30 days', async () => {
      // Create a fresh target user
      const target = await registerUser({
        email: 'auto-suspend@example.com',
        password: 'Password123!',
      });

      // Create 3 reports from different users
      const reporters = [];
      for (let i = 0; i < 3; i++) {
        const reporter = await registerUser({
          email: `reporter-${i}@example.com`,
          password: 'Password123!',
        });
        reporters.push(reporter);
      }

      for (const reporter of reporters) {
        await request(getHttpServer())
          .post('/api/v1/reports')
          .set('Authorization', `Bearer ${reporter.accessToken}`)
          .send({
            reportedUserId: target.user.id,
            reason: 'Abuse',
            description: 'Repeated bad behavior',
          })
          .expect(201);
      }

      // Check that the user is now deactivated
      const user = await getPrisma().user.findUnique({
        where: { id: target.user.id },
      });
      expect(user!.isActive).toBe(false);
    });
  });
});
