# Backend seed script issues
_Exported on 8/26/2026 at 13:01:36 GMT+5:30 from Cursor (3.17.8)_

---

**User**

@backend/seed review this and create a plan to fix issues in seed sxcript and update document accordingly

---

**Cursor**

I'll review the seed scripts and related documentation. Let me explore the seed directory and understand the current state.

Let me read the core seed files and documentation.

Now let me read the remaining lib files and generators.

Now let me read the generators.

Now the remaining generators.

I now have a full picture of the seed code. Let me verify against the actual Prisma schema to identify real issues.

The schema.prisma has no models. Prisma 7 supports multi-file schemas. Let me find the model definitions.

The models are split across 74 files. Let me read the ones the seed writes to, to verify field names against the schema.

Let me verify the purchase, sales, and other transactional models the generators write to.

Let me read the sales, sync, financial, party, medicine, security, and pricing models.

Let me verify the party, medicine, pricing, security, financial, and configuration models.

Let me verify the security seed JSON (recently modified) and a few master data files against the loaders.

Let me verify the remaining models the generators write to (medicine, pricing, financial, prescription, loyalty, user).

Let me verify the geo master UUIDs referenced by hardcoded maps in the generators actually exist in the JSON.

I've completed a thorough review of the seed script (`seed.ts`, all `lib/` helpers, all six generators) and cross-checked every write against the actual Prisma schema (74 model files) and the JSON fixtures. The static data (geo/salt/security UUIDs, field names) all line up — the real problems are in the seed runner's CLI/flow logic and in the docs.

Here's what I found:

**Confirmed bugs in the script**
- **`--fresh` flag is a no-op.** `parseArgs` only checks for `--no-wipe` (`const fresh = !argv.includes('--no-wipe')`). Both `db:seed:fresh` (`--fresh`) and the Prisma `seed` hook pass `--fresh`, which is never read — wiping happens by default regardless. Plain `db:seed` (no flag) also wipes.
- **`--no-wipe` (append) mode is broken.** The in-memory `id-registry` and `SeedContext` sequence counters reset every run, so appended rows collide on branch-scoped unique doc numbers (e.g. `SI-B01-000001`, `@@unique([branchId, invoiceNumber])`).
- **`--only <phase>` is broken for anything past `masters`.** Skipped phases never populate `SeedContext`/registry, so later phases run against empty arrays (`faker.helpers.arrayElement([])` throws; empty `branchRecords`/`customerIds`). Only `--only masters` works.
- **Dead code:** in `inventory.generator.ts`, initial stock already creates 200–400 movements, so `movementTarget = 100 - existingMovements` is always 0 and the random-movement loop (lines 119–149) never executes. `shouldRun` also has an unused `startIdx` param.

**Doc/comment mismatches**
- README advertises the broken `--no-wipe`/`--only` flows, uses raw `npx tsx` (not the npm scripts), and states "Parties ~80" though actual `Party` rows = 100 (80 + 20 manufacturers).
- `AGENTS.md` / `00-project-context.mdc` imply `db:seed` seeds without wiping and only `db:seed:fresh` wipes — both actually wipe.
- `id-registry.ts` comment claims BIGINT PKs "lack AUTOINCREMENT," but every model now declares `@default(autoincrement())` — stale.

Before I write the plan, two scoping decisions materially change the work:

> **How should I handle the broken --no-wipe (append) and --only <phase> resume modes?**
> - Deprecate/remove them and document full wipe+reseed as the only supported flow (minimal, low-risk) (Recommended)
> - Fully implement resumable seeding: rehydrate id-registry + SeedContext from the DB so append/--only actually work (larger change) ✔
> - Keep the flags but fix only --fresh/wipe handling; leave append/--only as-is (documented as unsupported)

> **What should the wipe behavior be after the fix?**
> - Wipe only when --fresh is passed; plain `db:seed` becomes non-destructive append (matches AGENTS.md intent) (Recommended) ✔
> - Keep wiping by default; make `db:seed` and `db:seed:fresh` both explicitly wipe and update docs to say so

Both choices point to a larger, resumable design. One critical implementation detail I need to confirm first: whether the manual global-ID assignment in `seed/lib/prisma-client.ts` is actually required (the persistence rule says some tables lack working SQLite autoincrement). This determines how append-mode must avoid PK collisions. Let me check the app's real Prisma client and the `nextBigIntId` mechanism.

I have everything I need. The key finding that shapes the design: the app itself (`backend/src/persistence/prisma/bigint-id-sequence.ts` + `prisma-client.factory.ts`) confirms that SQLite BIGINT PKs from `db push` have **no working AUTOINCREMENT**, so IDs must be assigned manually — and the app already has a `syncBigIntIdSequenceFromDb()` helper to continue the counter from the DB max. The seed's `id-registry.ts` has a `resetIdSequence(start)` but never syncs it, which is exactly why append currently breaks. So resumable seeding must (a) sync the global ID counter from the DB, (b) rehydrate the registry + `SeedContext` from the DB, and (c) make masters/inventory idempotent.

Let me write up the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

