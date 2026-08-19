# Supplier

## Purpose

The Supplier table stores supplier-specific business information that is not common to all Parties.

General information such as supplier name, address, phone numbers, and email addresses are maintained in the Party, PartyAddress, and PartyContact tables.

This table stores procurement and financial information required for purchasing medicines and other inventory.

---

## Business Rules

- Every Supplier must reference exactly one Party.
- A Party can have at most one Supplier record.
- The Party must have the SUPPLIER role assigned in PartyRole.
- Supplier Code must be unique.
- GSTIN must be unique when provided.
- Drug License Number should be maintained for pharmaceutical suppliers.
- Credit limit cannot be negative.
- Outstanding amount is maintained through Ledger entries.
- Suppliers can be marked inactive instead of deleting them.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    ├── PartyRole (SUPPLIER)
    │
    └────── Supplier (1)
                 │
                 ├── PurchaseOrder
                 ├── GoodsReceipt
                 ├── PurchaseInvoice
                 ├── PurchaseReturn
                 └── Payment
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Foreign Key | partyId | INTEGER | BIGINT | No | References Party.id |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | supplierCode | TEXT | VARCHAR(30) | No | Unique supplier code |
| Business | supplierType | TEXT | VARCHAR(30) | No | MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER |
| Business | gstin | TEXT | VARCHAR(20) | Yes | GST Identification Number |
| Business | drugLicenseNumber | TEXT | VARCHAR(50) | Yes | Drug License Number |
| Business | panNumber | TEXT | VARCHAR(20) | Yes | PAN Number |
| Financial | creditLimit | REAL | NUMERIC(12,2) | No | Maximum credit allowed |
| Financial | outstandingAmount | REAL | NUMERIC(12,2) | No | Current outstanding payable |
| Financial | paymentTermsDays | INTEGER | INTEGER | No | Credit period in days |
| Status | preferredSupplier | INTEGER | BOOLEAN | No | Preferred supplier flag |
| Status | isActive | INTEGER | BOOLEAN | No | Active supplier |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId)
- Unique (supplierCode)
- Unique (gstin)
- `supplierType` uses the `SupplierType` enum: MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER.
- `creditLimit` should not be negative; enforce this in the application layer.
- `outstandingAmount` should not be negative; enforce this in the application layer.

---

## Indexes

- PK_Supplier (id)
- UK_Supplier_UUID
- UK_Supplier_Code
- UK_Supplier_Party
- UK_Supplier_GSTIN
- IDX_Supplier_Type
- IDX_Supplier_Active
- IDX_Supplier_Preferred

---

## Sample Records

| id | partyId | supplierCode | supplierType | gstin | drugLicenseNumber | preferredSupplier |
|----|---------|--------------|--------------|-------|-------------------|-------------------|
| 1 | 20 | SUP00001 | DISTRIBUTOR | 27ABCDE1234F1Z5 | MH/DRUG/12345 | Yes |
| 2 | 25 | SUP00002 | MANUFACTURER | 27PQRSX5678L1Z2 | MH/DRUG/45678 | No |
| 3 | 31 | SUP00003 | WHOLESALER | NULL | MH/DRUG/98765 | No |

---

## Prisma Model

```prisma
// supplierType stored as String (no Prisma enums on SQLite).
// Allowed values: MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER
model Supplier {
  id                  BigInt   @id @default(autoincrement())
  partyId             BigInt   @unique @map("party_id")

  uuid                String   @unique @default(uuid())

  supplierCode        String   @unique @map("supplier_code")
  supplierType        String   @map("supplier_type") // MANUFACTURER, DISTRIBUTOR, WHOLESALER, OTHER

  gstin               String?  @unique
  drugLicenseNumber   String? @map("drug_license_number")
  panNumber           String? @map("pan_number")

  creditLimit         Decimal  @default(0) @map("credit_limit")
  outstandingAmount   Decimal  @default(0) @map("outstanding_amount")

  paymentTermsDays    Int      @default(0) @map("payment_terms_days")

  preferredSupplier   Boolean  @default(false) @map("preferred_supplier")
  isActive            Boolean  @default(true) @map("is_active")

  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  version             Int      @default(1)

  party               Party    @relation(fields: [partyId], references: [id])

  @@index([supplierType])
  @@index([preferredSupplier])
  @@index([isActive])
}
```

---

## Notes

- Stores only supplier-specific information.
- General information belongs in Party, PartyAddress, and PartyContact.
- A supplier must have the SUPPLIER role in PartyRole.
- Procurement modules should reference Supplier instead of Party directly.
- Outstanding payable should preferably be calculated from LedgerEntry transactions.
- Drug License Number and GSTIN are important for statutory compliance in pharmacy operations.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.

