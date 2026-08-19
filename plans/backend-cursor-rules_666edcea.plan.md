---
name: backend-cursor-rules
overview: Create a set of focused, industry-standard Cursor rule files (.mdc) under pharmacy-erp-desktop/.cursor/rules/ plus a backend AGENTS.md, codifying the actual NestJS 11 + Prisma 7 + TypeScript conventions already used in backend/src (persistence layer, ApplicationException/ErrorCode, ResponseInterceptor, class-validator).
todos:
  - id: context
    content: Create 00-project-context.mdc (alwaysApply) with stack, layout, commands, additive-only policy
    status: completed
  - id: ts
    content: Create typescript-rules.mdc scoped to backend/**/*.ts (formatting, naming, bigint, imports)
    status: completed
  - id: nest
    content: Create nestjs-rules.mdc (modules, DI, DTO validation, ApplicationException/ErrorCode, ResponseInterceptor)
    status: completed
  - id: prisma
    content: Create prisma-persistence-rules.mdc (UnitOfWork, Outbox, Sequence, error mapping, transactions)
    status: completed
  - id: testing
    content: Create testing-rules.mdc (jest unit + persistence integration, coverage, data lifecycle)
    status: completed
  - id: agents
    content: Create backend/AGENTS.md onboarding file
    status: completed
isProject: false
---

## Backend Cursor & Language Rules

Create Cursor rule files modeled on the existing [java-rules.mdc](c:\Users\abadgujar2\IdeaProjects\eSearch\.cursor\rules\java-rules.mdc), but grounded in this repo's real backend conventions. All new files go in a new `pharmacy-erp-desktop/.cursor/rules/` directory (repo-scoped), plus an `AGENTS.md` at the backend root.

Each `.mdc` uses frontmatter (`description`, `globs`, `alwaysApply`) so Cursor auto-attaches the right rule by file path.

### Files to create

- `pharmacy-erp-desktop/.cursor/rules/00-project-context.mdc` — `alwaysApply: true`
  - Stack: NestJS 11, Prisma 7 (`@prisma/adapter-better-sqlite3`), TypeScript 5.7, RxJS, class-validator/transformer, Jest 30.
  - Repo layout (`backend/src`, `backend/seed`, `backend/test`, `docs/pharmacy_erp_architecture_docs`).
  - Key commands from [backend/package.json](backend/package.json): `npm run build`, `lint`, `format`, `test`, `test:persistence`, `db:seed`, `db:reset`.
  - Additive-only + minimal-diff + preserve line-endings policy (ported from java-rules).

- `pharmacy-erp-desktop/.cursor/rules/typescript-rules.mdc` — `globs: backend/**/*.ts`
  - Formatting must match [.prettierrc](backend/.prettierrc) (`singleQuote`, `trailingComma: all`) and [eslint.config.mjs](backend/eslint.config.mjs) (`recommendedTypeChecked`); run `npm run lint`/`format` before finishing; no drive-by reformatting.
  - `type`-only imports for types (`import type { TxClient }`), remove unused imports.
  - camelCase members/functions, PascalCase classes, context-specific names (no `data`/`result`/`tmp`); prefer `interface` for input/result DTOs (`SequenceNextInput`).
  - Explicit return types on exported/public methods; avoid `any` (note repo disables `no-explicit-any` but prefer `unknown` + narrowing, per [global-exception.filter.ts](backend/src/common/exceptions/global-exception.filter.ts)).
  - `bigint` for IDs/sequence values (literals like `0n`, `+ 1n`), never coerce to `number`.
  - Comments explain intent only; no narration.

- `pharmacy-erp-desktop/.cursor/rules/nestjs-rules.mdc` — `globs: backend/src/**/*.ts`
  - Feature-module structure (`@Module`), constructor DI with `private readonly`.
  - DTO validation via class-validator + global `ValidationPipe`; controllers thin, logic in services.
  - Errors: throw `ApplicationException(ErrorCode, message, HttpStatus, details)` — never return neutral defaults on failure (ported "propagate exceptions" rule); add codes to [error-code.ts](backend/src/common/exceptions/error-code.ts).
  - Responses shaped by [ResponseInterceptor](backend/src/common/interceptors/response.interceptor.ts) — return raw data / `PaginatedResult`, do not hand-build `{ success, data }`.
  - Lifecycle hooks (`OnModuleInit`/`OnModuleDestroy`) as in [prisma.service.ts](backend/src/prisma.service.ts); use Nest `Logger`.

- `pharmacy-erp-desktop/.cursor/rules/prisma-persistence-rules.mdc` — `globs: backend/src/persistence/**/*.ts, backend/seed/**/*.ts`
  - All multi-write flows run inside `UnitOfWorkService.run(tx => ...)` and pass `TxClient` down (see [unit-of-work.service.ts](backend/src/persistence/unit-of-work/unit-of-work.service.ts)); optimistic concurrency via `version` + `updateMany` count check (see [sequence-generator.service.ts](backend/src/persistence/sequence/sequence-generator.service.ts)).
  - Map Prisma errors with `rethrowAsApplicationException`; document numbers via `SequenceGeneratorService`; enqueue sync changes via `OutboxService` inside the same tx (see [outbox.service.ts](backend/src/persistence/outbox/outbox.service.ts)).
  - Follow [docs/.../persistence-patterns.md](docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md); no raw `prisma.$transaction` in feature services.

- `pharmacy-erp-desktop/.cursor/rules/testing-rules.mdc` — `globs: backend/**/*.spec.ts, backend/test/**/*.ts`
  - Unit specs `*.spec.ts` (Jest, `rootDir: src`); persistence/integration under `backend/test/persistence` run via `npm run test:persistence` (`--runInBand`).
  - Cover positive + negative/error branches and every boolean outcome (ported branch-coverage checklist); assert resolved behavior, not just codes.
  - Tests create and clean up their own data; never mutate seed data.

- `backend/AGENTS.md`
  - Concise onboarding: stack, layout, commands, and pointers to the four rule domains above + architecture docs.

### Notes
- Multiple focused files chosen per your selection; globs keep each rule scoped so only relevant ones attach.
- No source/behavior changes — documentation/config-style additions only.