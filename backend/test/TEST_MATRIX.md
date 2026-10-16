# Backend test matrix

Track coverage by Nest module. Update **Spec** / **Integration** / **E2e** columns when adding tests.

**Commands:** [TESTING.md](../TESTING.md) · `npx tsx scripts/list-untested-services.ts` · `npx tsx scripts/scaffold-service-specs.ts src/<module>`

**Markers:** HTTP tests use `TEST_MARKER` from [http-test.helpers.ts](./support/http-test.helpers.ts) in remarks; delete in `beforeAll`.

| Module | Wave | Unit (`src/**/*.service.spec.ts`) | Integration | E2e / persistence | Coverage gate |
|--------|------|-----------------------------------|-------------|-------------------|---------------|
| common | T1 | Partial (existing) | — | — | `src/common/**` |
| auth | T1 | Partial + scaffold | via auth e2e | auth.e2e-spec | T1 |
| security | T1 | T1 | security-users.integration | auth e2e | T1 |
| party | T2 | T2 | party-*.integration | party.e2e-spec | T2 |
| masters | T2 | T2 | masters.integration | — | T2 |
| medicine | T3 | T3 | medicine.integration | — | T3 |
| pricing | T3 | T3 | pricing.integration | — | T3 |
| inventory | T4 | T4 | inventory-*.integration | persistence in-transit | T4 |
| purchase | T5 | T5 | purchase-*.integration | purchase-flow.e2e | T5 |
| sales | T6 | T6 | sales-*.integration | sales-flow.e2e | T6 |
| prescription | T7 | T7 | prescription.integration | rx-sales e2e | T7 |
| loyalty | T7 | T7 | loyalty.integration | — | T7 |
| finance | T8 | T8 | finance-*.integration | month-end e2e | T8 |
| configuration | T8 | T8 | configuration.integration | — | T8 |
| settings | T8 | T8 | settings.integration | — | T8 |
| audit | T9 | T9 | audit.integration | — | T9 |
| sync | T9 | T9 | sync.integration | sync-run e2e | T9 |
| reporting | T9 | T9 | reporting.integration | — | T9 |
| persistence | T4/T8 | util specs | persistence/*.integration.spec.ts | — | with modules |

**Angular:** mirror wave in `src/app/features/<area>/**/*.spec.ts`; CI runs root `npm run test:ci`.
