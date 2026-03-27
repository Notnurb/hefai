# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check (no emit)

# Database
npx prisma generate         # Regenerate Prisma client (also runs on postinstall)
npx prisma migrate dev      # Run migrations in development
npx prisma studio           # Open Prisma Studio GUI
npx prisma db seed          # Seed database (prisma/seed.ts)

# Local infrastructure
docker-compose up -d        # Start PostgreSQL 15 + Redis 7

# Backend (Python FastAPI)
cd backend && pip install -r requirements.txt
cd backend && uvicorn main:app --reload
```

## Architecture

This is a full-stack AI chat application ("Hefai") with multi-modal capabilities. The repo contains two services:

### Next.js Frontend (`src/`)

Uses the App Router. Route groups split auth-protected and public pages:
- `(app)/` — Protected routes: `chat/[id]`, `code/`, `images/`, `videos/`, `profile/`, `subscribe/`
- `(auth)/` — Login/register pages
- `studio/` — Studio interface

**Authentication**: Dual-layer. Clerk (`@clerk/nextjs`) handles the primary auth provider in the root layout (`app/layout.tsx`). A custom JWT system (`src/lib/auth/jwt.ts`, `src/lib/auth/password.ts`) exists in parallel for the custom `User` model stored in PostgreSQL via Prisma. `src/context/AuthContext.tsx` manages the custom auth state.

**State**: Three React contexts manage global state — `AuthContext`, `ChatContext`, and `SubscriptionContext`. Feature-level state lives in large custom hooks (`src/hooks/useChat.ts`, `useCodeGen.ts`, `useImageGen.ts`, `useVideoGen.ts`).

**API routes** (`src/app/api/`) mirror the hook structure. Chat uses SSE streaming. The memory, search, and agents routes proxy to the Python backend.

**Database access**: Prisma client via `src/lib/db/prisma.ts`. Supabase SDK also present (`src/lib/db/supabase.ts` and `src/lib/supabase/`) — used for storage/realtime alongside Prisma for relational data.

**AI models**: Configured in `src/lib/ai/models.ts`. System prompts in `src/lib/ai/system-prompt.ts`. Chat modes (normal, epsilon, etc.) in `src/lib/ai/modes.ts`. xAI integration in `src/lib/ai/xai.ts`.

**UI**: shadcn/ui components in `src/components/ui/` (44+ components). HugeIcons + Lucide for icons. Framer Motion for animations. Three.js + Spline for 3D elements. `src/lib/utils.ts` exports the `cn()` helper (clsx + tailwind-merge).

### Python Backend (`backend/`)

FastAPI service with three routers:
- `routers/memory.py` — mem0 memory system (vendored at `backend/vendor/mem0/`) + SuperMemory
- `routers/search.py` — Web search via xAI + Exa APIs
- `routers/agents.py` — Multi-AI agent orchestration (Claude, OpenAI, xAI)

Memory uses Qdrant for vector storage and SQLite (aiosqlite) for local persistence.

### Database Schema (PostgreSQL via Prisma)

Key models: `User` → `Conversation` → `Message` (cascade delete). `FileUpload` and `AIUsage` relate to `User`. `Session` and `PasswordResetToken` for the custom auth layer. Conversations and file uploads support soft-delete via `deletedAt`.

### Infrastructure

- PostgreSQL 15 + Redis 7 via Docker Compose for local dev
- S3 (`@aws-sdk/client-s3`) for file storage with presigned URLs
- Rate limiting in `src/lib/security/rate-limit.ts`

## Required Environment Variables

```
DATABASE_URL          # PostgreSQL connection (Prisma pooled)
DIRECT_URL            # PostgreSQL direct connection (Prisma migrations)
NEXT_PUBLIC_APP_URL   # Frontend URL for CORS
```

Plus Clerk keys, Supabase keys, AWS S3 credentials, and AI provider API keys (xAI, Exa, OpenAI, Anthropic). No `.env.example` exists — check service integrations for required keys.
