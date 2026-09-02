# Explore party DTOs/mappers
_Exported on 9/3/2026 at 01:46:15 GMT+5:30 from Cursor (3.18.25)_

---

**User**

Explore the party module DTOs and mappers in backend/src/party/dto and backend/src/party/mappers. I need a comprehensive summary for planning inventory DTOs/mappers:

1. List all files in party/dto and party/mappers
2. For each DTO file, describe: naming conventions, base classes/decorators used, create vs update vs query DTOs, validation patterns, BigInt handling
3. For each mapper file, describe: structure, toEntity/toDto patterns, how relations are handled, exports
4. Note any shared utilities or constants used
5. Read 2-3 representative examples in full detail (one create DTO, one update DTO, one mapper)

Return file paths, key patterns, and code snippets that define the conventions.

---

**Cursor**

Exploring the party module DTOs and mappers to extract conventions for inventory planning.


# Party Module DTO & Mapper Conventions

Reference for planning inventory DTOs/mappers.

---

## 1. File inventory

### `backend/src/party/dto/` (16 files)

| File | Class |
|------|-------|
| `create-party.dto.ts` | `CreatePartyDto` |
| `update-party.dto.ts` | `UpdatePartyDto` |
| `create-customer.dto.ts` | `CreateCustomerDto` |
| `update-customer.dto.ts` | `UpdateCustomerDto` |
| `create-supplier.dto.ts` | `CreateSupplierDto` |
| `update-supplier.dto.ts` | `UpdateSupplierDto` |
| `create-doctor.dto.ts` | `CreateDoctorDto` |
| `update-doctor.dto.ts` | `UpdateDoctorDto` |
| `create-employee.dto.ts` | `CreateEmployeeDto` |
| `update-employee.dto.ts` | `UpdateEmployeeDto` |
| `create-party-contact.dto.ts` | `CreatePartyContactDto` |
| `update-party-contact.dto.ts` | `UpdatePartyContactDto` |
| `create-party-address.dto.ts` | `CreatePartyAddressDto` |
| `update-party-address.dto.ts` | `UpdatePartyAddressDto` |
| `create-party-role.dto.ts` | `CreatePartyRoleDto` |
| `update-party-role.dto.ts` | `UpdatePartyRoleDto` |

**No query DTOs** in this folder. List/delete use shared DTOs from `backend/src/common/dto/`.

### `backend/src/party/mappers/` (8 files)

| File | Exports |
|------|---------|
| `party.mapper.ts` | `PartyResponse`, `toPartyResponse` |
| `customer.mapper.ts` | `CustomerResponse`, `toCustomerResponse` |
| `supplier.mapper.ts` | `SupplierResponse`, `toSupplierResponse` |
| `doctor.mapper.ts` | `DoctorResponse`, `toDoctorResponse` |
| `employee.mapper.ts` | `EmployeeResponse`, `toEmployeeResponse` |
| `party-contact.mapper.ts` | `PartyContactResponse`, `toPartyContactResponse` |
| `party-address.mapper.ts` | `PartyAddressResponse`, `toPartyAddressResponse` |
| `party-role.mapper.ts` | `PartyRoleResponse`, `toPartyRoleResponse` |

---

## 2. DTO conventions (all files)

### Naming

- **Files:** `create-{entity}.dto.ts`, `update-{entity}.dto.ts` (kebab-case entity name).
- **Classes:** `Create{Entity}Dto`, `Update{Entity}Dto` (PascalCase).
- **No base classes** — each DTO is a standalone `export class`.

### Create vs update split

| Aspect | Create DTOs | Update DTOs |
|--------|-------------|-------------|
| Required business fields | `@IsNotEmpty()` on core fields | All business fields `@IsOptional()` |
| Optimistic locking | None | **Required** `version!: number` with `@IsInt() @Min(1)` |
| FK to parent (e.g. `partyId`) | In body for top-level entities (customer, supplier, doctor, employee) | Not in body — path param only |
| Child entities (contact, address, role) | No `partyId` in DTO — from route `@Param('partyId')` | Same |

### Validation patterns

- **Strings:** `@IsString()`, `@MaxLength(n)` aligned to schema.
- **Enums / constants:** `@IsIn(Object.values(X))` from `../constants/party.constants`.
- **Booleans:** `@IsBoolean()` with `@IsOptional()` where applicable.
- **Integers:** `@IsInt()`, `@Min(0)` or `@Min(1)` for version.
- **Decimals (money):** `@Type(() => Number)`, `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)`.
- **Conditional validation:** `CreatePartyContactDto` uses `@ValidateIf` + `@IsEmail()` when `contactType === ContactType.EMAIL`.
- **No** `@ValidateNested`, no nested item arrays in party DTOs.

