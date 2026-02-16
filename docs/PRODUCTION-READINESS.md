# Hushroom Production Readiness Plan

> Complete roadmap from current state to production-ready platform.

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Critical Bug Fixes (Day 1)](#2-critical-bug-fixes-day-1)
3. [Infrastructure Setup (Week 1-2)](#3-infrastructure-setup-week-1-2)
4. [Security Hardening (Week 2-3)](#4-security-hardening-week-2-3)
5. [Monitoring & Observability (Week 3-4)](#5-monitoring--observability-week-3-4)
6. [Email Integration (Week 2)](#6-email-integration-week-2)
7. [Payment Production Readiness (Week 3-4)](#7-payment-production-readiness-week-3-4)
8. [Real-time & Media Production (Week 4-5)](#8-real-time--media-production-week-4-5)
9. [Data & Privacy Compliance (Week 3-4)](#9-data--privacy-compliance-week-3-4)
10. [Performance & Scaling (Week 5-6)](#10-performance--scaling-week-5-6)
11. [Mobile App (Week 6-10)](#11-mobile-app-week-6-10)
12. [DevOps & Reliability (Week 4-5)](#12-devops--reliability-week-4-5)
13. [Testing & Quality (Week 5-6)](#13-testing--quality-week-5-6)
14. [Analytics & Business Intelligence (Week 6-7)](#14-analytics--business-intelligence-week-6-7)
15. [Content & Marketing Readiness (Week 7-8)](#15-content--marketing-readiness-week-7-8)
16. [Launch Checklist](#16-launch-checklist)
17. [Post-Launch Plan (Month 2-3)](#17-post-launch-plan-month-2-3)
18. [Timeline Summary](#18-timeline-summary)
19. [Cost Estimation](#19-cost-estimation)

---

## 1. Current State Assessment

### What's Working

| Area | Status | Details |
|------|--------|---------|
| Backend API | 98% functional | 15 modules, ~63 endpoints, state machine, matching algorithm, cron jobs |
| Frontend Web | 90% functional | 22 pages, auth, dashboards, session room, admin panel |
| Database | 100% schema | 16 models, 11 enums, migrations, seeding |
| Authentication | 100% | JWT + refresh rotation, role-based access, change-password with token revocation |
| Email | 100% | Nodemailer/SMTP transport with 7 HTML email templates, graceful fallback |
| Payments | 95% | Stripe PaymentIntent + Connect, 6 webhook events, idempotency, auto-capture/cancel |
| Sessions | 95% | Full state machine, auto-abandon cron, auto payment capture/cancel, email notifications |
| GDPR | 100% | Full JSON data export (profile, sessions, ratings, payments, audit logs) |
| Real-time | 60% | Socket.IO basic structure, LiveKit JWT generation |
| Docker | 100% | Dev + prod compose files, multi-stage Dockerfiles |
| CI/CD | 100% | GitHub Actions pipeline |
| i18n | 100% | EN, FR, AR with RTL |
| E2E Tests | 100% | 15 test files covering all modules |

### Resolved Gaps

| Gap | Resolution |
|-----|-----------|
| ~~Email sending is stubbed~~ | Nodemailer transport with SMTP. 7 HTML templates: welcome, verification, password reset, booking, completion, companion approved, password reset. |
| ~~`@CurrentUser('sub')` bug~~ | Already fixed — all controllers use `@CurrentUser('id')` correctly. |
| ~~GDPR export is a stub~~ | Full JSON export: profile, sessions (with goals/contracts/drift), ratings, payments, audit logs. |
| ~~No change-password endpoint~~ | `POST /auth/change-password` with current password verification and token revocation. |
| ~~Limited Stripe webhooks~~ | 6 event types handled with Redis-based idempotency. |
| ~~No rate limiting on auth~~ | Per-route `@Throttle()` on all sensitive auth and payment endpoints. |
| ~~No session auto-abandon~~ | Cron job every 5 min: IN_PROGRESS > 4h → ABANDONED, PENDING_MATCH > 24h → CANCELLED. |
| ~~No auto payment capture~~ | Payments auto-captured on COMPLETED, auto-cancelled on CANCELLED. |

### Remaining Gaps

| Gap | Impact | Blocks |
|-----|--------|--------|
| No production hosting | Cannot serve real users | Everything |
| LiveKit not configured | Audio sessions don't work | Core product |
| Stripe in test mode | Can't process real payments | Revenue |
| No monitoring | Can't detect or debug issues | Stability |
| No backups | Data loss risk | Data safety |

### Readiness Score: 7.5/10

**Target for launch: 8.5/10** — Remaining gap is infrastructure/hosting, not application code.

---

## 2. Critical Bug Fixes (Day 1) — COMPLETED

**Status: All resolved**

### 2.1 Fix @CurrentUser('sub') Bug — ALREADY FIXED

- [x] **Ratings Controller** — Already uses `@CurrentUser('id')` correctly
- [x] **Abuse Reports Controller** — Already uses `@CurrentUser('id')` correctly
- [x] **All controllers audited** — Consistent `@CurrentUser('id')` usage verified

### 2.2 Additional Fixes Completed

- [x] Real email sending via nodemailer (7 HTML templates)
- [x] Change password endpoint with token revocation (`POST /auth/change-password`)
- [x] GDPR data export returns full JSON (profile, sessions, ratings, payments, audit logs)
- [x] Stripe webhook expansion (6 events) with Redis idempotency
- [x] Per-route rate limiting on auth and payment endpoints
- [x] Session auto-abandon cron (every 5 min)
- [x] Auto-capture payment on session completion, auto-cancel on cancellation
- [x] Email notifications: booking, completion, companion approval

---

## 3. Infrastructure Setup (Week 1-2)

**Priority: P0 | Effort: 3-5 days | Responsible: DevOps / Backend Developer**

### 3.1 Hosting Selection

Recommended approach by budget:

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| **Railway** (Recommended for launch) | ~€30-80 | Fastest setup, auto-deploy from GitHub, managed Postgres/Redis | Less control, costs scale linearly |
| **Render** | ~€25-70 | Good free tier for testing, easy setup | Cold starts on free tier |
| **Hetzner + Coolify** | ~€15-40 | Cheapest, full control, EU data residency | More setup work, self-managed |
| **AWS/GCP** | ~€100-300 | Enterprise features, global scale | Most complex, expensive for small scale |

### 3.2 Infrastructure Checklist

**Domain & DNS:**
- [ ] Purchase `hushroom.com` domain
- [ ] Purchase regional domains (`.fr`, `.de`, `.co.uk`) if needed
- [ ] Configure DNS records (A, CNAME, MX, TXT)
- [ ] Set up SSL certificates (auto-renew via Let's Encrypt)

**Application Servers:**
- [ ] Deploy API service (NestJS) — minimum 1 instance, 512MB+ RAM
- [ ] Deploy Web service (Next.js) — minimum 1 instance, 512MB+ RAM
- [ ] Configure reverse proxy / load balancer (if needed)
- [ ] Set up health check endpoints for auto-restart
- [ ] Configure environment variables (not in code, use platform secrets)

**Database:**
- [ ] Provision managed PostgreSQL 16
  - Recommended: Neon (serverless, free tier), Supabase, or Railway Postgres
  - Minimum: 1 vCPU, 1GB RAM, 10GB storage
- [ ] Enable SSL connections
- [ ] Create production database and run migrations
- [ ] Set up connection pooling (PgBouncer or built-in)
- [ ] Enable automated daily backups with 7-day retention

**Redis:**
- [ ] Provision managed Redis 7
  - Recommended: Upstash (serverless, free tier) or Railway Redis
  - Minimum: 256MB
- [ ] Enable SSL/TLS connections
- [ ] Set appropriate maxmemory policy (allkeys-lru)

**CDN (Static Assets):**
- [ ] Set up CDN for Next.js static assets
  - Recommended: Cloudflare (free tier), Vercel, or AWS CloudFront
- [ ] Configure caching headers for static files
- [ ] Set up image optimization pipeline (future: user avatars)

### 3.3 Environment Configuration

Production `.env` template:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/hushroom_prod?schema=public&sslmode=require

# Redis
REDIS_HOST=redis-host.provider.com
REDIS_PORT=6379
REDIS_PASSWORD=strong-password-here
REDIS_TLS=true

# JWT (generate with: openssl rand -base64 64)
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-random-string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://hushroom.com,https://www.hushroom.com

# Stripe (production keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# LiveKit
LIVEKIT_API_KEY=<from-livekit-cloud>
LIVEKIT_API_SECRET=<from-livekit-cloud>
LIVEKIT_URL=wss://<your-livekit-cloud-url>

# Email (Resend recommended)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_live_...
EMAIL_FROM=noreply@hushroom.com

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# App
APP_URL=https://hushroom.com
API_URL=https://api.hushroom.com
```

---

## 4. Security Hardening (Week 2-3)

**Priority: P0 | Effort: 3-5 days | Responsible: Backend Developer**

### 4.1 OWASP Top 10 Audit

- [ ] **Injection (A03)** — Verify Prisma parameterized queries cover all data paths
- [ ] **Broken Authentication (A07)** — Review JWT implementation, refresh token rotation
- [ ] **Sensitive Data Exposure (A02)** — Check no secrets in logs, no PII in error responses
- [ ] **XSS (A03)** — Review React output escaping, sanitize user-generated content
- [ ] **Security Misconfiguration (A05)** — Audit Helmet headers, CORS config, error stack traces
- [ ] **IDOR (A01)** — Verify ownership checks on all resource endpoints
- [ ] **SSRF** — Review any URL-accepting endpoints

### 4.2 Rate Limiting Hardening

```typescript
// Per-route rate limiting recommendations:
@Throttle({ default: { ttl: 60000, limit: 5 } })   // Auth endpoints (login, register)
@Throttle({ default: { ttl: 60000, limit: 10 } })  // Password reset
@Throttle({ default: { ttl: 60000, limit: 30 } })  // Standard API endpoints
@Throttle({ default: { ttl: 60000, limit: 60 } })  // Read-only endpoints
```

- [ ] Add stricter rate limiting to `/auth/login` (5 req/min)
- [ ] Add stricter rate limiting to `/auth/register` (3 req/min)
- [ ] Add stricter rate limiting to `/auth/forgot-password` (3 req/min)
- [ ] Add account lockout after 10 failed login attempts (15-minute lockout)
- [ ] Add rate limiting to `/payments/*` endpoints

### 4.3 Input & Output Security

- [ ] Review all DTOs have proper class-validator decorators
- [ ] Verify `forbidNonWhitelisted: true` is active globally
- [ ] Add `@Transform()` decorators to sanitize string inputs (trim whitespace)
- [ ] Ensure no stack traces in production error responses
- [ ] Verify passwords are never returned in API responses
- [ ] Add PII redaction to any request logging

### 4.4 Secrets Management

- [ ] Remove all secrets from `.env` files in code
- [ ] Use hosting platform's secret management (Railway/Render variables)
- [ ] Rotate all JWT secrets for production
- [ ] Generate new Stripe keys for production
- [ ] Set up GitHub Dependabot for vulnerability scanning
- [ ] Add `npm audit` to CI pipeline

### 4.5 Additional Security Measures

- [ ] Revoke all tokens on password change
- [ ] Add Content Security Policy headers to Next.js
- [ ] Implement CSRF protection if adding cookie-based auth
- [ ] Add `X-Request-ID` header for request tracing
- [ ] Set `Secure`, `HttpOnly`, `SameSite` on any cookies

---

## 5. Monitoring & Observability (Week 3-4)

**Priority: P0 | Effort: 3-4 days | Responsible: DevOps / Backend Developer**

### 5.1 Error Tracking

- [ ] Set up **Sentry** account (free tier: 5K events/month)
- [ ] Install `@sentry/nestjs` in API
- [ ] Install `@sentry/nextjs` in Web
- [ ] Configure source maps upload in CI
- [ ] Set up error alerting (email + Slack/Discord)
- [ ] Configure environment tagging (production, staging)

### 5.2 Uptime Monitoring

- [ ] Set up uptime monitoring service
  - Recommended: BetterUptime (free tier), UptimeRobot, or Checkly
- [ ] Monitor: `/api/v1/health` (every 1 min)
- [ ] Monitor: `/api/v1/health/db` (every 5 min)
- [ ] Monitor: `/api/v1/health/redis` (every 5 min)
- [ ] Monitor: `https://hushroom.com` (every 1 min)
- [ ] Configure alerting: email + SMS for downtime

### 5.3 Application Performance Monitoring

- [ ] Add structured logging (JSON format) with log levels
  - Recommended: `pino` or `winston` with JSON transport
- [ ] Log: request method, path, status code, duration, user ID (hashed)
- [ ] Log: database query duration (Prisma middleware)
- [ ] Log: external API calls (Stripe, LiveKit) with duration
- [ ] Set up log aggregation
  - Options: Axiom (free tier), Logtail, or self-hosted (Loki + Grafana)

### 5.4 Custom Metrics

Track these business metrics:
- [ ] Sessions created / started / completed per hour
- [ ] Payment authorizations / captures / failures per hour
- [ ] Registration rate
- [ ] Matching algorithm response time
- [ ] Average session duration
- [ ] Companion utilization rate

### 5.5 Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API Down | Health check fails for 2+ minutes | Critical | SMS + Email |
| Database Down | DB health check fails | Critical | SMS + Email |
| High Error Rate | >5% of requests return 5xx in 5 min | High | Email + Slack |
| Payment Failure Spike | >3 payment failures in 10 min | High | Email + Slack |
| High Latency | P95 response time > 2s for 5 min | Medium | Slack |
| Disk Space Low | < 20% remaining | Medium | Email |
| SSL Expiry | Certificate expires in < 14 days | Medium | Email |

---

## 6. Email Integration (Week 2)

**Priority: P0 | Effort: 2-3 days | Responsible: Backend Developer**

### 6.1 SMTP Provider Setup

- [ ] Choose provider:
  - **Resend** (Recommended) — 3K emails/month free, great DX, EU region available
  - **Postmark** — Best deliverability, 100 emails/month free
  - **SendGrid** — 100 emails/day free, most features
- [ ] Create account and verify domain
- [ ] Generate API key / SMTP credentials
- [ ] Update production environment variables

### 6.2 Email Service Implementation

- [ ] Replace console.log with actual SMTP transport in EmailService
- [ ] Implement email templates (HTML + plain text):

| Template | Trigger | Priority |
|----------|---------|----------|
| Welcome email | User registration | P0 |
| Email verification | Registration / request | P0 |
| Password reset | Forgot password | P0 |
| Session booked (user) | Companion selected | P1 |
| Session booked (companion) | Selected for session | P1 |
| Session reminder (1 hour before) | Scheduled session | P1 |
| Session completed | Session ends | P1 |
| Rating reminder (24h after) | Session completed | P2 |
| Payout notification | Payment captured | P2 |
| Companion approved | Admin approval | P1 |
| Account suspended | Admin / auto-suspend | P0 |
| Weekly summary | Cron job | P3 |

### 6.3 Email Deliverability

- [ ] Configure SPF record in DNS
- [ ] Configure DKIM record in DNS
- [ ] Configure DMARC record in DNS
- [ ] Test deliverability with mail-tester.com
- [ ] Set up bounce/complaint handling
- [ ] Add unsubscribe header to marketing emails (CAN-SPAM / GDPR)

---

## 7. Payment Production Readiness (Week 3-4)

**Priority: P0 | Effort: 4-5 days | Responsible: Backend Developer**

### 7.1 Stripe Production Setup

- [ ] Create Stripe production account (if not already)
- [ ] Complete Stripe business verification
- [ ] Enable Stripe Connect for companion payouts
- [ ] Generate production API keys (`sk_live_...`)
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Generate production webhook secret (`whsec_live_...`)

### 7.2 Comprehensive Webhook Handling

Implement handlers for these Stripe events:

| Event | Action | Priority |
|-------|--------|----------|
| `payment_intent.succeeded` | Confirm payment authorization | P0 |
| `payment_intent.payment_failed` | Mark payment as failed, notify user | P0 |
| `payment_intent.canceled` | Handle cancellation | P0 |
| `charge.captured` | Confirm capture, update payment record | P0 |
| `charge.refunded` | Update payment record, notify user | P0 |
| `charge.dispute.created` | Flag session as DISPUTED, alert admin | P0 |
| `account.updated` | Update companion Stripe Connect status | P1 |
| `payout.paid` | Update companion payout status | P1 |
| `payout.failed` | Alert companion and admin | P1 |

- [ ] Add webhook signature verification (already exists, verify in production)
- [ ] Add idempotency handling (prevent duplicate event processing)
- [ ] Add dead letter queue for failed webhook processing
- [ ] Test all webhook handlers with Stripe CLI

### 7.3 Payment Reliability

- [ ] Add retry logic for failed Stripe API calls (with exponential backoff)
- [ ] Add payment status reconciliation job (daily cron)
- [ ] Handle edge cases: user cancels after authorization, companion drops
- [ ] Add payment failure notifications (email to user)

### 7.4 EU Compliance

- [ ] Integrate Stripe Tax or manual VAT calculation for EU customers
- [ ] Generate invoices for business customers
- [ ] Configure supported payment methods (cards, SEPA, iDEAL for NL, Bancontact for BE)
- [ ] Implement PSD2/SCA (Strong Customer Authentication) — Stripe handles most of this

### 7.5 Subscription Billing (P1)

- [ ] Create Stripe Products and Prices:
  - Starter: Free
  - Focused: €19/month
  - Teams: €49/month
- [ ] Implement subscription creation flow
- [ ] Handle subscription lifecycle events (created, updated, canceled, past_due)
- [ ] Implement plan upgrade/downgrade
- [ ] Add subscription status to user model
- [ ] Enforce session limits based on subscription tier

---

## 8. Real-time & Media Production (Week 4-5)

**Priority: P0 | Effort: 3-4 days | Responsible: Backend Developer**

### 8.1 LiveKit Production

- [ ] Create LiveKit Cloud account (https://cloud.livekit.io)
  - Free tier: 50 participant-minutes/month (sufficient for beta)
  - Growth: $0.004/participant-minute
- [ ] Generate production API key and secret
- [ ] Update environment variables with LiveKit Cloud URL
- [ ] Test room creation and participant token generation
- [ ] Test audio quality and latency in production environment
- [ ] Implement room auto-cleanup (close rooms after session ends or timeout)

### 8.2 Socket.IO Scaling

- [ ] Install `@socket.io/redis-adapter`
- [ ] Configure Socket.IO to use Redis adapter for multi-instance support
- [ ] Implement connection authentication (verify JWT on connect)
- [ ] Add reconnection handling and state recovery
- [ ] Test WebSocket connections through reverse proxy / load balancer

### 8.3 Drift Detection MVP

- [ ] Implement keyword-based drift detection:
  - Compare active session audio transcription keywords against goal keywords
  - Start with manual companion-triggered drift alerts
  - Log all drift events with severity, message, trigger type
- [ ] Implement drift notification flow:
  - Companion flags drift → Socket.IO event → user notification
  - User must acknowledge HIGH/CRITICAL drifts
- [ ] Store drift events in DriftLog model

---

## 9. Data & Privacy Compliance (Week 3-4)

**Priority: P0 | Effort: 3-4 days | Responsible: Backend Developer + Legal**

### 9.1 GDPR Compliance Checklist

- [ ] **Right to Access (Art. 15)** — Implement actual data export
  - Export user profile, sessions, ratings, payments, goals as JSON/CSV
  - Generate downloadable file, send via email
  - Maximum response time: 30 days

- [ ] **Right to Erasure (Art. 17)** — Verify deletion completeness
  - Soft delete is implemented; ensure hard delete after retention period
  - Anonymize rather than delete where legal obligations require data retention
  - Cascade delete to: refresh tokens, language preferences, availability
  - Anonymize: ratings (keep aggregate, remove PII), audit logs (remove PII)

- [ ] **Right to Rectification (Art. 16)** — Already implemented (profile update)

- [ ] **Right to Data Portability (Art. 20)** — Part of data export

- [ ] **Data Minimization (Art. 5)** — Audit all collected data for necessity

- [ ] **Consent Management**
  - Cookie consent banner (Tarteaucitron.js or similar)
  - Terms of Service acceptance tracking
  - Marketing email opt-in (separate from transactional)

### 9.2 Data Retention Policy

| Data Type | Retention | After Retention |
|-----------|-----------|-----------------|
| Active user data | While account active | — |
| Soft-deleted accounts | 30 days | Hard delete + anonymize |
| Session records | 2 years | Anonymize (remove PII) |
| Payment records | 7 years (EU tax law) | Archive, restrict access |
| Audit logs | 2 years | Delete |
| Refresh tokens (revoked) | 30 days | Delete |
| Redis cache data | TTL-based | Auto-expire |

### 9.3 Legal Documents

- [ ] Finalize Terms of Service with EU lawyer
- [ ] Finalize Privacy Policy with EU lawyer
- [ ] Create Data Processing Agreement (DPA) template
- [ ] Create cookie policy
- [ ] Add cookie consent implementation
- [ ] Verify age gate compliance by jurisdiction

---

## 10. Performance & Scaling (Week 5-6)

**Priority: P1 | Effort: 3-5 days | Responsible: Backend Developer**

### 10.1 Load Testing

- [ ] Set up load testing tool (recommended: k6 or Artillery)
- [ ] Create test scenarios:

| Scenario | Target | Duration |
|----------|--------|----------|
| Registration + Login | 50 concurrent users | 5 min |
| Browse Companions | 100 concurrent users | 5 min |
| Create Session Flow | 30 concurrent users | 10 min |
| Mixed workload | 200 concurrent users | 15 min |

- [ ] Run tests against staging environment
- [ ] Identify bottlenecks from results
- [ ] Target: P95 response time < 500ms for API endpoints

### 10.2 Database Optimization

- [ ] Review Prisma query logs for N+1 queries
- [ ] Add missing indexes based on query patterns
- [ ] Optimize admin stats query (cache or materialized view)
- [ ] Configure connection pooling:
  - Prisma: `connection_limit` in DATABASE_URL
  - Or add PgBouncer as a proxy
- [ ] Analyze slow queries with `EXPLAIN ANALYZE`

### 10.3 Caching Strategy

| Resource | Cache Location | TTL | Invalidation |
|----------|---------------|-----|--------------|
| Companion search results | Redis | 5 min | On profile update |
| Contract templates | Redis | 1 hour | On template change |
| Matching results | Redis | 30 min | Already implemented |
| Platform stats (admin) | Redis | 5 min | On demand |
| Companion public profile | HTTP Cache-Control | 5 min | CDN purge |
| Static assets | CDN | 1 year | Content hash in filename |

- [ ] Implement Redis caching for companion search
- [ ] Add HTTP Cache-Control headers to public endpoints
- [ ] Cache admin stats for 5 minutes

### 10.4 Frontend Performance

- [ ] Implement Next.js ISR (Incremental Static Regeneration) for landing page
- [ ] Add image optimization (next/image for all images)
- [ ] Configure bundle analysis (`@next/bundle-analyzer`)
- [ ] Implement code splitting for admin panel
- [ ] Target: Lighthouse score > 90 for landing page

---

## 11. Mobile App (Week 6-10)

**Priority: P2 | Effort: 4-6 weeks | Responsible: Mobile Developer**

### 11.1 Core Features (Phase 1 — Week 6-8)

- [ ] Authentication (login, register, token management)
- [ ] User dashboard
- [ ] Browse and search companions
- [ ] Create session + set goals
- [ ] Session room (audio via LiveKit React Native SDK)
- [ ] Rating after session

### 11.2 Companion Features (Phase 2 — Week 8-9)

- [ ] Companion dashboard
- [ ] Availability management
- [ ] Session acceptance
- [ ] Earnings view

### 11.3 Polish & Launch (Phase 3 — Week 9-10)

- [ ] Push notifications (Expo Notifications)
- [ ] Deep linking configuration
- [ ] App icon and splash screen
- [ ] App Store Connect setup (iOS)
- [ ] Google Play Console setup (Android)
- [ ] Beta testing via TestFlight + Google Play Beta
- [ ] App Store submission and review

---

## 12. DevOps & Reliability (Week 4-5)

**Priority: P1 | Effort: 3-4 days | Responsible: DevOps**

### 12.1 Backup & Recovery

- [ ] Configure automated daily database backups
  - Managed Postgres: Enable point-in-time recovery
  - Self-hosted: pg_dump cron job to object storage (S3/B2)
- [ ] Test backup restoration procedure
- [ ] Document disaster recovery plan:
  - RTO (Recovery Time Objective): < 4 hours
  - RPO (Recovery Point Objective): < 1 hour
- [ ] Store backups in different region from primary database

### 12.2 Deployment Strategy

- [ ] Set up staging environment (mirrors production)
- [ ] Implement deployment pipeline:
  - Push to `main` → CI passes → Deploy to staging → Manual promote to production
- [ ] Configure zero-downtime deployments:
  - Rolling update (Railway/Render do this automatically)
  - Or: Blue-green deployment for self-hosted
- [ ] Database migration strategy:
  - Run `prisma migrate deploy` before app startup
  - Ensure migrations are backwards-compatible (no breaking column drops)

### 12.3 Runbook

Create runbooks for common incidents:
- [ ] API unresponsive — restart service, check DB connections, check Redis
- [ ] Database connection exhausted — check connection pool, kill idle connections
- [ ] Payment processing failing — check Stripe status, verify webhook endpoint
- [ ] LiveKit rooms not connecting — check LiveKit Cloud status, verify credentials
- [ ] High memory usage — check for memory leaks, restart service
- [ ] SSL certificate expiry — renewal procedure

---

## 13. Testing & Quality (Week 5-6)

**Priority: P1 | Effort: 3-4 days | Responsible: Full Team**

### 13.1 Test Coverage

- [ ] Run E2E test suite and fix any failures
- [ ] Add unit tests for critical business logic:
  - Session state machine transitions
  - Matching algorithm scoring
  - Commission calculation
  - Reputation calculation
- [ ] Achieve minimum 70% code coverage for services

### 13.2 Integration Testing

- [ ] Test full payment flow with Stripe test mode
- [ ] Test email delivery end-to-end
- [ ] Test LiveKit room lifecycle
- [ ] Test Socket.IO connection and event flow

### 13.3 Quality Assurance

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing (iOS Safari, Android Chrome)
- [ ] Accessibility audit (WCAG 2.1 Level AA minimum)
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast ratios
  - Focus indicators
- [ ] RTL layout testing (Arabic)
- [ ] Test with slow network (3G throttling)

---

## 14. Analytics & Business Intelligence (Week 6-7)

**Priority: P2 | Effort: 2-3 days | Responsible: Backend Developer**

### 14.1 Privacy-Friendly Analytics

- [ ] Set up analytics platform:
  - **Plausible** (Recommended) — Privacy-friendly, GDPR-compliant, EU-hosted, €9/month
  - **PostHog** (Alternative) — More features, self-hostable, free tier
- [ ] Configure analytics script on web app
- [ ] Set up conversion funnels:
  - Landing page → Register → Verify email → First session → Rate
  - Companion: Register → Apply → Approved → First session → Payout

### 14.2 Business Metrics Dashboard

Track these KPIs:

| Metric | Source | Frequency |
|--------|--------|-----------|
| Daily/Weekly/Monthly Active Users | Analytics | Daily |
| Registration rate | Analytics | Daily |
| Session creation rate | Database | Daily |
| Session completion rate | Database | Daily |
| Average session duration | Database | Weekly |
| Average session rating | Database | Weekly |
| Revenue (MRR) | Stripe | Weekly |
| Companion utilization | Database | Weekly |
| User retention (week 1, 2, 4) | Analytics | Weekly |
| NPS score | Survey | Monthly |

---

## 15. Content & Marketing Readiness (Week 7-8)

**Priority: P2 | Effort: 3-5 days | Responsible: Content / Marketing**

### 15.1 SEO

- [ ] Configure meta tags (title, description, og:image) for all pages
- [ ] Add structured data (JSON-LD) for organization and service
- [ ] Create sitemap.xml (Next.js built-in)
- [ ] Create robots.txt
- [ ] Optimize Core Web Vitals (LCP, FID, CLS)
- [ ] Submit to Google Search Console

### 15.2 Social & Sharing

- [ ] Configure Open Graph meta tags for social sharing
- [ ] Create social sharing images (og:image) — 1200x630px
- [ ] Add Twitter Card meta tags
- [ ] Create share functionality for session achievements

### 15.3 Help & Support

- [ ] Create help center / FAQ page (can be on landing page initially)
- [ ] Add in-app chat widget (Crisp.chat — free tier, or Intercom)
- [ ] Set up support@hushroom.com email
- [ ] Create companion onboarding guide
- [ ] Create user getting-started guide

---

## 16. Launch Checklist

### Technical — Must Pass

- [ ] All critical bugs fixed (P0 items)
- [ ] Production environment deployed and stable (24h+ uptime)
- [ ] SSL certificates configured and valid
- [ ] Database backups automated and tested
- [ ] Error monitoring active (Sentry)
- [ ] Uptime monitoring active
- [ ] Health checks passing: API, DB, Redis
- [ ] Real email sending working (verification, password reset)
- [ ] Stripe production keys configured
- [ ] Stripe webhooks receiving and processing events
- [ ] LiveKit Cloud connected and tested
- [ ] Payment flow tested end-to-end with real card (Stripe test mode → live)
- [ ] GDPR data export functional
- [ ] All E2E tests passing
- [ ] Load test completed (target: 100 concurrent users)
- [ ] No critical security vulnerabilities (OWASP audit complete)
- [ ] DNS and domain configured correctly
- [ ] Mobile responsive design verified

### Legal — Must Pass

- [ ] Terms of Service reviewed by EU lawyer
- [ ] Privacy Policy reviewed by EU lawyer
- [ ] Cookie consent implemented
- [ ] Age verification compliant
- [ ] Business entity registered
- [ ] Professional liability insurance
- [ ] Stripe Connect compliance verified

### Content — Should Have

- [ ] Landing page copy finalized
- [ ] Help center / FAQ available
- [ ] Companion onboarding guide written
- [ ] 3+ blog posts for SEO foundation
- [ ] Social media accounts created (@hushroom)
- [ ] Press kit prepared

### Operations — Should Have

- [ ] Support email configured
- [ ] Incident response plan documented
- [ ] Runbooks created for common issues
- [ ] On-call notification system set up
- [ ] Companion payment schedule established

---

## 17. Post-Launch Plan (Month 2-3)

### Week 1-2: Stabilize

- [ ] Monitor error rates and fix emerging bugs
- [ ] Watch payment processing for issues
- [ ] Respond to user feedback within 24 hours
- [ ] Daily review of abuse reports
- [ ] Monitor companion approval queue

### Week 3-4: Optimize

- [ ] Analyze session completion rates
- [ ] Identify conversion funnel drop-offs
- [ ] Optimize matching algorithm based on real data
- [ ] A/B test onboarding flow
- [ ] Implement top 3 user-requested features

### Month 2-3: Grow

- [ ] Implement referral program
- [ ] Launch companion recruitment campaign
- [ ] Begin content marketing (blog, social media)
- [ ] Explore university partnerships
- [ ] Prepare for mobile app launch
- [ ] Evaluate metrics for seed funding readiness

---

## 18. Timeline Summary

```
Week 1  ████ Critical Fixes + Infrastructure Setup
Week 2  ████ Infrastructure + Email + Security Start
Week 3  ████ Security Hardening + GDPR + Payments
Week 4  ████ Monitoring + Payments + Real-time
Week 5  ████ Performance + Testing + DevOps
Week 6  ████ Mobile Start + Analytics + Load Testing
Week 7  ████ Mobile + Content + SEO
Week 8  ████ Mobile + Marketing + Launch Prep
Week 9  ████ Final Testing + Launch Checklist
Week 10 ████ LAUNCH (Beta)
        ────────────────────────────────────────
Week 11-14  Post-launch stabilization
Week 15-18  Growth features + mobile launch
```

### Critical Path

```
Bug Fixes (Day 1)
    → Infrastructure (Week 1-2)
        → Email + Security (Week 2-3)
            → Payments + Monitoring (Week 3-4)
                → Load Testing (Week 5)
                    → Launch Prep (Week 8-9)
                        → LAUNCH (Week 10)
```

### Dependencies

| Task | Depends On |
|------|-----------|
| Email sending | SMTP provider account |
| Stripe production | Business entity registered |
| LiveKit production | LiveKit Cloud account |
| Load testing | Staging environment |
| Launch | All P0 items complete |
| Mobile app | Production API stable |

---

## 19. Cost Estimation

### Monthly Infrastructure Costs

| Service | 100 Users | 1K Users | 10K Users |
|---------|-----------|----------|-----------|
| **Hosting (API + Web)** | €20-40 | €40-80 | €100-200 |
| **PostgreSQL** | €0-15 | €15-30 | €50-100 |
| **Redis** | €0-10 | €10-20 | €30-50 |
| **LiveKit Cloud** | €0-10 | €20-50 | €100-300 |
| **Stripe fees** | Transaction-based | Transaction-based | Transaction-based |
| **Email (Resend)** | €0 (free tier) | €0-20 | €20-50 |
| **Sentry** | €0 (free tier) | €0-26 | €26-80 |
| **Uptime monitoring** | €0 (free tier) | €0-10 | €10-20 |
| **Analytics (Plausible)** | €9 | €9 | €19-49 |
| **Domain + DNS** | €15/year | €15/year | €15/year |
| **CDN (Cloudflare)** | €0 (free) | €0 (free) | €20-200 |
| **Total** | **€30-85/mo** | **€95-245/mo** | **€375-1,050/mo** |

### Third-Party Service Costs

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Stripe | Pay-per-transaction | 1.4% + €0.25/txn (EU) | No monthly fee |
| LiveKit Cloud | Pay-per-minute | $0.004/participant-min | Free tier: 50 min/month |
| Resend | Free / Pro | €0-20/month | 3K emails free |
| Sentry | Free / Team | €0-26/month | 5K events free |
| Plausible | Starter | €9/month | Privacy-friendly analytics |
| BetterUptime | Free / Starter | €0-20/month | 5 monitors free |
| GitHub | Team | €4/user/month | CI minutes included |

### Total Burn Rate Projection

| Phase | Monthly Cost | Notes |
|-------|-------------|-------|
| Development (now) | €0-20 | Docker local dev only |
| Beta (100 users) | €50-100/mo | Minimal infra |
| Launch (1K users) | €150-300/mo | Full stack deployed |
| Growth (5K users) | €300-600/mo | Scaling begins |
| Scale (10K users) | €500-1,200/mo | Multiple instances, CDN |

### Revenue Breakeven Analysis

At **€5 average platform fee per session**:
- €100/mo costs → 20 paid sessions/month to break even
- €300/mo costs → 60 paid sessions/month to break even
- €600/mo costs → 120 paid sessions/month to break even

With 1K users at 10% conversion and 2 sessions/month average:
- 1,000 × 10% × 2 = 200 sessions/month
- 200 × €5 = **€1,000/month platform revenue**
- Plus subscription revenue: ~€500-1,000/month
- **Profitable at ~1K active users**

---

*Last updated: February 2026*
*Review quarterly or after significant infrastructure changes.*
