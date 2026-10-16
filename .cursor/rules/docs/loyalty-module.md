# Loyalty module — agent memory model

Implementation-grounded reference for `backend/src/loyalty/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Loyalty program CRUD, customer enrollment, earn/redeem on sales invoice post |
| **Module** | [`loyalty.module.ts`](../../../backend/src/loyalty/loyalty.module.ts) |
| **Controllers** | `LoyaltyProgramController`, `LoyaltyEnrollmentController` |
| **Sales hook** | [`LoyaltyIntegrationService`](../../../backend/src/loyalty/services/loyalty-integration.service.ts) — imported by `SalesModule` |

---

## 2. API catalog

| Resource | Base path | Notes |
|----------|-----------|-------|
| Programs | `/loyalty-programs` | List, get, create, patch |
| Enrollment | `/customers/:customerId/loyalty-enrollments` | `POST` enroll active customer |

Permissions (seed codes): `LOYALTY_PROGRAM_VIEW`, `LOYALTY_PROGRAM_CREATE`, `LOYALTY_PROGRAM_UPDATE`, enrollment create permission as seeded in `permission.json`.

Sales post accepts optional `redeemPoints` on workflow DTO; earning uses program rules at post time.

---

## 3. Persistence

| Entity | Outbox type |
|--------|-------------|
| `LoyaltyProgram` | `LoyaltyProgram` |
| `LoyaltyTransaction` | `LoyaltyTransaction` |
| `CustomerLoyaltyMembership` | `CustomerLoyaltyMembership` |

Mutations use `UnitOfWorkService` + `auditService.log` + `outbox.enqueue` per project conventions.

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Utils | `utils/loyalty.util.ts` |

---

## 5. Out of scope (current)

- Manual points adjustment HTTP API (DTO only)
- Sales return / cancel loyalty reversal
- Points expiry scheduled job
- Full Angular earn/redeem on invoice screen

Delivery context: [product-gaps-delivery.md](../../../docs/pharmacy_erp_architecture_docs/architecture/product-gaps-delivery.md).