### BigInt handling (two strategies)

**Strategy A — FK refs as digit strings (create only for `partyId`):**

```16:20:backend/src/party/dto/create-customer.dto.ts
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  partyId!: string;
```

Service converts: `const partyId = BigInt(dto.partyId)`.

**Strategy B — `OptionalBigIntField()` for optional BigInt columns (dates, geo IDs):**

```35:36:backend/src/party/dto/create-employee.dto.ts
  @OptionalBigIntField()
  joiningDate?: bigint;
```

Used in: `CreateEmployeeDto`, `UpdateEmployeeDto` (`joiningDate`, `leavingDate`), `CreatePartyAddressDto`, `UpdatePartyAddressDto` (`cityId`, `stateId`, `countryId`).

Decorator (`backend/src/common/dto/bigint.decorator.ts`): `@IsOptional()`, `@Transform` via `coerceToBigInt`, `@Validate(IsBigIntConstraint)`.

**MandatoryBigIntField** exists in common but is **not used** in party DTOs.

### Query / delete DTOs (shared, not in party/dto)

- **List:** `PaginationQueryDto` — optional `page`, `pageSize`, `search`.
- **Soft delete:** `DeleteEntityQueryDto` — required `version` (same optimistic-lock pattern as update body).

### Entity groupings

| Group | Create/update pairs | Notes |
|-------|---------------------|-------|
| Root party | party | No FK refs; `PartyType` enum |
| Role extensions | customer, supplier, doctor, employee | `partyId` string in create body |
| Party children | party-contact, party-address, party-role | No `partyId` in DTO; parent from path |

---

## 3. Mapper conventions (all files)

### Structure (uniform)

Each mapper file contains:

1. **`XResponse` interface** — API response shape (not a class).
2. **`toXResponse(entity: PrismaModel): XResponse`** — single exported mapper function.
3. **No `toEntity` / `fromDto`** — services map DTO → Prisma `data` inline.

### `toXResponse` patterns

| Field type | Response handling |
|------------|-------------------|
| Entity `id`, FK `partyId` | `entity.id.toString()` |
| `uuid`, strings, booleans | Direct copy |
| `Prisma.Decimal` | `serializeDecimal()` → `number \| null` |
| Nullable BigInt refs (`updatedBy`, `cityId`, etc.) | `serializeBigInt()` → `string \| null` |
| Timestamps (`createdAt`, `updatedAt`, `deletedAt`) | Left as `bigint` (global `serializeForJson` stringifies on wire) |
| `version` | `number` |

### Relations

- **No nested objects** — only FK strings (`partyId`, `cityId`, etc.).
- **No `include` handling** in mappers — always accept flat Prisma model.
- **No joined display names** (e.g. no `party.displayName` in customer response).

### Audit fields (inconsistent but intentional per entity)

| Mapper | `updatedBy` / `deletedBy` |
|--------|---------------------------|
| party, customer, supplier | Included |
| doctor, employee, party-contact, party-address, party-role | Omitted |

### Exports

- Named exports only: interface + function.
- No barrel `index.ts` in mappers folder.
- Services import directly: `import { toCustomerResponse } from '../mappers/customer.mapper'`.

---

## 4. Shared utilities & constants

### Party module

| Path | Role |
|------|------|
| `backend/src/party/constants/party.constants.ts` | `PartyType`, `PartyRoleType`, `AddressType`, `ContactType`, `CustomerType`, `SupplierType` (`as const` objects) |
| `backend/src/party/utils/party.util.ts` | `serializeBigInt`, `serializeDecimal`, `serializeDate`; service helpers (`assertPartyExists`, `optimisticUpdate`, `throwNotFound`, `throwConflict`, `ensurePartyRole`, `assertUniqueBusinessCode`, `assertNonNegativeDecimal`, `activePartyFilter`) |

### Common (used by party DTOs/controllers)

| Path | Role |
|------|------|
| `backend/src/common/dto/bigint.decorator.ts` | `OptionalBigIntField`, `MandatoryBigIntField` |
| `backend/src/common/dto/coerce-to-bigint.ts` | `coerceToBigInt` — digit strings, safe integers, range check |
| `backend/src/common/dto/pagination-query.dto.ts` | `PaginationQueryDto` |
| `backend/src/common/dto/delete-entity-query.dto.ts` | `DeleteEntityQueryDto` |
| `backend/src/common/pipes/parse-bigint.pipe.ts` | Route `@Param('id', ParseBigIntPipe)` |
| `backend/src/common/serialization/serialize-for-json.ts` | Recursive bigint/Decimal/Date serialization in response interceptor |

### Service layer (not mappers)

