# Repository Guidelines

## Start Here

PricePilot uses Next.js 16, TypeScript, Drizzle, Vitest, and Playwright. Use Node 24 (`.nvmrc`) with `npm ci`. Before submitting, run `npm run lint`, `npm run typecheck`, and `npm test`. Consult later sections as needed.

## Find the Relevant Code

- Pages and API routes: `src/app/`; room screens: `src/app/room/[code]/`
- Components: `src/components/`; UI primitives: `src/components/ui/`
- Business rules and WebMCP contracts: `src/lib/`
- Database schema, client, and seeds: `src/db/`; generated SQL: `drizzle/`
- Product artwork: `public/products/`; guides: `docs/`
- Tests: `tests/unit/`, `tests/integration/`, and `tests/e2e/`

Keep route handlers thin; put domain behavior in `src/lib/` and data access in `src/db/`.

## Commands by Task

- `npm run dev` starts Next.js; `npm run build` creates the production bundle.
- `npm test` runs unit tests; `npm run test:watch` watches them.
- `npm run test:integration` migrates the database, then runs serial integration tests.
- `npm run test:e2e` runs Chromium Playwright tests.
- `npm run db:generate` creates Drizzle migrations; `npm run db:migrate` applies them.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, and appropriate trailing commas. Prefer named exports, explicit domain types, and the `@/` alias. Use kebab-case filenames (`room-service.ts`), PascalCase components, camelCase functions, and `SCREAMING_SNAKE_CASE` constants. ESLint and TypeScript configuration are authoritative.

## When Adding Tests

Name Vitest files `*.test.ts` or `*.test.tsx` and Playwright files `*.spec.ts`. Use unit tests for pure behavior, integration tests for persistence, and E2E tests for visible journeys. Database tests require `DATABASE_URL` and migrated schema. There is no coverage threshold; cover regressions and meaningful branches.

## When Changing Data or Configuration

Copy `.env.example` to `.env.local`; never commit Neon URLs or secrets. Use `DATABASE_URL` for pooled runtime traffic and `DIRECT_DATABASE_URL` for migrations. Commit generated migrations with schema changes. Preserve the demo boundary: no real payments, personal data, or private merchant floors.

## Commits & Pull Requests

Prefer `type: summary` commits, such as `fix: prevent duplicate checkout`. Pull requests should explain behavior and verification, link issues, flag schema or environment changes, and include UI screenshots. Run relevant integration or E2E tests.

## Maintaining These Instructions

Keep this root guide repository-wide. Put subsystem guidance in a nearer `AGENTS.md`, and link to authoritative configuration or documentation instead of duplicating it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
