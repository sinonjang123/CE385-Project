# CLAUDE.md — find THIS

Guidance for Claude Code when working in this repository.

## Project

find THIS is a product price-comparison website for Shopee, Lazada, and Amazon. Keep the frontend, backend, database, and user/admin responsibilities clearly separated.

**Retailer prices are mock data.** Do not describe them as live prices or imply that retailer APIs are connected.

## Required stack

- **Frontends (`user/` and `admin/`):** React, TypeScript, Zod, Tailwind CSS, Axios, Vite (existing setup).
- **Backend:** Node.js, Express, TypeScript, Zod.
- **Database:** Prisma + PostgreSQL. Preserve the in-memory demo mode used when `DATABASE_URL` is not set.
- Follow the dependencies and patterns already in the repo. Do not add a competing framework or library without explaining why and getting approval first.

## Architecture

npm workspaces: `user/` (`@find-this/user`, port 5173), `admin/` (`@find-this/admin`, port 5174) and `backend/` (`@find-this/api`, port 3001). The two frontends are independent Vite apps (no shared package); both proxy `/api` to the backend. Docs, ERD, PDF and SQL reference live in `docs/`. See README for the full tree.

| Area | Location |
| --- | --- |
| User site: session + screen switching | `user/src/App.tsx` |
| User pages (home, compare, sources, profile, login/register) | `user/src/pages/` |
| User API (catalog, register/login) + Zod schemas | `user/src/api/` |
| Admin app: admin-only login gate → dashboard | `admin/src/App.tsx` |
| Admin pages (login, dashboard with CRUD, overview) | `admin/src/pages/` |
| Admin UI (layout, data table, record modal) | `admin/src/components/` |
| Admin API (`/api/admin/*`, login, health) + Zod schemas | `admin/src/api/` |
| Per-app types / utils | `user/src/types/`, `user/src/utils/`, `admin/src/types/`, `admin/src/utils/` |
| Backend startup / Express app | `backend/src/server.ts`, `backend/src/app.ts` |
| Env config (JWT, DB URL, admin bootstrap) | `backend/src/config/env.ts` |
| Public routes (health, catalog, mock retailers) | `backend/src/routes/public/` |
| User auth routes (register, login, me) | `backend/src/routes/user/` |
| Admin routes (auth gate in `index.ts`; catalog, users, audit) | `backend/src/routes/admin/` |
| Auth / rate-limit / error middleware | `backend/src/middleware/` |
| Zod request validators | `backend/src/validators/` |
| Data access (user, catalog, audit, in-memory store) | `backend/src/repositories/` |
| JWT + mock retailer services, demo data, DTO types | `backend/src/services/`, `backend/src/data/`, `backend/src/types/` |
| Prisma schema, migrations, seed | `backend/prisma/` |

Rules:
- Keep user registration/login separate from admin-only operations. Enforce authorization in backend routes — hiding a frontend control is not an authorization check.
- The admin app has no registration screen. Its client-side role check after login is UX only; `/api/admin/*` stays guarded by `requireUser` + `requireAdmin`.
- When a type, schema or util changes, update both `user/` and `admin/` copies if both use it.
- Users self-register with the `user` role. Do not add admin creation or role promotion through the user-management UI/API. Preserve the existing protected admin bootstrap process.

## Security and data handling

- Apply the CIA triad (confidentiality, integrity, availability) and the 3 A's (authentication, authorization, auditable actions) where relevant.
- JWT verification and role checks stay on the backend. Never trust a role, identity, price, or permission supplied only by the client.
- Validate external input with Zod at API boundaries. Return explicit validation errors without exposing secrets or stack traces.
- Use Prisma's typed query APIs. Never concatenate user input into SQL; if raw SQL is unavoidable, use parameterized queries only.
- Keep rate limits on auth and other abuse-prone endpoints. Keep security headers and password hashing intact.
- Never hardcode secrets, credentials, JWT keys, database URLs, or retailer API credentials — read them from environment config and keep them out of source, logs, and responses. Mock/demo fixtures and non-secret constants may stay in code.
- Do not log passwords, tokens, or unnecessary personal data. Never weaken authorization or validation to make a test pass.
- Make mock data / mock API status explicit in the UI and docs. Do not fetch retailer sites or claim real integration without explicit authorization and credentials.

## Workflow

1. Before editing, check `git status` and read the relevant files. Sync with a remote only if one exists and it won't overwrite local work. Never discard uncommitted changes. Never push automatically.
2. Briefly explain the relevant structure and affected areas.
3. State a short implementation plan before changing code.
4. Make small, focused changes one logical part at a time and review each diff. "Incremental" means easy to verify — not splitting a coherent change into needless edits.
5. Run the smallest relevant checks, then `npm run build` and `npm test` when applicable. There is currently no lint script — say so rather than inventing one.
6. Summarize the diff, checks run, and remaining limitations.
7. Offer an exact commit message and help commit when asked. Do not commit or push without explicit user confirmation, and never include unrelated pre-existing changes.

## Change standards

- Precise, minimal changes that preserve existing behavior unless a change is requested.
- Keep TypeScript types accurate; avoid unsafe casts and silent error fallbacks.
- Update directly related docs and tests when behavior, endpoints, or config change.
- Do not touch unrelated files or revert user changes. Ask first if existing work conflicts with the request.
- In responses, distinguish verified behavior from assumptions, mock behavior, and untested production integrations.

## Commands

```bash
npm install          # install all workspaces
npm run dev          # API + user + admin together
npm run dev:user     # user site only -> http://localhost:5173
npm run dev:admin    # admin only     -> http://localhost:5174
npm run dev:api      # backend only   -> http://localhost:3001/api/health
npm run build        # build user, admin, then backend
npm test             # backend tests
```
