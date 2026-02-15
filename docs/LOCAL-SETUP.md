# Hushroom Local Development Setup

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker Desktop** ([download](https://docker.com/products/docker-desktop))
- **Git**

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/hibra984/hushroom.git
cd hushroom
pnpm install
```

### 2. Start Database & Redis

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`

### 3. Configure Environment

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` with these minimum values:

```env
DATABASE_URL=postgresql://hushroom:hushroom@localhost:5432/hushroom?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-access-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters-long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
CORS_ORIGINS=http://localhost:3000
```

### 4. Set Up Database

```bash
# Run migrations
pnpm --filter api prisma:migrate

# Seed demo data
pnpm --filter api prisma:seed
```

### 5. Start Development Servers

```bash
# Start everything (API + Web + shared packages)
pnpm dev

# Or start individually:
pnpm --filter api dev          # API on http://localhost:3001
pnpm --filter @hushroom/web dev  # Web on http://localhost:3000
```

### 6. Verify Everything Works

- **API Health:** http://localhost:3001/api/v1/health
- **API Docs (Swagger):** http://localhost:3001/docs
- **Web App:** http://localhost:3000

## Demo Accounts (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@hushroom.com | Password123! | Admin |
| user1@hushroom.com | Password123! | User |
| user2@hushroom.com | Password123! | User |
| user3@hushroom.com | Password123! | User |
| companion1@hushroom.com | Password123! | Companion (Standard) |
| companion2@hushroom.com | Password123! | Companion (Verified) |
| companion3@hushroom.com | Password123! | Companion (Expert) |

## Common Commands

```bash
# Build all packages
pnpm build

# Type check
pnpm type-check

# Run API tests
pnpm --filter api test

# Run API tests in watch mode
pnpm --filter api test:watch

# Prisma Studio (visual DB browser)
pnpm --filter api prisma:studio

# Generate Prisma client after schema changes
pnpm --filter api prisma:generate

# Create a new migration
pnpm --filter api prisma:migrate

# Reset database (drop + recreate + seed)
pnpm --filter api prisma:reset

# Lint
pnpm lint
```

## Docker Production Build

```bash
# Build and run production stack
docker compose -f docker/docker-compose.prod.yml up --build

# This starts:
# - PostgreSQL on :5432
# - Redis on :6379
# - API on :3001
# - Web on :3000
```

## Project Structure

```
hushroom/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   ├── web/          # Next.js frontend (port 3000)
│   └── mobile/       # React Native / Expo
├── packages/
│   ├── shared-types/       # TypeScript types
│   ├── shared-validators/  # Zod schemas
│   ├── shared-constants/   # Enums, constants
│   ├── eslint-config/      # Shared ESLint
│   └── tsconfig/           # Shared TS configs
├── docker/                 # Docker Compose files
└── docs/                   # Documentation
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3001 (API)
npx kill-port 3001

# Kill process on port 3000 (Web)
npx kill-port 3000
```

### Database connection issues
```bash
# Check if Docker containers are running
docker ps

# Restart containers
docker compose -f docker/docker-compose.yml restart

# View container logs
docker compose -f docker/docker-compose.yml logs postgres
```

### Prisma issues
```bash
# Regenerate Prisma client
pnpm --filter api prisma:generate

# Full database reset
pnpm --filter api prisma:reset
```

## Using with External AI Tools

### Lovable (lovable.dev)
1. Push your code to GitHub (already done)
2. Go to [lovable.dev](https://lovable.dev) and connect your GitHub
3. Import the `hushroom` repository
4. Lovable works best for frontend/UI work — point it at `apps/web/`
5. Use it to iterate on UI components, pages, and styling

### OpenAI Codex / ChatGPT
1. Share the repo URL: `https://github.com/hibra984/hushroom`
2. For context, share the plan file and relevant source files
3. Use for: code review, writing tests, documentation, debugging

### Claude Code
1. Navigate to the project directory
2. Run `claude` to start Claude Code
3. Claude Code has full access to read, write, and execute in the project
