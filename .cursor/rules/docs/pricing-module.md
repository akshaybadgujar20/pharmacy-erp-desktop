# Pricing module — agent memory model

Implementation-grounded reference for `backend/src/pricing/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Tax, discount rules, branch-scoped price lists and items |
| **Module** | [`pricing.module.ts`](../../../backend/src/pricing/pricing.module.ts) |
| **Controllers** | 4 (Tax, DiscountRule, PriceList, PriceListItem nested) |
| **Services** | 4 |
| **Exports** | `PriceListService` |

---

## 2. API catalog

Permissions use `PRICING:RESOURCE:ACTION`. Delete endpoints require `DeleteEntityQueryDto`.

| Resource | Base path | Scoping |
|----------|-----------|---------|
| Tax | `/taxes` | Org-global |
| DiscountRule | `/discount-rules` | Org-global |
| PriceList | `/price-lists` | JWT branch + org-wide null branchId |
| PriceListItem | `/price-lists/:priceListId/items` | Nested under PriceList |

### Workflow / replace routes

| Method | Path | Permission |
|--------|------|------------|
| PUT | `/price-lists/:priceListId/items/replace` | `PRICING:PRICE_LIST_ITEM:REPLACE` |

---

## 3. Business rules

- **PriceList default:** clearing other defaults for same branch when `isDefault=true`
- **Tax delete:** blocked when referenced by price list items or invoice lines
- **UPDATE audit:** tax, discount rule, price list use `auditAndLogChanges`
- **Dates:** BIGINT epoch ms in DB; ISO strings in API responses

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Constants | `constants/pricing.constants.ts` |
| Utils | `utils/pricing.util.ts` |
