# Customer

## Purpose

The Customer table stores customer-specific information that is not common to all Parties.

General information such as name, address, and contact details is maintained in the Party, PartyAddress, and PartyContact tables. This table contains only attributes specific to customers.

---

## Business Rules

- Every Customer must reference exactly one Party.
- A Party can have at most one Customer record.
- The Party must have the CUSTOMER role assigned in PartyRole.
- Customer Code must be unique within a company.
- Credit limit cannot be negative.
- Current outstanding balance is maintained through Ledger entries and should not be updated directly.
- Customers can be marked inactive instead of being deleted.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    ├── PartyRole (CUSTOMER)
    │
    └────── Customer (1)
                │
                ├── SalesInvoice
                ├── SalesReturn
                ├── SalesPayment
                ├── Prescription
                └── LoyaltyTransaction
```

---

## Columns

| Category    | Column            | SQLite   | PostgreSQL    | Nullable | Description                            |
|-------------|-------------------|----------|---------------|----------|----------------------------------------|
| Primary Key | id                | INTEGER  | BIGINT        | No       | Auto increment primary key             |
| Foreign Key | partyId           | INTEGER  | BIGINT        | No       | References Party.id                    |
| Identifier  | uuid              | TEXT     | UUID          | No       | Global unique identifier               |
| Business    | customerCode      | TEXT     | VARCHAR(30)   | No       | Unique customer code                   |
| Business    | customerType      | TEXT     | VARCHAR(30)   | No       | RETAIL, WHOLESALE, CORPORATE |
| Financial   | creditLimit       | REAL     | NUMERIC(12,2) | No       | Maximum credit allowed                 |
| Financial   | outstandingAmount | REAL     | NUMERIC(12,2) | No       | Current outstanding balance            |
| Financial   | paymentTermsDays  | INTEGER  | INTEGER       | No       | Credit period in days                  |
| Loyalty     | loyaltyPoints     | INTEGER  | INTEGER       | No       | Available loyalty points               |
| Status      | isTaxExempt       | INTEGER  | BOOLEAN       | No       | Tax exemption flag                     |
| Status      | isActive          | INTEGER  | BOOLEAN       | No       | Active status                          |
| Audit       | createdAt         | DATETIME | TIMESTAMP     | No       | Record creation timestamp              |
| Audit       | updatedAt         | DATETIME | TIMESTAMP     | No       | Last update timestamp                  |
| Audit       | deletedAt         | DATETIME | TIMESTAMP     | Yes      | Soft delete timestamp                  |
| Audit       | version           | INTEGER  | INTEGER       | No       | Optimistic locking version             |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId)
- Unique (customerCode)
- `customerType` uses the `CustomerType` enum: RETAIL, WHOLESALE, CORPORATE.
- `creditLimit` should not be negative; enforce this in the application layer.
- `outstandingAmount` should not be negative; enforce this in the application layer.
- `loyaltyPoints` should not be negative; enforce this in the application layer.

---

## Indexes

- PK_Customer (id)
- UK_Customer_UUID
- UK_Customer_Code
- UK_Customer_Party
- IDX_Customer_Type
- IDX_Customer_Active
- IDX_Customer_Outstanding

---

## Sample Records

| id | partyId | customerCode | customerType | creditLimit | outstandingAmount | loyaltyPoints |
|----|---------|--------------|--------------|------------:|------------------:|--------------:|
| 1  | 1       | CUST00001    | RETAIL      |        0.00 |              0.00 |             0 |
| 2  | 5       | CUST00002    | RETAIL      |    10000.00 |           2500.00 |           150 |
| 3  | 8       | CUST00003    | CORPORATE    |    50000.00 |          12000.00 |             0 |

---

## Prisma Model

```prisma
enum CustomerType {
  RETAIL
  WHOLESALE
  CORPORATE
}
```


```prisma
model Customer {
  id                 BigInt    @id @default(autoincrement())
  partyId            BigInt     @unique @map("party_id")

  uuid               String     @unique

  customerCode       String     @unique @map("customer_code")
  customerType       CustomerType @map("customer_type")

  creditLimit        Decimal    @default(0) @map("credit_limit")
  outstandingAmount  Decimal    @default(0) @map("outstanding_amount")

  paymentTermsDays   Int        @default(0) @map("payment_terms_days")

  loyaltyPoints      Int        @default(0) @map("loyalty_points")

  isTaxExempt        Boolean    @default(false) @map("is_tax_exempt")
  isActive           Boolean    @default(true) @map("is_active")

  createdAt          DateTime   @default(now()) @map("created_at")
  updatedAt          DateTime   @updatedAt @map("updated_at")
  deletedAt          DateTime? @map("deleted_at")

  version            Int        @default(1)

  party              Party      @relation(fields: [partyId], references: [id])

  @@index([customerType])
  @@index([isActive])
  @@index([outstandingAmount])
}
```

---

## Notes

- Customer-specific information only should be stored here.
- Personal information belongs in Party.
- Addresses belong in PartyAddress.
- Contact details belong in PartyContact.
- Customer must have the CUSTOMER role in PartyRole.
- Outstanding amount should preferably be calculated from LedgerEntry rather than manually updated.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.

