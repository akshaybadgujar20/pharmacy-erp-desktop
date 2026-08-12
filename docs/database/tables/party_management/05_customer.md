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
| Business    | customerType      | TEXT     | VARCHAR(30)   | No       | WALK_IN, REGULAR, WHOLESALE, CORPORATE |
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
- CHECK customerType IN ('WALK_IN','REGULAR','WHOLESALE','CORPORATE')
- CHECK creditLimit >= 0
- CHECK outstandingAmount >= 0
- CHECK loyaltyPoints >= 0

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
| 1  | 1       | CUST00001    | WALK_IN      |        0.00 |              0.00 |             0 |
| 2  | 5       | CUST00002    | REGULAR      |    10000.00 |           2500.00 |           150 |
| 3  | 8       | CUST00003    | CORPORATE    |    50000.00 |          12000.00 |             0 |

---

## Prisma Model

```prisma
model Customer {
  id                 BigInt    @id @default(autoincrement())
  partyId            BigInt     @unique

  uuid               String     @unique

  customerCode       String     @unique
  customerType       String

  creditLimit        Decimal    @default(0)
  outstandingAmount  Decimal    @default(0)

  paymentTermsDays   Int        @default(0)

  loyaltyPoints      Int        @default(0)

  isTaxExempt        Boolean    @default(false)
  isActive           Boolean    @default(true)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  deletedAt          DateTime?

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
