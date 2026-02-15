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
  getRedis,
} from './helpers/test-app';

describe('Auth Module (e2e)', () => {
  beforeAll(async () => {
    await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await closeTestApp();
  });

  // ── Register ──────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'auth-test@example.com',
          password: 'Password123!',
          firstName: 'Auth',
          lastName: 'Test',
          dateOfBirth: '1995-05-20',
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('auth-test@example.com');
      expect(res.body.user.firstName).toBe('Auth');
      expect(res.body.user.role).toBe('USER');
      expect(res.body.user.isAgeVerified).toBe(true);
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'auth-test@example.com',
          password: 'Password123!',
          firstName: 'Dup',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
        })
        .expect(409);
    });

    it('should reject underage user (< 18)', async () => {
      const today = new Date();
      const underageDob = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

      await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'underage@example.com',
          password: 'Password123!',
          firstName: 'Young',
          lastName: 'User',
          dateOfBirth: underageDob.toISOString().split('T')[0],
        })
        .expect(403);
    });

    it('should reject invalid email format', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          firstName: 'Bad',
          lastName: 'Email',
          dateOfBirth: '1990-01-01',
        })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: 'short',
          firstName: 'Weak',
          lastName: 'Pass',
          dateOfBirth: '1990-01-01',
        })
        .expect(400);
    });

    it('should reject extra fields (forbidNonWhitelisted)', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'extra@example.com',
          password: 'Password123!',
          firstName: 'Extra',
          lastName: 'Fields',
          dateOfBirth: '1990-01-01',
          isAdmin: true,
        })
        .expect(400);
    });
  });

  // ── Login ─────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'auth-test@example.com', password: 'Password123!' })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('auth-test@example.com');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'auth-test@example.com', password: 'WrongPassword1' })
        .expect(401);
    });

    it('should reject non-existent email', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(401);
    });
  });

  // ── Refresh Token ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const login = await loginUser('auth-test@example.com', 'Password123!');

      const res = await request(getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.refreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // New refresh token should be different (rotation)
      expect(res.body.refreshToken).not.toBe(login.refreshToken);
    });

    it('should reject already-used refresh token (rotation)', async () => {
      const login = await loginUser('auth-test@example.com', 'Password123!');
      const oldToken = login.refreshToken;

      // Use it once
      await request(getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldToken })
        .expect(201);

      // Try to use it again — should be revoked
      await request(getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldToken })
        .expect(401);
    });

    it('should reject invalid refresh token', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-12345' })
        .expect(401);
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and revoke refresh token', async () => {
      const login = await loginUser('auth-test@example.com', 'Password123!');

      await request(getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: login.refreshToken })
        .expect(201);

      // Refresh token should no longer work
      await request(getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.refreshToken })
        .expect(401);
    });
  });

  // ── Verify Email ──────────────────────────────────────────────────────

  describe('POST /api/v1/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      // Register a new user to get a fresh email token
      const reg = await registerUser({
        email: 'verify-email@example.com',
        password: 'Password123!',
      });

      // Find the token stored in Redis
      const r = getRedis();
      const keys = await r.keys('email-verify:*');
      let verifyToken: string | null = null;

      for (const key of keys) {
        const userId = await r.get(key);
        if (userId === reg.user.id) {
          verifyToken = key.replace('email-verify:', '');
          break;
        }
      }

      expect(verifyToken).toBeTruthy();

      const res = await request(getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verifyToken })
        .expect(201);

      expect(res.body.message).toContain('verified');

      // Verify user is now email-verified in DB
      const user = await getPrisma().user.findUnique({
        where: { id: reg.user.id },
      });
      expect(user!.isEmailVerified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'bad-token-12345' })
        .expect(400);
    });
  });

  // ── Forgot Password ───────────────────────────────────────────────────

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success message for existing email', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'auth-test@example.com' })
        .expect(201);

      expect(res.body.message).toContain('reset link');
    });

    it('should return same message for non-existent email (no leak)', async () => {
      const res = await request(getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'doesnotexist@example.com' })
        .expect(201);

      expect(res.body.message).toContain('reset link');
    });
  });

  // ── Reset Password ────────────────────────────────────────────────────

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Trigger forgot password
      await request(getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'auth-test@example.com' })
        .expect(201);

      // Find reset token in Redis
      const r = getRedis();
      const keys = await r.keys('password-reset:*');
      expect(keys.length).toBeGreaterThan(0);

      const resetToken = keys[0].replace('password-reset:', '');

      const res = await request(getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword456!' })
        .expect(201);

      expect(res.body.message).toContain('reset successfully');

      // Should be able to login with new password
      await request(getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'auth-test@example.com', password: 'NewPassword456!' })
        .expect(201);
    });

    it('should reject invalid reset token', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-reset-token', password: 'NewPassword123!' })
        .expect(400);
    });
  });

  // ── Verify Age ────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/verify-age', () => {
    it('should verify age for authenticated user', async () => {
      const login = await loginUser('auth-test@example.com', 'NewPassword456!');

      const res = await request(getHttpServer())
        .post('/api/v1/auth/verify-age')
        .set('Authorization', `Bearer ${login.accessToken}`)
        .send({ dateOfBirth: '1990-06-15' })
        .expect(201);

      expect(res.body.message).toContain('verified');
    });

    it('should reject underage date of birth', async () => {
      const login = await loginUser('auth-test@example.com', 'NewPassword456!');
      const today = new Date();
      const underageDob = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

      await request(getHttpServer())
        .post('/api/v1/auth/verify-age')
        .set('Authorization', `Bearer ${login.accessToken}`)
        .send({ dateOfBirth: underageDob.toISOString().split('T')[0] })
        .expect(403);
    });

    it('should reject unauthenticated request', async () => {
      await request(getHttpServer())
        .post('/api/v1/auth/verify-age')
        .send({ dateOfBirth: '1990-06-15' })
        .expect(401);
    });
  });
});
