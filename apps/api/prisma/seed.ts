import { PrismaClient } from '@prisma/client';
import { CONTRACT_TEMPLATES } from '@hushroom/shared-constants';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ─── Contract templates ──────────────────────────────────
  console.log('Seeding contract templates...');
  for (const template of CONTRACT_TEMPLATES) {
    await prisma.contractTemplate.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        sessionType: template.sessionType as any,
        mode: template.mode as any,
        rules: template.rules,
      },
      create: {
        name: template.name,
        description: template.description,
        sessionType: template.sessionType as any,
        mode: template.mode as any,
        rules: template.rules,
      },
    });
  }
  console.log(`  ${CONTRACT_TEMPLATES.length} contract templates seeded.`);

  // ─── Demo users ──────────────────────────────────────────
  console.log('\nSeeding demo users...');
  const hash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hushroom.com' },
    update: {},
    create: {
      email: 'admin@hushroom.com',
      passwordHash: hash,
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin',
      role: 'ADMIN',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1990-01-01'),
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      passwordHash: hash,
      firstName: 'Sarah',
      lastName: 'Chen',
      displayName: 'Sarah C.',
      role: 'USER',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1995-03-15'),
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@example.com' },
    update: {},
    create: {
      email: 'marcus@example.com',
      passwordHash: hash,
      firstName: 'Marcus',
      lastName: 'Johnson',
      displayName: 'Marcus J.',
      role: 'USER',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1992-07-22'),
    },
  });

  const aisha = await prisma.user.upsert({
    where: { email: 'aisha@example.com' },
    update: {},
    create: {
      email: 'aisha@example.com',
      passwordHash: hash,
      firstName: 'Aisha',
      lastName: 'Rahman',
      displayName: 'Aisha R.',
      role: 'USER',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1998-11-05'),
    },
  });

  // ─── Companion users ─────────────────────────────────────
  const elena = await prisma.user.upsert({
    where: { email: 'elena@example.com' },
    update: {},
    create: {
      email: 'elena@example.com',
      passwordHash: hash,
      firstName: 'Elena',
      lastName: 'Vasquez',
      displayName: 'Elena V.',
      role: 'COMPANION',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1988-06-12'),
    },
  });

  const james = await prisma.user.upsert({
    where: { email: 'james@example.com' },
    update: {},
    create: {
      email: 'james@example.com',
      passwordHash: hash,
      firstName: 'James',
      lastName: 'Okafor',
      displayName: 'James O.',
      role: 'COMPANION',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1991-02-28'),
    },
  });

  const yuki = await prisma.user.upsert({
    where: { email: 'yuki@example.com' },
    update: {},
    create: {
      email: 'yuki@example.com',
      passwordHash: hash,
      firstName: 'Yuki',
      lastName: 'Tanaka',
      displayName: 'Yuki T.',
      role: 'COMPANION',
      isEmailVerified: true,
      isAgeVerified: true,
      dateOfBirth: new Date('1993-09-18'),
    },
  });

  console.log('  7 demo users seeded.');

  // ─── Companion profiles ──────────────────────────────────
  console.log('\nSeeding companion profiles...');

  const elenaProfile = await prisma.companionProfile.upsert({
    where: { userId: elena.id },
    update: {},
    create: {
      userId: elena.id,
      type: 'VERIFIED',
      bio: 'Certified life coach specializing in academic goals and study accountability. 5+ years helping students stay focused.',
      expertiseTags: ['academic', 'focus', 'study', 'habits'],
      baseRate: 25.00,
      status: 'APPROVED',
      isOnline: true,
      averageRating: 4.85,
      reputationScore: 4.72,
      totalSessions: 147,
      successRate: 92.50,
      lastActiveAt: new Date(),
    },
  });

  const jamesProfile = await prisma.companionProfile.upsert({
    where: { userId: james.id },
    update: {},
    create: {
      userId: james.id,
      type: 'EXPERT',
      bio: 'Former athlete turned accountability coach. Specializing in fitness goals, habit formation, and mental resilience.',
      expertiseTags: ['fitness', 'habits', 'wellness', 'discipline'],
      baseRate: 30.00,
      status: 'APPROVED',
      isOnline: true,
      averageRating: 4.92,
      reputationScore: 4.88,
      totalSessions: 203,
      successRate: 95.10,
      lastActiveAt: new Date(),
    },
  });

  const yukiProfile = await prisma.companionProfile.upsert({
    where: { userId: yuki.id },
    update: {},
    create: {
      userId: yuki.id,
      type: 'STANDARD',
      bio: 'Creative professional helping with artistic projects, writing goals, and creative blocks. Warm and encouraging presence.',
      expertiseTags: ['creative', 'writing', 'focus', 'art'],
      baseRate: 20.00,
      status: 'APPROVED',
      isOnline: false,
      averageRating: 4.67,
      reputationScore: 4.45,
      totalSessions: 89,
      successRate: 88.70,
      lastActiveAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('  3 companion profiles seeded.');

  // ─── Availability ────────────────────────────────────────
  console.log('\nSeeding availability...');
  const days: Array<'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'> = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY',
  ];

  for (const profile of [elenaProfile, jamesProfile, yukiProfile]) {
    for (const day of days) {
      await prisma.availability.upsert({
        where: {
          companionId_dayOfWeek_startTime_endTime: {
            companionId: profile.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
          },
        },
        update: {},
        create: {
          companionId: profile.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'Europe/Paris',
        },
      });
    }
  }
  console.log('  15 availability slots seeded.');

  // ─── Demo session with ratings ───────────────────────────
  console.log('\nSeeding demo session...');

  const session = await prisma.session.create({
    data: {
      userId: sarah.id,
      companionId: elenaProfile.id,
      type: 'FOCUS',
      status: 'COMPLETED',
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      durationMinutes: 60,
      plannedDuration: 60,
      goal: {
        create: {
          title: 'Complete thesis literature review',
          description: 'Read and annotate 15 research papers for masters thesis.',
          successCriteria: ['Read 5 papers', 'Write annotations', 'Complete bibliography'],
          keywords: ['academic', 'research', 'thesis'],
        },
      },
      contract: {
        create: {
          mode: 'MODERATE',
          rules: {
            noPhoneUsage: true,
            breakInterval: 25,
            breakDuration: 5,
            focusTopics: ['reading', 'annotating', 'note-taking'],
          },
          acceptedByUser: true,
          acceptedByCompanion: true,
          acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  await prisma.rating.createMany({
    data: [
      {
        sessionId: session.id,
        raterId: sarah.id,
        ratedUserId: elena.id,
        overallScore: 5,
        goalAchievement: 5,
        presenceQuality: 5,
        contractAdherence: 4,
        communication: 5,
        comment: 'Elena was incredibly supportive. Her structured approach helped me stay focused for the full hour.',
        isPublic: true,
      },
      {
        sessionId: session.id,
        raterId: elena.id,
        ratedUserId: sarah.id,
        overallScore: 5,
        goalAchievement: 4,
        presenceQuality: 5,
        contractAdherence: 5,
        communication: 4,
        comment: 'Sarah was very committed and followed the contract precisely.',
        isPublic: true,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      sessionId: session.id,
      userId: sarah.id,
      amount: 25.00,
      currency: 'EUR',
      commissionRate: 0.25,
      platformFee: 6.25,
      companionPayout: 18.75,
      status: 'CAPTURED',
      stripePaymentIntentId: 'pi_demo_' + session.id.slice(0, 8),
    },
  });

  console.log('  1 completed session with ratings and payment seeded.');

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n──────────────────────────────────────');
  console.log('Seed complete!');
  console.log('──────────────────────────────────────');
  console.log('Demo accounts (password: Password123!):');
  console.log('  Admin:     admin@hushroom.com');
  console.log('  User:      sarah@example.com');
  console.log('  User:      marcus@example.com');
  console.log('  User:      aisha@example.com');
  console.log('  Companion: elena@example.com');
  console.log('  Companion: james@example.com');
  console.log('  Companion: yuki@example.com');
  console.log('──────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