DTO → Prisma mapping lives in services, e.g. `customer.service.ts`:

- `BigInt(dto.partyId)` for FK strings.
- Decimals passed as numbers or `'0'` default strings to Prisma.
- `dto.version` used in `updateMany({ where: { id, version: dto.version } })`.
- `optimisticUpdate()` on zero row count.

---

## 5. Representative examples (full detail)

### Example A — Create DTO: `CreateCustomerDto`

**Path:** `e:\workspace\pharmacy-erp-desktop\backend\src\party\dto\create-customer.dto.ts`

```1:56:backend/src/party/dto/create-customer.dto.ts
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { CustomerType } from '../constants/party.constants';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/)
  partyId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customerCode!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(CustomerType))
  customerType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  outstandingAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsBoolean()
  isTaxExempt?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**Takeaways for inventory:** FK as validated digit string; enum from constants; money fields with `Type(() => Number)` + decimal places; optional flags with defaults applied in service.

---

### Example B — Update DTO: `UpdateCustomerDto`

**Path:** `e:\workspace\pharmacy-erp-desktop\backend\src\party\dto\update-customer.dto.ts`

```14:53:backend/src/party/dto/update-customer.dto.ts
export class UpdateCustomerDto {
  @IsInt()
  @Min(1)
  version!: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(CustomerType))
  customerType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  outstandingAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsBoolean()
  isTaxExempt?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**Takeaways:** `version` is the only required field; no FK updates; same validators as create but all optional except version; delete uses separate `DeleteEntityQueryDto` with same version rule.

---

### Example C — Mapper: `customer.mapper.ts`

**Path:** `e:\workspace\pharmacy-erp-desktop\backend\src\party\mappers\customer.mapper.ts`

```1:44:backend/src/party/mappers/customer.mapper.ts
import { Customer } from '@prisma/client';
import { serializeBigInt, serializeDecimal } from '../utils/party.util';

export interface CustomerResponse {
  id: string;
  partyId: string;
  uuid: string;
  customerCode: string;
  customerType: string;
  creditLimit: number | null;
  outstandingAmount: number | null;
  paymentTermsDays: number;
  loyaltyPoints: number;
  isTaxExempt: boolean;
  isActive: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  deletedAt: bigint | null;
  updatedBy: string | null;
  deletedBy: string | null;
  version: number;
}

export function toCustomerResponse(customer: Customer): CustomerResponse {
  return {
    id: customer.id.toString(),
    partyId: customer.partyId.toString(),
    uuid: customer.uuid,
    customerCode: customer.customerCode,
    customerType: customer.customerType,
    creditLimit: serializeDecimal(customer.creditLimit),
    outstandingAmount: serializeDecimal(customer.outstandingAmount),
    paymentTermsDays: customer.paymentTermsDays,
    loyaltyPoints: customer.loyaltyPoints,
    isTaxExempt: customer.isTaxExempt,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    deletedAt: customer.deletedAt,
    updatedBy: serializeBigInt(customer.updatedBy),
    deletedBy: serializeBigInt(customer.deletedBy),
    version: customer.version,
  };
}
```

**Takeaways:** One-way `entity → response`; IDs as strings; decimals as JS numbers; audit BigInts as strings; timestamps as bigint until JSON layer; fields not in create DTO (e.g. `loyaltyPoints`) still exposed; no relation expansion.

---

## Planning checklist for inventory DTOs/mappers

1. **File pairs:** `create-{entity}.dto.ts` + `update-{entity}.dto.ts` per aggregate/child entity.
2. **Query DTOs:** Reuse `PaginationQueryDto` / `DeleteEntityQueryDto`; add inventory-specific query DTOs only if filters exceed `search`.
3. **Update/delete:** Always require `version` (`@IsInt() @Min(1)`).
4. **BigInt FKs in body:** `@Matches(/^\d+$/)` string + `BigInt()` in service, **or** `OptionalBigIntField` / `MandatoryBigIntField` for direct bigint columns.
5. **Enums:** `inventory.constants.ts` + `@IsIn(Object.values(...))`.
6. **Quantities/decimals:** `@Type(() => Number)` + `@IsNumber` with appropriate `maxDecimalPlaces`.
7. **Nested items (adjustments, transfers):** Party has no precedent — inventory may need `@ValidateNested` + `@Type(() => ItemDto)` (new pattern).
8. **Mappers:** `{Entity}Response` + `to{Entity}Response`; no `toEntity`; map DTO in service.
9. **Utils:** Consider `inventory.util.ts` mirroring `serializeBigInt`/`serializeDecimal` usage (can reuse `party.util` helpers or move shared serializers to `common`).
10. **Route params:** `ParseBigIntPipe` for `id`, parent FKs in nested routes.

