# Hushroom Product Backlog

> Complete feature inventory with implementation status and scalability ratings.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scalability Rating Legend](#2-scalability-rating-legend)
3. [Module-by-Module Backlog](#3-module-by-module-backlog)
4. [Unimplemented Features Priority Matrix](#4-unimplemented-features-priority-matrix)
5. [Technical Debt](#5-technical-debt)
6. [Security Gaps](#6-security-gaps)
7. [Scalability Bottlenecks](#7-scalability-bottlenecks)
8. [Recommended Implementation Order](#8-recommended-implementation-order)

---

## 1. Executive Summary

### Overall Status

| Category | Implemented | Partial | Not Implemented |
|----------|------------|---------|-----------------|
| Backend API Endpoints | 62 | 1 | 0 |
| Frontend Pages | 22 | 0 | 3 |
| Infrastructure | 5 | 2 | 8 |
| Security Features | 13 | 1 | 4 |
| Business Features | 13 | 1 | 14 |
| **Total** | **115** | **5** | **29** |

### Platform Readiness Score: **7.5 / 10**

The platform has a strong functional foundation with all core API modules implemented and critical gaps addressed. Email delivery, GDPR compliance, webhook idempotency, session lifecycle management, and payment automation are now production-ready. Remaining gaps: monitoring, mobile app, subscription billing, and LiveKit production configuration.

---

## 2. Scalability Rating Legend

| Rating | Scale | Description |
|--------|-------|-------------|
| **1-2** | ~10 users | Will break under minimal load. Proof of concept only. |
| **3-4** | ~100 users | Works for alpha/beta testing with known limitations. |
| **5-6** | ~1K users | Handles moderate scale with some bottlenecks. Production-viable for early stage. |
| **7-8** | ~10K users | Production-ready for significant scale. Minor optimizations needed at peak. |
| **9-10** | ~100K+ users | Enterprise-grade. Horizontally scalable, battle-tested. |

---

## 3. Module-by-Module Backlog

---

### 3.1 Authentication Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 1.1 | User registration | Implemented | 7 | Prisma + bcrypt. Rate limiting protects against abuse. |
| 1.2 | User login | Implemented | 7 | JWT generation is stateless and fast. |
| 1.3 | JWT access tokens (15min) | Implemented | 8 | Stateless verification scales horizontally. |
| 1.4 | Refresh token rotation | Implemented | 6 | DB-backed tokens; will need Redis migration at scale. |
| 1.5 | Logout (token revocation) | Implemented | 6 | DB delete; fast for moderate scale. |
| 1.6 | Email verification | Implemented | 7 | Token generated, stored in Redis, verification email sent via nodemailer/SMTP. |
| 1.7 | Forgot password | Implemented | 7 | Token created in Redis, password reset email sent via nodemailer/SMTP. |
| 1.8 | Reset password | Implemented | 7 | Validates Redis token, updates hash. |
| 1.9 | Age verification (18+) | **Partial** | 4 | Checks date of birth only. No real identity verification (ID scan). |
| 1.10 | Password strength validation | Implemented | 9 | Client-side + server-side validation. |
| 1.11 | Change password | Implemented | 7 | Validates current password, hashes new, revokes all refresh tokens. Rate-limited. |
| 1.12 | OAuth / Social login | **Not Implemented** | — | Google, GitHub, Apple login not available. |
| 1.13 | Two-factor authentication (2FA) | **Not Implemented** | — | No TOTP or SMS-based 2FA. |
| 1.14 | Per-route auth rate limiting | Implemented | 8 | `@Throttle()` on register (5/min), login (10/min), forgot-password (3/min), reset (5/min). |

---

### 3.2 Users Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 2.1 | Get own profile | Implemented | 8 | Simple DB read by ID (primary key). |
| 2.2 | Update profile | Implemented | 8 | Single row update, validated DTO. |
| 2.3 | Soft delete account | Implemented | 7 | Sets deletedAt + revokes all refresh tokens. |
| 2.4 | Language preferences CRUD | Implemented | 7 | Replace-all strategy with unique constraint. |
| 2.5 | GDPR data export | Implemented | 7 | Full JSON export: profile, sessions, goals, contracts, ratings, payments, audit logs. Creates audit log entry. |
| 2.6 | Avatar upload | **Not Implemented** | — | avatarUrl field exists but no upload endpoint or CDN integration. |
| 2.7 | User search (admin) | Implemented | 5 | LIKE query on email/name; needs full-text search at scale. |
| 2.8 | Account reactivation | **Not Implemented** | — | Soft-deleted accounts cannot be restored via API. |

---

### 3.3 Companions Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 3.1 | Register as companion | Implemented | 7 | Creates profile + changes role. |
| 3.2 | Get own companion profile | Implemented | 8 | Single read by userId. |
| 3.3 | Update companion profile | Implemented | 8 | Validated DTO update. |
| 3.4 | Toggle online status | Implemented | 6 | DB update; at scale should use Redis for online status. |
| 3.5 | Public companion search | Implemented | 5 | SQL filters + pagination. No full-text search indexing. |
| 3.6 | Public companion profile | Implemented | 7 | Single read with Decimal-to-number conversion. |
| 3.7 | Companion type progression | **Not Implemented** | — | No automated Standard → Verified → Expert promotion logic. |
| 3.8 | Companion certification tracking | **Partial** | 4 | `certifications` JSON field exists but no validation or display logic. |
| 3.9 | Companion suspension appeal | **Not Implemented** | — | No process for suspended companions to appeal. |

---

### 3.4 Sessions Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 4.1 | Create session | Implemented | 7 | Insert with validated type and duration. |
| 4.2 | List sessions (filtered) | Implemented | 6 | Filtered by userId + status. Indexed on both columns. |
| 4.3 | Get session by ID | Implemented | 8 | Primary key lookup with includes. |
| 4.4 | State machine transitions | Implemented | 8 | Pure function validation, no DB overhead. |
| 4.5 | Mark ready | Implemented | 7 | State transition + update. |
| 4.6 | Start session (set startedAt) | Implemented | 7 | State transition + timestamp. |
| 4.7 | Pause / Resume | Implemented | 7 | Bidirectional state transitions. |
| 4.8 | End session (calculate duration) | Implemented | 7 | Sets endedAt, calculates durationMinutes. |
| 4.9 | Cancel session | Implemented | 7 | State transition + cancellation reason. |
| 4.10 | Session scheduling | Implemented | 6 | scheduledAt field; no calendar integration or reminders. |
| 4.11 | Session reminders / notifications | **Not Implemented** | — | No email, push, or in-app notifications for upcoming sessions. |
| 4.12 | Session timeout (auto-abandon) | Implemented | 7 | Cron job every 5 min: IN_PROGRESS/PAUSED > 4h → ABANDONED, PENDING_MATCH/MATCHED > 24h → CANCELLED. Auto-cancels payments. |
| 4.13 | Session recording | **Not Implemented** | — | Audio is real-time only; no recording capability. |
| 4.14 | Group sessions (2-4 users) | **Not Implemented** | — | Schema supports 1-to-1 only. |

---

### 3.5 Goals Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 5.1 | Create goal for session | Implemented | 7 | One goal per session (unique constraint). |
| 5.2 | Get goal by session ID | Implemented | 8 | Indexed lookup. |
| 5.3 | Update goal achievement | Implemented | 7 | isAchieved + achievementNote. |
| 5.4 | Goal templates | **Not Implemented** | — | No reusable goal templates. |
| 5.5 | Goal history / progress tracking | **Not Implemented** | — | No cross-session goal tracking or streaks. |

---

### 3.6 Contracts Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 6.1 | List contract templates | Implemented | 8 | Simple filtered query, cacheable. |
| 6.2 | Get template by ID | Implemented | 8 | Primary key lookup. |
| 6.3 | Create contract for session | Implemented | 7 | Links to session with optional template. |
| 6.4 | Get contract by ID | Implemented | 8 | Primary key lookup. |
| 6.5 | Accept contract (dual-party) | Implemented | 7 | Sets acceptedByUser/acceptedByCompanion, sets acceptedAt when both true. |
| 6.6 | Contract template management (admin) | **Not Implemented** | — | No CRUD for templates via admin panel. |
| 6.7 | Custom contract rules editor | **Not Implemented** | — | Rules are JSON; no structured editor in UI. |

---

### 3.7 Matching Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 7.1 | Multi-factor matching algorithm | Implemented | 6 | Scores all available companions; O(n) per request. |
| 7.2 | Goal-keyword matching (35%) | Implemented | 5 | String array intersection; no NLP or fuzzy matching. |
| 7.3 | Reputation scoring (30%) | Implemented | 7 | Reads pre-computed reputationScore from DB. |
| 7.4 | Fair distribution via Redis (20%) | Implemented | 7 | Redis-backed session counters for equity. |
| 7.5 | Price fit scoring (15%) | Implemented | 8 | Simple math calculation. |
| 7.6 | Result caching (Redis) | Implemented | 7 | Cached for 30 min; avoids re-computation. |
| 7.7 | Select companion | Implemented | 7 | Updates session to MATCHED, assigns companionId. |
| 7.8 | Availability-aware matching | **Not Implemented** | — | Matching does not check companion availability slots. |
| 7.9 | Language-aware matching | **Partial** | 5 | Filter parameter exists but not deeply integrated into scoring. |
| 7.10 | Favorite companions / rebooking | **Not Implemented** | — | No mechanism to prefer previously-used companions. |

---

### 3.8 Payments Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 8.1 | Authorize payment (PaymentIntent) | Implemented | 7 | Stripe API call with manual capture. |
| 8.2 | Capture payment | Implemented | 7 | Stripe capture after session completion. |
| 8.3 | List user payments | Implemented | 6 | Filtered by userId with pagination. |
| 8.4 | Get payment by ID | Implemented | 8 | Primary key lookup. |
| 8.5 | Refund payment | Implemented | 7 | Full or partial refund with reason enum. |
| 8.6 | Stripe Connect onboarding | Implemented | 7 | Creates Connect account + onboarding link. |
| 8.7 | Companion earnings calculation | Implemented | 6 | Aggregates from payment records. |
| 8.8 | Commission calculation by tier | Implemented | 8 | Standard 30%, Verified 25%, Expert 20%. |
| 8.9 | Stripe webhook handling | Implemented | 7 | 6 event types: succeeded, failed, canceled, charge.refunded, charge.dispute.created, account.updated. Redis-based idempotency prevents double processing. |
| 8.10 | Auto-capture on session completion | Implemented | 7 | AUTHORIZED payment auto-captured when session transitions to COMPLETED. |
| 8.11 | Auto-cancel on session cancellation | Implemented | 7 | AUTHORIZED payment auto-cancelled when session transitions to CANCELLED. |
| 8.12 | Payment rate limiting | Implemented | 8 | `@Throttle()` on authorize (10/min) and refund (10/min). |
| 8.13 | Subscription billing (recurring) | **Not Implemented** | — | No Stripe Subscriptions for monthly plans. |
| 8.14 | Invoice generation | **Not Implemented** | — | No PDF invoice creation. |
| 8.15 | VAT / tax handling | **Not Implemented** | — | No EU VAT calculation or Stripe Tax integration. |
| 8.16 | Payout scheduling | **Not Implemented** | — | No configurable payout frequency. |
| 8.17 | Payment dispute handling | Implemented | 6 | DISPUTED status set on `charge.dispute.created` webhook, audit log created for admin review. |

---

### 3.9 Ratings Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 9.1 | Create rating (bidirectional) | Implemented | 7 | Validates completion, 48h window, no duplicates. |
| 9.2 | Get session ratings | Implemented | 7 | Indexed query on sessionId. |
| 9.3 | Get companion public ratings | Implemented | 6 | Paginated with public-only filter. |
| 9.4 | Get own ratings (given/received) | Implemented | 6 | Dual query by raterId and ratedUserId. |
| 9.5 | Reputation recalculation | Implemented | 5 | Recalculates on every new rating. At scale, should be async/batched. |
| 9.6 | Recency bias weighting | Implemented | 7 | More weight to recent ratings. |
| 9.7 | Confidence scaling (20 ratings) | Implemented | 7 | Score reliability increases with volume. |
| 9.8 | Daily decay for inactive companions | Implemented | 5 | Currently in reputation calc logic; needs scheduled job at scale. |
| 9.9 | Rating moderation (admin) | **Not Implemented** | — | No admin ability to edit/remove inappropriate ratings. |
| 9.10 | Rating response (companion replies) | **Not Implemented** | — | No ability for companions to respond to ratings. |

---

### 3.10 Availability Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 10.1 | Get own availability | Implemented | 7 | Filtered by companionId. |
| 10.2 | Set availability (replace all) | Implemented | 6 | Deletes + recreates all slots. Transaction needed for atomicity. |
| 10.3 | Get companion availability (public) | Implemented | 7 | Public endpoint, cacheable. |
| 10.4 | Block date | Implemented | 7 | Creates blocked availability entry. |
| 10.5 | Remove block | Implemented | 7 | Delete by ID. |
| 10.6 | Recurring vs one-time slots | Implemented | 6 | isRecurring flag + specificDate support. |
| 10.7 | Timezone handling | Implemented | 5 | Stored but not used for cross-timezone conflict detection. |
| 10.8 | Calendar integration (Google/Outlook) | **Not Implemented** | — | No external calendar sync. |
| 10.9 | Automatic conflict detection | **Not Implemented** | — | No validation for overlapping bookings. |

---

### 3.11 Drift Detection Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 11.1 | DriftLog data model | Implemented | 8 | Full schema with severity, trigger type, acknowledgment. |
| 11.2 | Socket.IO gateway | **Partial** | 4 | Basic event structure exists. No Redis adapter for horizontal scaling. |
| 11.3 | Manual drift reporting (companion) | **Partial** | 5 | Can create drift log entries, but UI integration is basic. |
| 11.4 | Drift acknowledgment tracking | **Partial** | 5 | Schema supports it; partial code implementation. |
| 11.5 | Automated drift detection (NLP/AI) | **Not Implemented** | — | No keyword analysis, NLP, or AI-based detection. |
| 11.6 | Drift severity escalation rules | **Not Implemented** | — | No automatic escalation from LOW to CRITICAL. |
| 11.7 | Drift analytics / reporting | **Not Implemented** | — | No aggregate drift metrics per session or companion. |

---

### 3.12 Media / LiveKit Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 12.1 | Create LiveKit room | Implemented | 6 | Manual room creation linked to session. |
| 12.2 | Generate participant token | Implemented | 7 | Manual JWT generation (no SDK dependency). |
| 12.3 | Close room | Implemented | 6 | Room lifecycle management. |
| 12.4 | LiveKit production configuration | **Not Implemented** | — | No LiveKit Cloud or self-hosted server configured. |
| 12.5 | Connection quality monitoring | **Not Implemented** | — | No bandwidth/quality metrics. |
| 12.6 | Recording support | **Not Implemented** | — | No session recording capability. |
| 12.7 | Video support | **Not Implemented** | — | Audio-only currently; video not implemented. |

---

### 3.13 Admin Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 13.1 | Platform statistics | Implemented | 5 | Count queries; should be cached/pre-computed at scale. |
| 13.2 | User management (list, search, paginate) | Implemented | 5 | LIKE queries; needs full-text search at scale. |
| 13.3 | User status management | Implemented | 7 | Simple update. |
| 13.4 | User role management | Implemented | 7 | Simple update. |
| 13.5 | Pending companion list | Implemented | 7 | Filtered query on status. |
| 13.6 | Approve companion | Implemented | 7 | Status update to APPROVED. |
| 13.7 | Suspend companion | Implemented | 7 | Status update to SUSPENDED. |
| 13.8 | Session monitoring | Implemented | 6 | Filtered list with pagination. |
| 13.9 | Payment monitoring | Implemented | 6 | List with pagination. |
| 13.10 | Audit log viewing | Implemented | 5 | Filtered by action, paginated. Large volume at scale. |
| 13.11 | Admin dashboard (web UI) | Implemented | 6 | Full admin panel with 6 sections. |
| 13.12 | Admin notification system | **Not Implemented** | — | No alerts for pending companions, reports, etc. |
| 13.13 | Admin activity logging | **Not Implemented** | — | Admin actions not separately tracked from general audit log. |
| 13.14 | Bulk operations | **Not Implemented** | — | No bulk approve/suspend/delete. |

---

### 3.14 Abuse Reports Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 14.1 | Create abuse report | Implemented | 7 | User submits report with reason and description. |
| 14.2 | List reports (admin, filtered) | Implemented | 6 | Filtered by status, paginated. |
| 14.3 | Resolve report (admin) | Implemented | 7 | Sets admin notes, resolvedAt, status. |
| 14.4 | Dismiss report (admin) | Implemented | 7 | Sets status to DISMISSED. |
| 14.5 | Auto-suspend on 3+ reports | Implemented | 7 | Automatic user suspension trigger. |
| 14.6 | Reporter notification of outcome | **Not Implemented** | — | Reporter not notified when report is resolved/dismissed. |
| 14.7 | Appeal process | **Not Implemented** | — | No mechanism for reported users to appeal. |

---

### 3.15 Health Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 15.1 | Basic health check | Implemented | 9 | Returns status + timestamp. |
| 15.2 | Database health check | Implemented | 8 | Simple `SELECT 1` query. |
| 15.3 | Redis health check | Implemented | 8 | Simple `PING` command. |
| 15.4 | Dependency health checks | **Not Implemented** | — | No Stripe, LiveKit, SMTP connectivity checks. |

---

### 3.16 Email Module

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 16.1 | Email service infrastructure | Implemented | 7 | Nodemailer transport with SMTP. Falls back to console.log when SMTP_HOST not configured. |
| 16.2 | Welcome email | Implemented | 7 | HTML template sent on registration. |
| 16.3 | Verification email | Implemented | 7 | HTML template with verification link. Sent on registration. |
| 16.4 | Password reset email | Implemented | 7 | HTML template with 1-hour expiry link. |
| 16.5 | Session booking confirmation email | Implemented | 7 | Sent to user when companion is selected. |
| 16.6 | Session completion email | Implemented | 7 | Sent to both user and companion on session COMPLETED. |
| 16.7 | Companion approved email | Implemented | 7 | Sent when admin approves a companion application. |
| 16.8 | Email templates (HTML) | Implemented | 7 | 7 styled HTML templates with responsive layout. |
| 16.9 | Rating reminder email | **Not Implemented** | — | |
| 16.10 | Payout notification email | **Not Implemented** | — | |
| 16.11 | Email deliverability (SPF/DKIM/DMARC) | **Not Implemented** | — | DNS configuration needed for production domain. |

---

### 3.17 Frontend (Web App)

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 17.1 | Landing page | Implemented | 8 | Static content, fast loading. |
| 17.2 | Login / Register pages | Implemented | 7 | Form validation + API integration. |
| 17.3 | User dashboard | Implemented | 7 | Dynamic content with API calls. |
| 17.4 | Browse companions | Implemented | 6 | Search + filter + pagination. |
| 17.5 | Companion profile page | Implemented | 7 | Public profile display. |
| 17.6 | Sessions list | Implemented | 7 | Filtered list with status badges. |
| 17.7 | New session wizard | Implemented | 7 | Multi-step form. |
| 17.8 | Session room (real-time) | Implemented | 5 | Audio + timer + drift alerts; depends on LiveKit. |
| 17.9 | Payments page | Implemented | 7 | Transaction history. |
| 17.10 | Profile settings | Implemented | 7 | User settings management. |
| 17.11 | Companion dashboard | Implemented | 7 | Schedule, earnings, stats. |
| 17.12 | Availability editor | Implemented | 6 | Weekly schedule management. |
| 17.13 | Earnings page | Implemented | 7 | Earnings history + payout info. |
| 17.14 | Admin panel (6 sections) | Implemented | 6 | Full admin management UI. |
| 17.15 | Terms of Service | Implemented | 9 | Static legal page. |
| 17.16 | Privacy Policy | Implemented | 9 | Static legal page. |
| 17.17 | i18n (EN, FR, AR + RTL) | Implemented | 7 | Full translation support. |
| 17.18 | Auth state (Zustand) | Implemented | 7 | Token management + interceptors. |
| 17.19 | API client (Axios) | Implemented | 7 | JWT interceptor + auto-refresh. |
| 17.20 | Responsive design | Implemented | 7 | Mobile-first with Tailwind. |
| 17.21 | Help center / FAQ | **Not Implemented** | — | No in-app help system. |
| 17.22 | Onboarding tutorial | **Not Implemented** | — | No guided first-time user experience. |
| 17.23 | Notification center | **Not Implemented** | — | No in-app notification system. |

---

### 3.18 Mobile App

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 18.1 | Expo project scaffold | Implemented | — | Basic Expo Router setup. |
| 18.2 | Navigation structure | **Partial** | — | Basic tab/stack navigation. |
| 18.3 | Authentication flow | **Not Implemented** | — | |
| 18.4 | Session management | **Not Implemented** | — | |
| 18.5 | Companion browsing | **Not Implemented** | — | |
| 18.6 | Real-time audio sessions | **Not Implemented** | — | |
| 18.7 | Push notifications | **Not Implemented** | — | |
| 18.8 | App Store submission | **Not Implemented** | — | |

---

### 3.19 Infrastructure

| # | Feature | Status | Scalability | Notes |
|---|---------|--------|:-----------:|-------|
| 19.1 | Docker Compose (dev) | Implemented | — | PostgreSQL + Redis. |
| 19.2 | Docker Compose (prod) | Implemented | 5 | Full stack, single node. |
| 19.3 | Dockerfile.api (multi-stage) | Implemented | 7 | Optimized production build. |
| 19.4 | Dockerfile.web (multi-stage) | Implemented | 7 | Next.js standalone build. |
| 19.5 | GitHub Actions CI | Implemented | 7 | Lint, typecheck, test, build, docker. |
| 19.6 | Database migrations | Implemented | 8 | Prisma migrations. |
| 19.7 | Database seeding | Implemented | 7 | 7 users + contract templates. |
| 19.8 | Production hosting | **Not Implemented** | — | No production environment deployed. |
| 19.9 | CDN for static assets | **Not Implemented** | — | |
| 19.10 | Error monitoring (Sentry) | **Not Implemented** | — | |
| 19.11 | APM / Performance monitoring | **Not Implemented** | — | |
| 19.12 | Log aggregation | **Not Implemented** | — | |
| 19.13 | Uptime monitoring | **Not Implemented** | — | |
| 19.14 | Database backups | **Not Implemented** | — | |
| 19.15 | Horizontal scaling | **Not Implemented** | — | Single-instance only. |
| 19.16 | Staging environment | **Not Implemented** | — | |

---

## 4. Unimplemented Features Priority Matrix

### P0 — Must Have Before Launch

| Feature | Module | Effort | Impact |
|---------|--------|--------|--------|
| ~~Real email sending (SMTP)~~ | ~~Email~~ | ~~1-2 days~~ | **DONE.** Nodemailer with 7 HTML templates. |
| ~~Fix `@CurrentUser('sub')` bug~~ | ~~Ratings, Abuse Reports~~ | ~~30 min~~ | **DONE.** Already fixed in current code. |
| ~~Stripe webhook comprehensive handling~~ | ~~Payments~~ | ~~2-3 days~~ | **DONE.** 6 event types + Redis idempotency. |
| ~~GDPR data export (actual file)~~ | ~~Users~~ | ~~1-2 days~~ | **DONE.** Full JSON export with all user data. |
| Production hosting deployment | Infrastructure | 2-3 days | Required to go live |
| Error monitoring (Sentry) | Infrastructure | 1 day | Required for production stability |
| Database backups | Infrastructure | 1 day | Data protection requirement |
| LiveKit production setup | Media | 1 day | Required for audio sessions |

### P1 — Should Have for Launch

| Feature | Module | Effort | Impact |
|---------|--------|--------|--------|
| Subscription billing (Stripe) | Payments | 3-5 days | Revenue model depends on it |
| ~~Session timeout / auto-abandon~~ | ~~Sessions~~ | ~~1-2 days~~ | **DONE.** Cron every 5 min, auto-abandons stale sessions. |
| Session reminders / notifications | Sessions | 2-3 days | Reduces no-shows |
| Uptime monitoring | Infrastructure | 0.5 days | Detect outages |
| Log aggregation | Infrastructure | 1-2 days | Debug production issues |
| Staging environment | Infrastructure | 1-2 days | Test before production |
| Socket.IO Redis adapter | Drift | 1 day | Required for multi-instance |
| VAT / tax handling | Payments | 2-3 days | EU legal requirement |

### P2 — Nice to Have for Launch

| Feature | Module | Effort | Impact |
|---------|--------|--------|--------|
| Avatar upload + CDN | Users | 2-3 days | Better UX |
| Calendar integration | Availability | 3-5 days | Companion convenience |
| Availability-aware matching | Matching | 2-3 days | Better match quality |
| Companion tier auto-progression | Companions | 1-2 days | Gamification |
| Rating moderation (admin) | Ratings | 1 day | Content control |
| Onboarding tutorial | Frontend | 2-3 days | Reduce churn |
| Notification center (in-app) | Frontend | 3-5 days | Better engagement |
| OAuth / social login | Auth | 2-3 days | Lower registration friction |

### P3 — Future Roadmap

| Feature | Module | Effort | Impact |
|---------|--------|--------|--------|
| Mobile app (full) | Mobile | 4-8 weeks | New market segment |
| Automated drift detection (AI) | Drift | 2-4 weeks | Core differentiator |
| Group sessions | Sessions | 2-3 weeks | Revenue expansion |
| Session recording | Media | 1-2 weeks | Premium feature |
| Referral program | Business | 1-2 weeks | Growth lever |
| Streak / gamification | Business | 1-2 weeks | Retention |
| AI session summaries | AI | 2-3 weeks | Premium feature |
| Slack / Notion integration | Integrations | 1-2 weeks | Enterprise appeal |
| Invoice generation (PDF) | Payments | 1-2 weeks | Business compliance |
| 2FA (TOTP) | Auth | 1 week | Security enhancement |
| Horizontal scaling | Infrastructure | 2-3 weeks | 10K+ users |
| Multi-region deployment | Infrastructure | 3-4 weeks | Global scale |
| Blog / CMS | Marketing | 1-2 weeks | SEO |
| A/B testing framework | Infrastructure | 1-2 weeks | Optimization |
| Feature flags | Infrastructure | 1 week | Safe deployments |
| Companion training platform | Business | 4-6 weeks | Quality control |
| Payment dispute workflow | Payments | 1-2 weeks | Trust |
| Appeal process (suspended users) | Admin | 1 week | Fairness |

---

## 5. Technical Debt

| # | Issue | Severity | Module | Description |
|---|-------|----------|--------|-------------|
| TD-1 | ~~`@CurrentUser('sub')` bug~~ | ~~Critical~~ | ~~Ratings, Abuse Reports~~ | **FIXED.** All controllers now use `@CurrentUser('id')` correctly. |
| TD-2 | Stripe uses raw `fetch` | Medium | Payments | Manual Stripe API implementation instead of official SDK. Harder to maintain, missing edge cases. |
| TD-3 | LiveKit manual JWT | Medium | Media | Manual JWT generation instead of LiveKit SDK. Fragile and harder to extend. |
| TD-4 | No database transactions | Medium | Multiple | Several multi-step operations (availability replacement, contract acceptance) lack explicit transactions. |
| TD-5 | ~~Email service is a stub~~ | ~~High~~ | ~~Email~~ | **FIXED.** Nodemailer transport with 7 HTML email templates. Falls back to console.log for local dev. |
| TD-6 | Companion search uses SQL LIKE | Low | Companions | No full-text search index. Will degrade at scale. |
| TD-7 | Admin stats are uncached | Low | Admin | Aggregate queries on every request. Should be cached or pre-computed. |
| TD-8 | Refresh tokens in DB | Low | Auth | At high scale, Redis would be more efficient for token storage. |
| TD-9 | Reputation calculated synchronously | Medium | Ratings | Recalculates on every new rating. Should be async/queued at scale. |
| TD-10 | No request logging middleware | Medium | API | No structured request/response logging for debugging. |
| TD-11 | Online status in DB | Low | Companions | `isOnline` field in PostgreSQL; should use Redis for real-time status at scale. |
| TD-12 | No API response caching | Low | API | No HTTP caching headers or server-side caching for public endpoints. |

---

## 6. Security Gaps

| # | Gap | Severity | Description | Remediation |
|---|-----|----------|-------------|-------------|
| SG-1 | ~~No per-route rate limiting~~ | ~~Medium~~ | **FIXED.** Per-route `@Throttle()` on auth (register, login, forgot-password, reset) and payment (authorize, refund) endpoints. | — |
| SG-2 | No CSRF protection | Medium | If cookies are used for auth in the future. | Add CSRF tokens for cookie-based auth. |
| SG-3 | Secrets in .env files | Medium | API keys and secrets stored in plain text .env files. | Migrate to a secrets manager (Vault, AWS SSM). |
| SG-4 | No dependency scanning | Medium | No automated vulnerability detection for npm dependencies. | Add Snyk or GitHub Dependabot. |
| SG-5 | No penetration testing | High | No formal security assessment conducted. | Schedule pentest before production launch. |
| SG-6 | No request logging with PII redaction | Medium | Cannot audit or investigate security incidents. | Add structured logging with PII masking. |
| SG-7 | ~~Password change doesn't revoke tokens~~ | ~~Medium~~ | **FIXED.** `POST /auth/change-password` revokes all refresh tokens on password change. | — |
| SG-8 | No Content Security Policy | Low | Missing CSP headers on web app. | Configure CSP in Next.js. |
| SG-9 | Age verification is trivial | Medium | Only checks date of birth, no identity verification. | Integrate ID verification service for production. |
| SG-10 | No brute force protection | Medium | Login endpoint has only global rate limiting. | Add account lockout after N failed attempts. |

---

## 7. Scalability Bottlenecks

### Current Architecture Limits

| Bottleneck | Current Limit | Impact Point | Solution |
|------------|--------------|--------------|----------|
| **Single API instance** | ~500 concurrent requests | 1K-2K users | Horizontal scaling with load balancer |
| **PostgreSQL single node** | ~5K concurrent connections | 5K-10K users | Connection pooling (PgBouncer), read replicas |
| **Redis single node** | ~50K ops/sec | 10K+ users | Redis Cluster or managed Redis |
| **Socket.IO single process** | ~10K connections | 1K concurrent sessions | Redis adapter for multi-process |
| **Matching algorithm O(n)** | ~1K companions | N/A at current scale | Pre-computed scores, caching |
| **Admin stats aggregate queries** | ~100K records | 10K+ sessions | Materialized views, caching |
| **Companion search SQL LIKE** | ~10K companions | Slow search | Elasticsearch or pg_trgm |
| **Reputation sync calculation** | ~100 ratings/companion | Per-rating overhead | Async queue (Bull/BullMQ) |
| **LiveKit Cloud free tier** | 100 participants/month | Beta launch | Paid plan or self-hosted |

### Scaling Roadmap

| Scale | Users | Changes Needed |
|-------|-------|----------------|
| **Beta** | 100 | Current architecture is sufficient |
| **Launch** | 1K | Add monitoring, caching, connection pooling |
| **Growth** | 10K | Horizontal scaling, read replicas, Redis cluster, search indexing |
| **Scale** | 100K | Microservices evaluation, CDN, multi-region, dedicated infra |

---

## 8. Recommended Implementation Order

### Phase 1: Critical Fixes (Week 1) — COMPLETED
1. ~~Fix `@CurrentUser('sub')` bug~~ — Already fixed
2. ~~Implement real email sending (SMTP)~~ — Nodemailer + 7 HTML templates
3. ~~Implement actual GDPR data export~~ — Full JSON export
4. ~~Add change-password endpoint~~ — With token revocation
5. ~~Stripe webhook expansion~~ — 6 events + Redis idempotency
6. ~~Per-route rate limiting~~ — Auth + payment endpoints
7. ~~Session auto-abandon cron~~ — Every 5 min
8. ~~Auto-capture/cancel payments~~ — On session completion/cancellation
9. ~~Email notifications~~ — Booking, completion, companion approval

### Phase 2: Production Infrastructure (Next Priority)
10. Set up production hosting (Railway/Render/Hetzner)
11. Configure LiveKit Cloud production account
12. Set up Stripe production keys
13. Set up error monitoring (Sentry)
14. Set up database backups (daily automated)
15. Set up uptime monitoring
16. Configure staging environment

### Phase 3: Business-Critical Features
17. Implement subscription billing (Stripe Subscriptions)
18. Add VAT/tax handling for EU
19. Add session reminder notifications (email)
20. Set up Socket.IO Redis adapter for scaling
21. Add structured logging + log aggregation

### Phase 4: UX Improvements (Week 5-7)
18. Avatar upload with CDN
19. In-app notification center
20. Onboarding tutorial for new users
21. OAuth social login (Google, Apple)
22. Availability-aware matching
23. Companion tier auto-progression

### Phase 5: Growth Features (Week 7-10)
24. Mobile app core features
25. Referral program
26. Automated drift detection (keyword-based MVP)
27. Calendar integration
28. Blog / CMS for SEO

### Phase 6: Scale (Month 3+)
29. Horizontal scaling + load balancer
30. Database read replicas + connection pooling
31. Search indexing (Elasticsearch)
32. Feature flags + A/B testing
33. Multi-region deployment evaluation

---

*Last updated: February 2026*
