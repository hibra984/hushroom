# Hushroom Developer Guide

> Comprehensive technical documentation for the Hushroom Structured Human Presence Platform.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Prerequisites & Setup](#3-prerequisites--setup)
4. [Project Structure](#4-project-structure)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Mobile App Architecture](#7-mobile-app-architecture)
8. [Shared Packages](#8-shared-packages)
9. [Database Schema & Migrations](#9-database-schema--migrations)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Session Lifecycle & State Machine](#11-session-lifecycle--state-machine)
12. [Matching Algorithm](#12-matching-algorithm)
13. [Payment Flow](#13-payment-flow)
14. [Real-time Features](#14-real-time-features)
15. [Drift Detection System](#15-drift-detection-system)
16. [Rating & Reputation System](#16-rating--reputation-system)
17. [Admin Panel](#17-admin-panel)
18. [API Reference](#18-api-reference)
19. [Environment Configuration](#19-environment-configuration)
20. [Docker & Deployment](#20-docker--deployment)
21. [CI/CD Pipeline](#21-cicd-pipeline)
22. [Testing](#22-testing)
23. [i18n / Localization](#23-i18n--localization)
24. [Security Considerations](#24-security-considerations)
25. [Contributing Guidelines](#25-contributing-guidelines)
26. [Troubleshooting](#26-troubleshooting)

---

## 1. Introduction

Hushroom is a **Structured Human Presence Platform** — a marketplace connecting users with trained human companions for focused, goal-bound accountability sessions via real-time audio.

Unlike therapy, coaching, or consulting, Hushroom provides **pure human presence** with behavioral contracts, drift enforcement, and measurable outcomes.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Session** | A time-bound, goal-oriented interaction between a user and a companion |
| **Companion** | A trained human who provides structured presence during sessions |
| **Goal** | A defined objective for a session, with success criteria |
| **Contract** | Behavioral rules governing a session (strict/moderate/flexible) |
| **Drift** | Deviation from the session's contracted goals or rules |
| **Matching** | Multi-factor algorithm that pairs users with optimal companions |

### Session Types

| Type | Purpose |
|------|---------|
| `FOCUS` | Deep work with an accountability witness (body doubling) |
| `DECISION` | Structured decision-making with a present observer |
| `EMOTIONAL_UNLOAD` | Safe space to express feelings with a non-judgmental human |
| `PLANNING` | Goal setting and planning with structured accountability |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Clients                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │
│  │ Next.js   │  │ Expo /    │  │ Swagger UI    │   │
│  │ Web App   │  │ React     │  │ (API Docs)    │   │
│  │ :3000     │  │ Native    │  │ :3001/docs    │   │
│  └─────┬─────┘  └─────┬─────┘  └───────┬───────┘   │
└────────┼──────────────┼────────────────┼────────────┘
         │              │                │
         ▼              ▼                ▼
┌─────────────────────────────────────────────────────┐
│              NestJS API (:3001)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Modules: Auth, Users, Companions, Sessions,   │  │
│  │ Goals, Contracts, Matching, Payments, Ratings, │  │
│  │ Availability, Drift, Media, Admin, Health,     │  │
│  │ Email                                          │  │
│  └────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Prisma   │  │ Redis    │  │ Socket.IO        │  │
│  │ ORM      │  │ Service  │  │ Gateway          │  │
│  └────┬─────┘  └────┬─────┘  └──────────────────┘  │
└───────┼─────────────┼───────────────────────────────┘
        │             │
        ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐
│ PostgreSQL   │ │ Redis 7  │ │ LiveKit  │ │ Stripe │
│ 16           │ │          │ │ (Audio)  │ │        │
└──────────────┘ └──────────┘ └──────────┘ └────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | NestJS | 11.x |
| **Frontend** | Next.js | 16.x |
| **Mobile** | React Native / Expo | 52.x |
| **ORM** | Prisma | Latest |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis (ioredis) | 7 |
| **Auth** | Passport.js + JWT | — |
| **Payments** | Stripe (PaymentIntent + Connect) | — |
| **Audio/Video** | LiveKit | — |
| **Real-time** | Socket.IO | — |
| **Build** | Turbo | 2.3 |
| **Package Manager** | pnpm | 9+ |
| **Language** | TypeScript | 5.x |

---

## 3. Prerequisites & Setup

See [LOCAL-SETUP.md](./LOCAL-SETUP.md) for the quick-start guide.

### Requirements

- **Node.js** 20+
- **pnpm** 9+
- **Docker Desktop** (for PostgreSQL & Redis)
- **Git**

### Full Setup

```bash
# 1. Clone
git clone https://github.com/hibra984/hushroom.git
cd hushroom

# 2. Install dependencies
pnpm install

# 3. Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# 4. Configure environment
cp .env.example apps/api/.env
# Edit apps/api/.env with your values

# 5. Database setup
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed

# 6. Start development
pnpm dev
```

### Verify

- **API Health:** http://localhost:3001/api/v1/health
- **Swagger Docs:** http://localhost:3001/docs
- **Web App:** http://localhost:3000

---

## 4. Project Structure

```
hushroom/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Database migrations
│   │   │   └── seed.ts               # Demo data seeder
│   │   ├── src/
│   │   │   ├── main.ts               # App bootstrap
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── common/
│   │   │   │   ├── decorators/       # @CurrentUser, @Roles
│   │   │   │   ├── prisma/           # PrismaService
│   │   │   │   └── redis/            # RedisService
│   │   │   └── modules/
│   │   │       ├── auth/             # Authentication
│   │   │       ├── users/            # User management
│   │   │       ├── companions/       # Companion profiles
│   │   │       ├── sessions/         # Session lifecycle
│   │   │       ├── goals/            # Session goals
│   │   │       ├── contracts/        # Behavioral contracts
│   │   │       ├── matching/         # Matching algorithm
│   │   │       ├── payments/         # Stripe payments
│   │   │       ├── ratings/          # Rating & reputation
│   │   │       ├── availability/     # Companion scheduling
│   │   │       ├── drift/            # Drift detection
│   │   │       ├── media/            # LiveKit rooms
│   │   │       ├── admin/            # Admin operations
│   │   │       ├── health/           # Health checks
│   │   │       └── email/            # Email service
│   │   ├── test/                     # E2E tests
│   │   └── .env                      # Environment config
│   │
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (auth)/           # Login, Register
│   │   │   │   ├── (dashboard)/      # User dashboard
│   │   │   │   ├── (companion)/      # Companion dashboard
│   │   │   │   ├── (admin)/          # Admin dashboard
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   └── globals.css       # Global styles
│   │   │   ├── stores/               # Zustand state
│   │   │   └── lib/                  # API client, utils
│   │   └── public/                   # Static assets
│   │
│   └── mobile/                       # React Native / Expo
│       └── (scaffolded)
│
├── packages/
│   ├── shared-types/                 # TypeScript definitions
│   ├── shared-validators/            # Zod schemas
│   ├── shared-constants/             # Enums, constants
│   ├── tsconfig/                     # Shared TS configs
│   └── eslint-config/                # Shared linting
│
├── docker/
│   ├── docker-compose.yml            # Dev (PG + Redis)
│   ├── docker-compose.prod.yml       # Production stack
│   ├── Dockerfile.api                # API multi-stage build
│   └── Dockerfile.web                # Web multi-stage build
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
│
├── docs/                             # Documentation
├── turbo.json                        # Turbo config
├── pnpm-workspace.yaml               # Workspace config
└── package.json                      # Root scripts
```

---

## 5. Backend Architecture

### Module Pattern

Each NestJS module follows this structure:

```
module-name/
├── module-name.module.ts       # Module definition
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
└── dto/
    ├── create-*.dto.ts         # Input validation (class-validator)
    └── update-*.dto.ts
```

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| `PrismaService` | `common/prisma/prisma.service.ts` | Database access (extends PrismaClient) |
| `RedisService` | `common/redis/redis.service.ts` | Cache & pub/sub (extends ioredis) |
| `AuthService` | `modules/auth/auth.service.ts` | JWT generation, password hashing, token rotation |
| `StripeService` | `modules/payments/stripe.service.ts` | Stripe API client (manual fetch, no SDK) |
| `MediaService` | `modules/media/media.service.ts` | LiveKit JWT generation (manual, no SDK) |

### Guards

| Guard | Purpose |
|-------|---------|
| `JwtAuthGuard` | Validates JWT token, attaches user to request |
| `RolesGuard` | Checks `@Roles()` decorator against `user.role` |
| `ThrottlerGuard` | Rate limiting (60 req/60s globally) |

### Decorators

| Decorator | Usage |
|-----------|-------|
| `@CurrentUser()` | Extracts user from JWT request (`req.user`) |
| `@CurrentUser('id')` | Extracts specific property from JWT user |
| `@Roles('ADMIN')` | Restricts endpoint to specific roles |

### Validation

All DTOs use `class-validator` decorators. The `ValidationPipe` is configured globally with:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unknown properties

### Path Alias

The API uses `@/*` as a path alias mapping to `src/*`:
```typescript
import { PrismaService } from '@/common/prisma/prisma.service';
```

---

## 6. Frontend Architecture

### Next.js 16 with App Router

The web app uses route groups for role-based layouts:

| Route Group | Layout | Purpose |
|-------------|--------|---------|
| `(auth)` | Auth layout | Login, Register |
| `(dashboard)` | User layout | User-facing pages with sidebar |
| `(companion)` | Companion layout | Companion dashboard, availability, earnings |
| `(admin)` | Admin layout | Admin panel |

### State Management — Zustand

```typescript
// stores/auth.store.ts
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: async (email, password) => { ... },
  register: async (data) => { ... },
  logout: () => { ... },
  refreshToken: async () => { ... },
}));
```

### API Client

Axios-based client with JWT interceptor that automatically:
1. Attaches `Authorization: Bearer <token>` to all requests
2. Intercepts 401 responses and attempts token refresh
3. Retries the original request with new token

### Styling

- **Tailwind CSS 4** with custom design tokens
- Dark theme with teal/emerald accents
- Responsive design (mobile-first)

### i18n

- `i18next` + `react-i18next`
- Languages: English (en), French (fr), Arabic (ar with RTL)
- Translation files in `public/locales/{lang}/`

---

## 7. Mobile App Architecture

- **Framework:** React Native with Expo 52
- **Navigation:** Expo Router
- **Status:** Scaffolded only — no feature implementation yet
- **Path:** `apps/mobile/`

---

## 8. Shared Packages

| Package | Path | Contents |
|---------|------|----------|
| `@hushroom/shared-types` | `packages/shared-types` | TypeScript interfaces and type definitions |
| `@hushroom/shared-validators` | `packages/shared-validators` | Zod validation schemas |
| `@hushroom/shared-constants` | `packages/shared-constants` | Enums, magic numbers, config constants |
| `@hushroom/tsconfig` | `packages/tsconfig` | Base TS configs (nestjs.json, nextjs.json, react-native.json) |
| `@hushroom/eslint-config` | `packages/eslint-config` | Shared ESLint rules |

---

## 9. Database Schema & Migrations

### Models (16 total)

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | All users (USER, COMPANION, ADMIN roles) |
| `RefreshToken` | `refresh_tokens` | JWT refresh token storage |
| `CompanionProfile` | `companion_profiles` | Companion-specific data, ratings, status |
| `Availability` | `availability` | Companion weekly schedule slots |
| `Session` | `sessions` | Session records with state machine |
| `Goal` | `goals` | Session goals with success criteria |
| `Contract` | `contracts` | Behavioral contracts per session |
| `ContractTemplate` | `contract_templates` | Reusable contract templates |
| `DriftLog` | `drift_logs` | Drift events during sessions |
| `Rating` | `ratings` | Post-session ratings (bidirectional) |
| `Payment` | `payments` | Stripe payment records |
| `LanguagePreference` | `language_preferences` | User language preferences |
| `AuditLog` | `audit_logs` | System-wide audit trail |
| `AbuseReport` | `abuse_reports` | User-submitted abuse reports |

### Enums (11)

`UserRole`, `CompanionType`, `CompanionStatus`, `SessionType`, `SessionStatus`, `ContractMode`, `DriftSeverity`, `PaymentStatus`, `RefundReason`, `AvailabilityDay`, `AuditAction`

### Key Relationships

```
User 1──1 CompanionProfile
User 1──N Session (as user)
CompanionProfile 1──N Session (as companion)
Session 1──1 Goal
Session 1──1 Contract
Session 1──1 Payment
Session 1──N Rating
Session 1──N DriftLog
User 1──N Rating (as rater and rated)
User 1──N RefreshToken
CompanionProfile 1──N Availability
```

### Migration Commands

```bash
# Create migration after schema changes
pnpm --filter api prisma:migrate

# Generate Prisma client
pnpm --filter api prisma:generate

# Reset database (destructive)
pnpm --filter api prisma:reset

# Open Prisma Studio (visual DB browser)
pnpm --filter api prisma:studio

# Seed demo data
pnpm --filter api prisma:seed
```

---

## 10. Authentication & Authorization

### JWT Flow

```
1. User registers/logs in
2. Server creates:
   - Access token (15 min) — signed with JWT_ACCESS_SECRET
   - Refresh token (7 days) — stored in DB, signed with JWT_REFRESH_SECRET
3. Client stores tokens
4. Access token sent in Authorization header: Bearer <token>
5. On 401, client calls /auth/refresh with refresh token
6. Server validates, rotates (revokes old, creates new pair)
7. Client retries original request
```

### JWT Payload

```typescript
{
  sub: user.id,    // User UUID
  email: user.email,
  role: user.role  // USER | COMPANION | ADMIN
}
```

### JwtStrategy.validate() Output

```typescript
// What gets attached to req.user:
{
  id: user.id,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  isAgeVerified: user.isAgeVerified,
  isEmailVerified: user.isEmailVerified
}
```

### Role-Based Access

```typescript
// Protect an endpoint to admins only:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin/stats')
getStats() { ... }

// Get current user:
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser('id') userId: string) { ... }
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## 11. Session Lifecycle & State Machine

### States

```
PENDING_MATCH → MATCHED → PAYMENT_AUTHORIZED → READY → IN_PROGRESS
                                                          ↕
                                                        PAUSED
                                                          ↓
                                                      COMPLETED
```

### Valid Transitions

| From | To | Trigger |
|------|----|---------|
| `PENDING_MATCH` | `MATCHED` | Companion selected via matching |
| `PENDING_MATCH` | `CANCELLED` | User cancels before match |
| `MATCHED` | `PAYMENT_AUTHORIZED` | Payment hold placed |
| `MATCHED` | `CANCELLED` | Either party cancels |
| `PAYMENT_AUTHORIZED` | `READY` | User marks ready |
| `PAYMENT_AUTHORIZED` | `CANCELLED` | Either party cancels |
| `READY` | `IN_PROGRESS` | Session starts |
| `READY` | `CANCELLED` | Either party cancels |
| `IN_PROGRESS` | `PAUSED` | Session paused |
| `IN_PROGRESS` | `COMPLETED` | Session ends normally |
| `IN_PROGRESS` | `ABANDONED` | Session abandoned |
| `IN_PROGRESS` | `DISPUTED` | Dispute raised |
| `PAUSED` | `IN_PROGRESS` | Session resumed |
| `PAUSED` | `COMPLETED` | Session ended while paused |
| `PAUSED` | `ABANDONED` | Session abandoned while paused |

### Full Session Flow

1. **User creates session** → `PENDING_MATCH`
2. **User creates goal** for the session
3. **User runs matching** → gets ranked companion list
4. **User selects companion** → `MATCHED`
5. **Contract created** and both parties accept
6. **Payment authorized** (hold on card) → `PAYMENT_AUTHORIZED`
7. **User marks ready** → `READY`
8. **Session starts** → `IN_PROGRESS` (startedAt set)
9. **Pause/Resume** as needed ↔ `PAUSED`
10. **Session ends** → `COMPLETED` (endedAt set, durationMinutes calculated)
11. **Payment captured** (companion paid minus commission)
12. **Both parties rate** (within 48 hours)

---

## 12. Matching Algorithm

### Scoring Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| **goalMatch** | 35% | Keyword overlap between session goal keywords and companion expertise tags |
| **reputation** | 30% | Normalized companion reputation score (0-5 → 0-1) |
| **fairDistribution** | 20% | Inverse of recent session count (Redis-backed, ensures equity) |
| **priceFit** | 15% | Closeness of companion baseRate to session budget |

### Algorithm Flow

```typescript
// 1. Get session with goal
const session = await prisma.session.findUnique({ include: { goal: true } });

// 2. Get available companions (APPROVED, online, not at capacity)
const companions = await getAvailableCompanions();

// 3. Score each companion
for (const companion of companions) {
  const goalScore = calculateKeywordOverlap(session.goal.keywords, companion.expertiseTags);
  const repScore = normalize(companion.reputationScore, 0, 5);
  const fairScore = 1 / (1 + recentSessionCount);  // from Redis
  const priceScore = 1 - Math.abs(companion.baseRate - maxPrice) / maxPrice;

  const total = goalScore * 0.35 + repScore * 0.30 + fairScore * 0.20 + priceScore * 0.15;
}

// 4. Cache results in Redis (TTL: 30 min)
// 5. Return ranked list
```

---

## 13. Payment Flow

### Stripe Integration

Hushroom uses **Stripe PaymentIntent with manual capture** and **Stripe Connect** for companion payouts.

```
User books session
        ↓
POST /payments/authorize
        ↓
┌─────────────────────────┐
│ Calculate commission:    │
│ Standard: 30%           │
│ Verified: 25%           │
│ Expert: 20%             │
│                         │
│ amount = baseRate       │
│ platformFee = amount *  │
│   commissionRate        │
│ companionPayout =       │
│   amount - platformFee  │
└─────────────────────────┘
        ↓
Create Stripe PaymentIntent
(capture_method: 'manual')
        ↓
Session → PAYMENT_AUTHORIZED
        ↓
    [Session happens]
        ↓
POST /payments/capture/:id
        ↓
Capture PaymentIntent
Transfer to companion's
Stripe Connect account
```

### Commission Rates

| Companion Tier | Commission | Companion Keeps |
|---------------|------------|-----------------|
| Standard | 30% | 70% |
| Verified | 25% | 75% |
| Expert | 20% | 80% |

### Stripe Connect Onboarding

```
POST /payments/onboard
        ↓
Creates Stripe Connect account
Returns onboarding link
        ↓
Companion completes Stripe KYC
        ↓
stripeConnectAccountId saved to CompanionProfile
```

---

## 14. Real-time Features

### Socket.IO

Used for real-time session events:
- Session status changes
- Drift alerts
- Timer synchronization
- Participant presence

### LiveKit (Audio/Video)

```
POST /media/room
        ↓
Creates LiveKit room (linked to session)
        ↓
POST /media/token
        ↓
Generates per-participant JWT
(manual generation, no SDK dependency)
        ↓
Client connects to LiveKit server
        ↓
POST /media/room/close
        ↓
Closes room when session ends
```

---

## 15. Drift Detection System

### Concept

During sessions, drift detection monitors adherence to the behavioral contract. When a participant goes off-topic or breaks contract rules, drift events are logged.

### Severity Levels

| Level | Description | Response |
|-------|-------------|----------|
| `LOW` | Minor deviation | Gentle nudge notification |
| `MEDIUM` | Notable deviation | Companion attention needed |
| `HIGH` | Significant deviation | Requires acknowledgment |
| `CRITICAL` | Major contract breach | Session may be paused/terminated |

### Schema

```prisma
model DriftLog {
  id             String        @id @default(uuid())
  sessionId      String
  severity       DriftSeverity
  message        String
  triggerType    String        // "keyword", "manual", "ai"
  triggerData    Json?
  acknowledgedBy String?
  acknowledgedAt DateTime?
  timestamp      DateTime      @default(now())
}
```

> **Note:** Automated drift detection (NLP/AI-based) is not yet implemented. Currently supports manual drift logging and companion-triggered alerts.

---

## 16. Rating & Reputation System

### Rating Structure

Both parties rate each other after session completion (within 48 hours):

| Dimension | Range | Required |
|-----------|-------|----------|
| `overallScore` | 1-5 | Yes |
| `goalAchievement` | 1-5 | No |
| `presenceQuality` | 1-5 | No |
| `contractAdherence` | 1-5 | No |
| `communication` | 1-5 | No |

### Reputation Calculation

```
Weighted average with:
- Recency bias (recent ratings weighted more heavily)
- Confidence scaling (full confidence at 20+ ratings)
- Daily decay for inactive companions
```

### Constraints

- One rating per person per session (`@@unique([sessionId, raterId])`)
- Only for `COMPLETED` sessions
- 48-hour window after session ends
- Public/private toggle per rating

---

## 17. Admin Panel

### Capabilities

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Platform Stats | `GET /admin/stats` | Users, companions, sessions, payments counts |
| User Management | `GET /admin/users` | List, search, paginate users |
| User Status | `PATCH /admin/users/:id/status` | Activate/deactivate users |
| User Role | `PATCH /admin/users/:id/role` | Change user roles |
| Pending Companions | `GET /admin/companions/pending` | List companions awaiting approval |
| Approve Companion | `PATCH /admin/companions/:id/approve` | Approve companion registration |
| Suspend Companion | `PATCH /admin/companions/:id/suspend` | Suspend a companion |
| Session Monitor | `GET /admin/sessions` | List all sessions with filters |
| Payment Monitor | `GET /admin/payments` | List all payments |
| Audit Logs | `GET /admin/audit-logs` | System audit trail |
| Abuse Reports | `GET /admin/reports` | List abuse reports |
| Resolve Report | `PATCH /admin/reports/:id/resolve` | Resolve with admin notes |
| Dismiss Report | `PATCH /admin/reports/:id/dismiss` | Dismiss report |

### Auto-Suspend

When a user accumulates **3+ pending abuse reports**, they are automatically suspended.

---

## 18. API Reference

All endpoints are prefixed with `/api/v1/`.

### Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh token rotation |
| POST | `/auth/logout` | JWT | Logout (revoke refresh token) |
| POST | `/auth/verify-email` | No | Verify email with token |
| POST | `/auth/forgot-password` | No | Request password reset |
| POST | `/auth/reset-password` | No | Reset password with token |
| POST | `/auth/change-password` | JWT | Change password (validates current, revokes all tokens) |
| POST | `/auth/verify-age` | JWT | Submit age verification |

### Users (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | JWT | Get own profile |
| PATCH | `/users/profile` | JWT | Update profile |
| DELETE | `/users/profile` | JWT | Soft delete account |
| GET | `/users/languages` | JWT | Get language preferences |
| PUT | `/users/languages` | JWT | Set language preferences |
| POST | `/users/data-export` | JWT | Request GDPR data export |

### Companions (`/companions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/companions/register` | JWT | Register as companion |
| GET | `/companions/me` | COMPANION | Get own companion profile |
| PATCH | `/companions/me` | COMPANION | Update companion profile |
| PATCH | `/companions/toggle-online` | COMPANION | Toggle online status |
| GET | `/companions/search` | None | Public companion search |
| GET | `/companions/:id` | None | Public companion profile |

### Sessions (`/sessions`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sessions` | JWT | Create session |
| GET | `/sessions` | JWT | List user's sessions |
| GET | `/sessions/:id` | JWT | Get session by ID |
| PATCH | `/sessions/:id/ready` | JWT | Mark ready |
| PATCH | `/sessions/:id/start` | JWT | Start session |
| PATCH | `/sessions/:id/pause` | JWT | Pause session |
| PATCH | `/sessions/:id/resume` | JWT | Resume session |
| PATCH | `/sessions/:id/end` | JWT | End session |
| PATCH | `/sessions/:id/cancel` | JWT | Cancel session |

### Goals (`/goals`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/goals` | JWT | Create goal for session |
| GET | `/goals/session/:sessionId` | JWT | Get goal by session |
| PATCH | `/goals/:id` | JWT | Update goal achievement |

### Contracts (`/contracts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/contracts/templates` | None | List contract templates |
| GET | `/contracts/templates/:id` | None | Get template by ID |
| POST | `/contracts` | JWT | Create contract |
| GET | `/contracts/:id` | JWT | Get contract by ID |
| PATCH | `/contracts/:id/accept` | JWT | Accept contract |

### Matching (`/matching`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/matching/find` | JWT | Run matching algorithm |
| GET | `/matching/results/:sessionId` | JWT | Get cached match results |
| POST | `/matching/select` | JWT | Select companion from results |

### Payments (`/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/authorize` | JWT | Authorize payment (hold) |
| POST | `/payments/capture/:id` | JWT | Capture authorized payment |
| GET | `/payments` | JWT | List user's payments |
| GET | `/payments/:id` | JWT | Get payment by ID |
| POST | `/payments/refund/:id` | JWT | Refund payment |
| POST | `/payments/onboard` | COMPANION | Stripe Connect onboarding |
| GET | `/payments/earnings` | COMPANION | Get companion earnings |

### Ratings (`/ratings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ratings` | JWT | Create rating |
| GET | `/ratings/session/:sessionId` | JWT | Get session ratings |
| GET | `/ratings/companion/:companionId` | JWT | Get companion ratings |
| GET | `/ratings/me` | JWT | Get own ratings (given/received) |

### Availability (`/availability`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/availability/me` | COMPANION | Get own availability |
| PUT | `/availability` | COMPANION | Set availability slots |
| GET | `/availability/companion/:id` | None | Get companion availability |
| POST | `/availability/block` | COMPANION | Block a date |
| DELETE | `/availability/block/:id` | COMPANION | Remove date block |

### Media (`/media`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/media/room` | JWT | Create LiveKit room |
| POST | `/media/token` | JWT | Get session token |
| POST | `/media/room/close` | JWT | Close room |

### Admin (`/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/stats` | ADMIN | Platform statistics |
| GET | `/admin/users` | ADMIN | List all users |
| PATCH | `/admin/users/:id/status` | ADMIN | Update user status |
| PATCH | `/admin/users/:id/role` | ADMIN | Update user role |
| GET | `/admin/companions/pending` | ADMIN | Pending companions |
| PATCH | `/admin/companions/:id/approve` | ADMIN | Approve companion |
| PATCH | `/admin/companions/:id/suspend` | ADMIN | Suspend companion |
| GET | `/admin/sessions` | ADMIN | List all sessions |
| GET | `/admin/payments` | ADMIN | List all payments |
| GET | `/admin/audit-logs` | ADMIN | Audit logs |

### Abuse Reports (`/abuse-reports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/abuse-reports` | JWT | Create abuse report |
| GET | `/admin/reports` | ADMIN | List reports |
| PATCH | `/admin/reports/:id/resolve` | ADMIN | Resolve report |
| PATCH | `/admin/reports/:id/dismiss` | ADMIN | Dismiss report |

### Health (`/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Basic health check |
| GET | `/health/db` | None | Database check |
| GET | `/health/redis` | None | Redis check |

---

## 19. Environment Configuration

### Required Variables

```env
# Database
DATABASE_URL=postgresql://hushroom:hushroom@localhost:5432/hushroom?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3001
CORS_ORIGINS=http://localhost:3000
```

### Optional Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LiveKit
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880

# Email (SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_...
EMAIL_FROM=noreply@hushroom.com
```

---

## 20. Docker & Deployment

### Development

```bash
# Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d
```

### Production

```bash
# Full stack (PostgreSQL + Redis + API + Web)
docker compose -f docker/docker-compose.prod.yml up --build
```

### Docker Images

| Image | Dockerfile | Description |
|-------|-----------|-------------|
| API | `docker/Dockerfile.api` | Multi-stage NestJS build |
| Web | `docker/Dockerfile.web` | Multi-stage Next.js standalone build |

### Deployment Options

| Option | Best For | Notes |
|--------|----------|-------|
| **Railway** | Quick deployment, PaaS | Easy setup, auto-scaling |
| **Render** | PaaS with free tier | Good for beta phase |
| **Hetzner + Coolify** | Self-hosted, cost-effective | Full control, EU data residency |
| **AWS/GCP** | Enterprise scale | Most complex, most flexible |

---

## 21. CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

```yaml
Pipeline stages:
1. Lint      — ESLint across all packages
2. Typecheck — tsc --noEmit for API and Web
3. Test      — Jest unit and E2E tests
4. Build     — Production builds
5. Docker    — Build and push Docker images
```

---

## 22. Testing

### Test Structure

```
apps/api/test/
├── helpers/
│   └── test-app.ts             # Shared test infrastructure
├── jest-e2e.json               # E2E test configuration
├── auth.e2e-spec.ts            # Auth module (15 tests)
├── users.e2e-spec.ts           # Users module (10 tests)
├── companions.e2e-spec.ts      # Companions module (13 tests)
├── sessions.e2e-spec.ts        # Sessions module (14 tests)
├── goals.e2e-spec.ts           # Goals module (8 tests)
├── contracts.e2e-spec.ts       # Contracts module (10 tests)
├── matching.e2e-spec.ts        # Matching module (7 tests)
├── payments.e2e-spec.ts        # Payments module (8 tests)
├── ratings.e2e-spec.ts         # Ratings module (10 tests)
├── availability.e2e-spec.ts    # Availability module (9 tests)
├── admin.e2e-spec.ts           # Admin module (15 tests)
├── abuse-reports.e2e-spec.ts   # Abuse reports (8 tests)
├── health.e2e-spec.ts          # Health module (3 tests)
└── full-lifecycle.e2e-spec.ts  # Complete lifecycle (15 steps)
```

### Running Tests

```bash
# All tests
pnpm --filter api test

# E2E tests
pnpm --filter api test:e2e

# Watch mode
pnpm --filter api test:watch

# Specific file
pnpm --filter api test -- auth.e2e-spec
```

### Test Helper

The shared `test-app.ts` provides:
- `createTestApp()` — Creates NestJS test application
- `registerUser()` — Registers and returns user + tokens
- `loginUser()` — Logs in and returns tokens
- `registerCompanion()` — Creates user + companion profile
- `cleanDatabase()` — Deletes all data (FK-aware order)
- `cleanRedis()` — Flushes test Redis

---

## 23. i18n / Localization

### Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `fr` | French | LTR |
| `ar` | Arabic | RTL |

### Frontend Implementation

- Framework: `i18next` + `react-i18next`
- Translation files: `public/locales/{lang}/common.json`
- Language switcher component in all layouts
- RTL support via CSS `dir="rtl"` attribute

### Backend

- User's `preferredLanguage` stored in DB
- Error messages currently English-only (future: server-side i18n)

---

## 24. Security Considerations

### Implemented

- JWT with short-lived access tokens (15 min)
- Refresh token rotation with revocation
- bcrypt 12 rounds password hashing
- Helmet security headers
- CORS with explicit origins
- Request validation (whitelist + forbidNonWhitelisted)
- Rate limiting (60 req/60s global)
- Soft delete (preserves audit trail)
- Audit logging for sensitive operations
- Age verification (18+)
- Input validation via class-validator
- SQL injection protection (Prisma parameterized queries)

### Known Issues

- `@CurrentUser('sub')` in RatingsController and AbuseReportsController returns `undefined` because JwtStrategy returns `{ id, ... }` not `{ sub, ... }`. Should be `@CurrentUser('id')`.

### Recommendations for Production

- Implement per-route rate limiting (stricter for auth endpoints)
- Add CSRF protection for cookie-based auth
- Set up secrets management (vault, not .env files)
- Enable dependency vulnerability scanning (Snyk/Dependabot)
- Conduct penetration testing before launch
- Implement request logging with PII redaction
- Add content security policy headers

---

## 25. Contributing Guidelines

### Development Workflow

1. Create feature branch from `main`: `git checkout -b feat/your-feature`
2. Make changes following existing patterns
3. Write/update tests for changes
4. Run `pnpm lint && pnpm type-check && pnpm --filter api test`
5. Commit with conventional commit messages:
   - `feat: add companion search filters`
   - `fix: correct JWT payload property name`
   - `docs: update API reference`
   - `refactor: extract matching algorithm`
   - `test: add session lifecycle E2E tests`
6. Push and create PR against `main`

### Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Module-per-feature architecture
- DTOs for all input validation
- Services for business logic (not controllers)
- Guards for authorization (not services)

### Adding a New Module

```bash
# 1. Create module files
apps/api/src/modules/my-feature/
├── my-feature.module.ts
├── my-feature.controller.ts
├── my-feature.service.ts
└── dto/
    └── create-my-feature.dto.ts

# 2. Import in app.module.ts
# 3. Add Prisma model if needed
# 4. Create migration: pnpm --filter api prisma:migrate
# 5. Write E2E tests in apps/api/test/my-feature.e2e-spec.ts
```

---

## 26. Troubleshooting

### Port Already in Use

```bash
npx kill-port 3001   # API
npx kill-port 3000   # Web
```

### Database Connection Failed

```bash
# Check Docker containers
docker ps

# Restart
docker compose -f docker/docker-compose.yml restart

# View logs
docker compose -f docker/docker-compose.yml logs postgres
```

### Prisma Issues

```bash
# Regenerate client
pnpm --filter api prisma:generate

# Full reset
pnpm --filter api prisma:reset
```

### Module Not Found (@/ alias)

Ensure `tsconfig.json` has the path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### TypeScript Decorator Errors

If you see TS1241/TS1270 errors with decorators, ensure `experimentalDecorators` and `emitDecoratorMetadata` are enabled in `tsconfig.json`.

### Seeded Users Not Working

```bash
# Reset and re-seed
pnpm --filter api prisma:reset
# This drops, recreates, and seeds the database
```

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@hushroom.com | Password123! | Admin |
| user1@hushroom.com | Password123! | User |
| companion1@hushroom.com | Password123! | Companion (Standard) |
| companion2@hushroom.com | Password123! | Companion (Verified) |
| companion3@hushroom.com | Password123! | Companion (Expert) |

---

*Last updated: February 2026*
