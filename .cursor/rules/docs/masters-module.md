# Masters (lookup) module — agent memory model

Implementation-grounded reference for `backend/src/masters/`.

---

## 1. Module snapshot

| Item | Value |
|------|-------|
| **Purpose** | Geographic lookup: Country, State, City, Area |
| **Module** | [`masters.module.ts`](../../../backend/src/masters/masters.module.ts) |
| **Controllers** | 4 |
| **Services** | 4 |

---

## 2. API catalog

Permissions use `LOOKUP:RESOURCE:ACTION`. Flat CRUD routes:

| Resource | Base path | List filter |
|----------|-----------|-------------|
| Country | `/countries` | search, isActive |
| State | `/states` | `countryId`, search |
| City | `/cities` | `stateId`, search |
| Area | `/areas` | `cityId`, search |

All org-global — no branch scoping.

---

## 3. Business rules

- **Hierarchy:** Country → State → City → Area (parent FK validated on create/update)
- **Unique codes** within parent scope
- **DELETE guards:**
  - Country: states or `PartyAddress.countryId`
  - State: cities or `PartyAddress.stateId`
  - City: areas or `PartyAddress.cityId`
  - Area: no party-address FK in current schema (guard when column added)
- **UPDATE:** `auditAndLogChanges` for ChangeHistory

---

## 4. Layer map

| Layer | Path |
|-------|------|
| Controllers | `controllers/` |
| Services | `services/` |
| DTOs | `dto/` |
| Mappers | `mappers/` |
| Utils | `utils/masters.util.ts` |

---

## 5. Out of scope (v1)

- Nested route hierarchy (`/countries/:id/states`)
- Angular admin UI
