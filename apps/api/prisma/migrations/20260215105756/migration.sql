-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'COMPANION', 'ADMIN');

-- CreateEnum
CREATE TYPE "CompanionType" AS ENUM ('STANDARD', 'VERIFIED', 'EXPERT');

-- CreateEnum
CREATE TYPE "CompanionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('FOCUS', 'DECISION', 'EMOTIONAL_UNLOAD', 'PLANNING');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING_MATCH', 'MATCHED', 'PAYMENT_AUTHORIZED', 'READY', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ABANDONED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ContractMode" AS ENUM ('STRICT', 'MODERATE', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "DriftSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('TECHNICAL_FAILURE', 'COMPANION_NO_SHOW', 'ADMIN_OVERRIDE');

-- CreateEnum
CREATE TYPE "AvailabilityDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_REGISTER', 'USER_LOGIN', 'USER_DELETE', 'SESSION_CREATE', 'SESSION_START', 'SESSION_END', 'PAYMENT_AUTHORIZE', 'PAYMENT_CAPTURE', 'PAYMENT_REFUND', 'COMPANION_APPROVE', 'COMPANION_SUSPEND', 'ADMIN_ACTION', 'DATA_EXPORT', 'DATA_DELETION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isAgeVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CompanionType" NOT NULL DEFAULT 'STANDARD',
    "status" "CompanionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "bio" TEXT,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "expertPremium" DECIMAL(10,2),
    "expertiseTags" TEXT[],
    "certifications" JSONB,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectAccountId" TEXT,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reputationScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "driftEnforcement" "ContractMode" NOT NULL DEFAULT 'MODERATE',
    "maxConcurrent" INTEGER NOT NULL DEFAULT 1,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "dayOfWeek" "AvailabilityDay" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT,
    "type" "SessionType" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING_MATCH',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "plannedDuration" INTEGER NOT NULL DEFAULT 30,
    "livekitRoomName" TEXT,
    "metadata" JSONB,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "successCriteria" TEXT[],
    "keywords" TEXT[],
    "isAchieved" BOOLEAN,
    "achievementNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT,
    "mode" "ContractMode" NOT NULL DEFAULT 'MODERATE',
    "rules" JSONB NOT NULL,
    "acceptedByUser" BOOLEAN NOT NULL DEFAULT false,
    "acceptedByCompanion" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "mode" "ContractMode" NOT NULL,
    "rules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drift_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "severity" "DriftSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerData" JSONB,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drift_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "goalAchievement" INTEGER,
    "presenceQuality" INTEGER,
    "contractAdherence" INTEGER,
    "communication" INTEGER,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "companionPayout" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(10,2),
    "refundReason" "RefundReason",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'native',
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "language_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "sessionId" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "companion_profiles_userId_key" ON "companion_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_profiles_stripeConnectAccountId_key" ON "companion_profiles"("stripeConnectAccountId");

-- CreateIndex
CREATE INDEX "companion_profiles_type_status_idx" ON "companion_profiles"("type", "status");

-- CreateIndex
CREATE INDEX "companion_profiles_isOnline_idx" ON "companion_profiles"("isOnline");

-- CreateIndex
CREATE INDEX "companion_profiles_reputationScore_idx" ON "companion_profiles"("reputationScore");

-- CreateIndex
CREATE INDEX "availability_companionId_idx" ON "availability"("companionId");

-- CreateIndex
CREATE INDEX "availability_dayOfWeek_idx" ON "availability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "availability_companionId_dayOfWeek_startTime_endTime_key" ON "availability"("companionId", "dayOfWeek", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_livekitRoomName_key" ON "sessions"("livekitRoomName");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_companionId_idx" ON "sessions"("companionId");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_scheduledAt_idx" ON "sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "sessions_type_idx" ON "sessions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "goals_sessionId_key" ON "goals"("sessionId");

-- CreateIndex
CREATE INDEX "goals_sessionId_idx" ON "goals"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_sessionId_key" ON "contracts"("sessionId");

-- CreateIndex
CREATE INDEX "contracts_sessionId_idx" ON "contracts"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "contract_templates_name_key" ON "contract_templates"("name");

-- CreateIndex
CREATE INDEX "contract_templates_sessionType_idx" ON "contract_templates"("sessionType");

-- CreateIndex
CREATE INDEX "contract_templates_isActive_idx" ON "contract_templates"("isActive");

-- CreateIndex
CREATE INDEX "drift_logs_sessionId_idx" ON "drift_logs"("sessionId");

-- CreateIndex
CREATE INDEX "drift_logs_severity_idx" ON "drift_logs"("severity");

-- CreateIndex
CREATE INDEX "ratings_sessionId_idx" ON "ratings"("sessionId");

-- CreateIndex
CREATE INDEX "ratings_ratedUserId_idx" ON "ratings"("ratedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_sessionId_raterId_key" ON "ratings"("sessionId", "raterId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_sessionId_key" ON "payments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_sessionId_idx" ON "payments"("sessionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_stripePaymentIntentId_idx" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "language_preferences_userId_idx" ON "language_preferences"("userId");

-- CreateIndex
CREATE INDEX "language_preferences_language_idx" ON "language_preferences"("language");

-- CreateIndex
CREATE UNIQUE INDEX "language_preferences_userId_language_key" ON "language_preferences"("userId", "language");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "abuse_reports_reportedUserId_idx" ON "abuse_reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "abuse_reports_status_idx" ON "abuse_reports"("status");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_profiles" ADD CONSTRAINT "companion_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companion_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companion_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_logs" ADD CONSTRAINT "drift_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_preferences" ADD CONSTRAINT "language_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
