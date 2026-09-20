# Configuration module — agent memory model

Implementation-grounded reference for `backend/src/configuration/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Company, Branch, FinancialYear, SequenceGenerator, PrinterConfiguration, BarcodeConfiguration |
| **Module** | [`configuration.module.ts`](../../../backend/src/configuration/configuration.module.ts) |
| **Controllers** | 6 |
| **Services** | 6 |
| **AppSetting** | Extended in [`SettingsModule`](../../../backend/src/settings/settings.module.ts) |

---

## 2. API catalog

Permissions use `CONFIGURATION:RESOURCE:ACTION`. Delete endpoints require `DeleteEntityQueryDto`.

| Resource | Base path | Scoping |
|----------|-----------|---------|
| Company | `/companies` | JWT `companyId` only (tenant-scoped) |
| Branch | `/branches` | JWT `companyId` |
| FinancialYear | `/financial-years` | JWT `companyId`; optional branch filter |
| SequenceGenerator | `/sequence-generators` | Company + optional branch |
| PrinterConfiguration | `/printer-configurations` | Company + optional branch |
| BarcodeConfiguration | `/barcode-configurations` | Company + optional branch |

### Workflow routes

| Method | Path | Permission |
|--------|------|------------|
| POST | `/financial-years/:id/close` | `CONFIGURATION:FINANCIAL_YEAR:CLOSE` |

---

## 3. Business rules

- **Company `isDefault`:** clears other company defaults when set true; default company cannot be deleted
- **Branch `isHeadOffice`:** clears other head offices for same company; head office branch cannot be deleted
- **FinancialYear `isCurrent`:** clears other current FY for same company+branch scope (branch-scoped exclusivity; company-wide `branchId: null` is separate)
- **FinancialYear close:** OPEN → CLOSED; blocks further update/delete
- **FinancialYear list:** optional `branchId` query filter
- **SequenceGenerator:** admin CRUD via `SequenceGeneratorConfigService`; document allocation stays internal via persistence `SequenceGeneratorService.next()`; DELETE blocked when `isActive=true`
- **Company uniqueness:** `companyCode`, `companyName`, `gstNumber`, `drugLicenseNumber`
- **Printer/Barcode `isDefault`:** clears siblings for same scope key
- **DELETE guards:** strict FK checks before soft-delete

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Constants | `constants/configuration.constants.ts` |
| Utils | `utils/configuration.util.ts` |

---

## 5. Related infrastructure (not this module)

- **`IdSequence`** — global BIGINT PK counter in [`id-sequence.service.ts`](../../../backend/src/persistence/prisma/id-sequence.service.ts); allocated automatically by the Prisma `create` hook. Not exposed via configuration REST API.
- **`SequenceGenerator`** — admin CRUD is in this module; runtime document-number allocation uses persistence [`SequenceGeneratorService`](../../../backend/src/persistence/sequence/sequence-generator.service.ts).

---

## 6. Out of scope (v1)

- Enforcing `FINANCIAL_YEAR_CLOSED` on all transaction modules
- Angular admin UI