I'll implement the plan in order, starting with the flag semantics and orchestration in `seed.ts`.


Next I'll extend `SeedContext` and add `hydrate.ts`.


Implementing core infrastructure: extending `SeedContext`, updating `id-registry`, exporting tables from `wipe.ts`, and adding `hydrate.ts`.


Updating `load-masters.ts` for idempotency and fixing the generators.


Updating the inventory, purchase, and sales generators.


The initial `stock.create` call was dropped in the last edit — restoring it now.


Running lint and verifying the seed script.


Append mode failed because several master models aren't in the hydrate registry. Expanding `hydrateRegistry` to include them.


Append mode fails because the fixed Faker seed produces duplicate UUIDs and codes. Updating Faker initialization and generator offsets for append runs.


The manufacturer code collision came from reading `mfgOffset` inside the loop — fixing that by computing it once before the loop.


Purchase invoice numbering uses a global counter — switching it to per-branch sequences.


Fixing duplicate batch collisions in stock take, adjustment, and transfer item loops.


All verification passed. Running lint on the touched files.


All plan items are done. Summary of what changed:

### Seed runner ([`backend/seed/seed.ts`](backend/seed/seed.ts))
- **`--fresh`** now controls wiping; default `db:seed` is append-only
- **`--no-wipe`** kept as deprecated alias (append)
- **`hydrateFromDb()`** runs on append and `--only` resume before phases
- **`initFaker(!fresh)`** uses a shifted seed on append to avoid duplicate random UUIDs

### New hydration layer ([`backend/seed/lib/hydrate.ts`](backend/seed/lib/hydrate.ts))
- Syncs BIGINT id counter from DB max ids
- Rebuilds uuid→id registry for all master models
- Rehydrates `SeedContext` (branches, parties, medicines, batches, stock, price lists, outbox uuids)
- Parses branch-scoped document numbers to restore sequence counters

### Resumable / append-safe generators
- **Masters**: skip existing UUIDs via `tryResolve()` ([`load-masters.ts`](backend/seed/lib/load-masters.ts))
- **Inventory**: idempotent stock creation, additive movement top-up, per-branch doc numbers, unique batches per take/adjustment/transfer
- **Purchase/Sales/Sync/Financial**: per-branch or offset-based numbering for PI, PR, SR, SP, ADJ, ST, TK, EXP, RX, outbox `operationId`/`sequenceNo`, payments, receipts, loyalty, ledger

### Docs ([`backend/seed/README.md`](backend/seed/README.md))
- Documents fresh / append / `--only` modes, npm scripts, party count (100), and BIGINT id re-sync behavior

### Verification (all passed)
```
npm run db:seed:fresh   → 100 invoices, 100 batches, 100 parties
npm run db:seed         → 200 invoices, 200 batches (append)
npm run db:seed -- --only sales → 300 invoices (resume)
```

---

**User**

add/update command details@backend/README.md or any other plces applicable

---

**Cursor**

I'll find every place that documents seed commands and update them to match the new fresh/append/resume behavior.


Updating seed command docs in `backend/README.md` and other applicable references.


Updated seed command documentation across the repo to match the new fresh / append / `--only` behavior.

### Primary update — [`backend/README.md`](backend/README.md)
- Replaced outdated “default: wipe + reseed” wording
- Added a **command table** (`db:seed`, `db:seed:fresh`, `--only`, `db:reset`, `prisma db seed`)
- Documented **phases**, **examples**, and **troubleshooting**
- Fixed the broken troubleshooting line (missing closing backtick)

### Also updated
| File | Change |
|------|--------|
| [`backend/AGENTS.md`](backend/AGENTS.md) | Seed commands with append / resume notes |
| [`.cursor/rules/00-project-context.mdc`](.cursor/rules/00-project-context.mdc) | Command table descriptions |
| [`.cursor/rules/prisma-persistence-rules.mdc`](.cursor/rules/prisma-persistence-rules.mdc) | Seed mode bullets |
| [`docs/.../architecture/testing.md`](docs/pharmacy_erp_architecture_docs/architecture/testing.md) | When to use fresh vs append before tests |
| [`docs/.../architecture/early-foundations.md`](docs/pharmacy_erp_architecture_docs/architecture/early-foundations.md) | Fresh DB + append / `--only` pointers |
| [`docs/.../architecture/extending-the-backend.md`](docs/pharmacy_erp_architecture_docs/architecture/extending-the-backend.md) | Seed section + link to `seed/README.md` |
| [`docs/.../architecture/reporting.md`](docs/pharmacy_erp_architecture_docs/architecture/reporting.md) | When to use fresh after JSON changes |
| [`docs/.../database/persistence-patterns.md`](docs/pharmacy_erp_architecture_docs/database/persistence-patterns.md) | Integration test seed note |
| [`docs/.../roadmap/migration.md`](docs/pharmacy_erp_architecture_docs/roadmap/migration.md) | Append + resume rows in table |

[`backend/seed/README.md`](backend/seed/README.md) was already updated during the implementation and remains the detailed reference for phases, modes, and BIGINT id re-sync.

