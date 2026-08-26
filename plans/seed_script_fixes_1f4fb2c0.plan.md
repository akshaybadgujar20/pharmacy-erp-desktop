---
name: Seed script fixes
overview: Fix the seed runner's broken flag handling and make append/--only actually work by rehydrating the ID counter, registry, and SeedContext from the database, then reconcile the README with the corrected behavior.
todos:
  - id: flags
    content: "Fix parseArgs/shouldRun flag semantics in seed.ts: --fresh triggers wipe, wire hydrate call for append/--only runs"
    status: completed
  - id: hydrate
    content: "Add seed/lib/hydrate.ts: syncIdSequenceFromDb, hydrateRegistry, hydrateContext (incl. per-branch sequence counters)"
    status: completed
  - id: context-seqs
    content: Extend SeedContext with return/transfer/adjustment/take/payment per-branch counters and next* helpers
    status: completed
  - id: idempotent-masters
    content: Make load-masters.ts skip already-present UUIDs (post-hydrate) for safe append
    status: completed
  - id: inventory-fix
    content: Guard initial stock.create for idempotency and replace dead movementTarget logic with additive top-up
    status: completed
  - id: docnumbers
    content: Switch returns/transfers/adjustments/stock-takes/sales-payments to per-branch counters
    status: completed
  - id: comment-fix
    content: Update stale AUTOINCREMENT comment in id-registry.ts
    status: completed
  - id: scripts
    content: Update package.json db:seed (append) and db:seed:fresh (--fresh) scripts
    status: completed
  - id: docs
    content: Rewrite seed/README.md CLI/modes/volumes; verify AGENTS.md wording
    status: completed
isProject: false
---

## Seed script fixes and resumable seeding

### Background (confirmed against schema + app code)
- SQLite BIGINT PKs from `db push` have no working AUTOINCREMENT. The app assigns IDs manually via `nextBigIntId()` and re-syncs from the DB with `syncBigIntIdSequenceFromDb()` ([backend/src/persistence/prisma/bigint-id-sequence.ts](backend/src/persistence/prisma/bigint-id-sequence.ts)). The seed uses the same pattern in [backend/seed/lib/id-registry.ts](backend/seed/lib/id-registry.ts) / [backend/seed/lib/prisma-client.ts](backend/seed/lib/prisma-client.ts) but never re-syncs, so any non-wipe run collides on PKs and branch-scoped unique doc numbers.
- All static UUIDs referenced by generators (geo, salts, schedules, categories, UOM, roles) exist in the JSON fixtures and resolve correctly on a fresh run.

### Confirmed bugs
- `--fresh` is a no-op: `parseArgs` only reads `--no-wipe`, so `db:seed:fresh` and the Prisma `seed` hook do nothing special; plain `db:seed` wipes by default ([seed.ts](backend/seed/seed.ts) L38-43).
- `--no-wipe` append and `--only <phase>` (past `masters`) are broken: registry + `SeedContext` + per-branch counters reset every run → empty `resolve()`/arrays and duplicate doc numbers.
- Dead code: `movementTarget = 100 - existingMovements` is always 0 ([inventory.generator.ts](backend/seed/lib/generators/inventory.generator.ts) L115-149); `shouldRun` has an unused `startIdx` param.
- Returns/transfers/adjustments/stock-takes/sales-payments number off the loop index `i+1` instead of a per-branch counter, so they collide on append.

---

### 1. Flag semantics + orchestration — [seed.ts](backend/seed/seed.ts)
- `parseArgs`: `fresh = argv.includes('--fresh')` (accept `--no-wipe` as a deprecated alias meaning "not fresh"). Keep `--only`.
- Wipe only when `fresh && !only`.
- When it is NOT a clean fresh-full run (i.e. append, or any `--only`), call a new `hydrateFromDb(prisma, ctx)` before running phases.
- Simplify `shouldRun(phase, only)` (drop unused params).

### 2. New `backend/seed/lib/hydrate.ts`
- `syncIdSequenceFromDb(prisma)`: scan every table (reuse the table list from [wipe.ts](backend/seed/lib/wipe.ts)) for `max(id)` and call `resetIdSequence(max)` so new inserts never collide.
- `hydrateRegistry(prisma)`: `register()` uuid→id for models later phases `resolve()`: Country, State, City, Area, UnitOfMeasure, MedicineCategory, MedicineSchedule, MedicineGeneric, SaltComposition, Role, Tax, Company, Branch, PriceList.
- `hydrateContext(prisma, ctx)`: repopulate `SeedContext` — `branchRecords`, `batchRecords`, `customerIds/supplierIds/doctorIds/employeeIds/employeeUuids/userIds`, `taxIds`, `defaultPriceListId`, `priceListItems`, `stockBalances`, and `medicineRecords` (recover `mrp` from the default `PriceListItem.mrp`, falling back to a batch mrp). Seed the per-branch sequence counters by parsing the numeric suffix of the max existing document number per branch/type.

### 3. Idempotency in loaders/generators
- [load-masters.ts](backend/seed/lib/load-masters.ts): skip `create` when `tryResolve(model, uuid)` is already set (post-hydrate), so fixed-UUID masters don't collide on append.
- [inventory.generator.ts](backend/seed/lib/generators/inventory.generator.ts): guard the initial `stock.create` with an existing-stock check; replace the dead `movementTarget` logic with an additive top-up (e.g. always add N random movements).
- Switch returns/transfers/adjustments/stock-takes/sales-payments to per-branch counters via new `SeedContext` helpers (extend [seed-context.ts](backend/seed/lib/seed-context.ts) with `returnSeq`/`transferSeq`/`adjustmentSeq`/`takeSeq`/`paymentSeq` maps + `next*` methods), and hydrate them in step 2.

### 4. Comment fix — [id-registry.ts](backend/seed/lib/id-registry.ts)
- Update the stale AUTOINCREMENT comment to describe manual ID assignment + DB re-sync on append (mirroring the app's `bigint-id-sequence.ts`).

### 5. npm scripts — [backend/package.json](backend/package.json)
- `db:seed` → `tsx seed/seed.ts` (non-destructive append/idempotent).
- `db:seed:fresh` → `tsx seed/seed.ts --fresh`.
- Keep `prisma.seed` = `--fresh` and `db:reset` unchanged.

### 6. Docs — [backend/seed/README.md](backend/seed/README.md)
- Rewrite the CLI section around npm scripts + corrected flags; document the three modes (fresh wipe, append, `--only <phase>` resume) and that resume assumes earlier phases completed and later phases have not run.
- Fix the volumes note: `Party` rows = 100 (80 business parties + 20 manufacturers).
- Add a short note on manual BIGINT IDs and DB-synced counters.
- `AGENTS.md` / `00-project-context.mdc` command tables already read "db:seed = seed / db:seed:fresh = wipe + seed", which becomes accurate after this change — leave them unless wording needs a tweak.

### Verification (manual, after implementation)
- `npm run lint` on touched files.
- `npm run db:seed:fresh` → full seed, check summary counts.
- `npm run db:seed` again → no PK/unique errors, counts grow (append works).
- `npm run db:seed -- --only sales` on a seeded DB → runs sales→financial without empty-context crashes.
