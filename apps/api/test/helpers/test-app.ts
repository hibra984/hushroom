import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { RedisService } from '../../src/common/redis/redis.service';

let app: INestApplication;
let prisma: PrismaService;
let redis: RedisService;

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  prisma = app.get(PrismaService);
  redis = app.get(RedisService);

  return app;
}

export function getApp(): INestApplication {
  return app;
}

export function getPrisma(): PrismaService {
  return prisma;
}

export function getRedis(): RedisService {
  return redis;
}

export function getHttpServer() {
  return app.getHttpServer();
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
  }
}

/**
 * Register a new user and return user + tokens.
 */
export async function registerUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}) {
  const res = await request(getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      email: data.email,
      password: data.password,
      firstName: data.firstName ?? 'Test',
      lastName: data.lastName ?? 'User',
      dateOfBirth: data.dateOfBirth ?? '1995-01-15',
    })
    .expect(201);

  return res.body;
}

/**
 * Login and return user + tokens.
 */
export async function loginUser(email: string, password: string) {
  const res = await request(getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(201);

  return res.body;
}

/**
 * Register a user, then register them as a companion. Returns user + companion data + tokens.
 */
export async function registerCompanion(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  baseRate?: number;
}) {
  const registerRes = await registerUser({
    email: data.email,
    password: data.password,
    firstName: data.firstName ?? 'Companion',
    lastName: data.lastName ?? 'Test',
  });

  const companionRes = await request(getHttpServer())
    .post('/api/v1/companions/register')
    .set('Authorization', `Bearer ${registerRes.accessToken}`)
    .send({
      bio: data.bio ?? 'Test companion bio for E2E testing',
      baseRate: data.baseRate ?? 25.0,
      expertiseTags: ['focus', 'productivity'],
      driftEnforcement: 'MODERATE',
    })
    .expect(201);

  // Re-login to get token with updated COMPANION role
  const loginRes = await loginUser(data.email, data.password);

  return {
    user: loginRes.user,
    accessToken: loginRes.accessToken,
    refreshToken: loginRes.refreshToken,
    companionProfile: companionRes.body,
  };
}

/**
 * Clean up test data from the database.
 * Deletes all data in the correct order to respect foreign key constraints.
 */
export async function cleanDatabase() {
  const p = getPrisma();
  await p.$transaction([
    p.driftLog.deleteMany(),
    p.rating.deleteMany(),
    p.payment.deleteMany(),
    p.contract.deleteMany(),
    p.goal.deleteMany(),
    p.session.deleteMany(),
    p.availability.deleteMany(),
    p.abuseReport.deleteMany(),
    p.auditLog.deleteMany(),
    p.languagePreference.deleteMany(),
    p.refreshToken.deleteMany(),
    p.companionProfile.deleteMany(),
    p.contractTemplate.deleteMany(),
    p.user.deleteMany(),
  ]);
}

/**
 * Flush all keys in test Redis.
 */
export async function cleanRedis() {
  await getRedis().flushdb();
}
