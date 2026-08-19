# LoyaltyTransaction

## Purpose

The LoyaltyTransaction table records every loyalty point transaction for customers.

It acts as the ledger of the loyalty system, storing all point movements including:

- Points Earned
- Points Redeemed
- Manual Adjustments
- Promotional Bonus Points
- Expired Points
- Reversed Transactions

The customer's current loyalty balance is derived from these transactions rather than being stored directly.

---

## Business Rules

- Every Loyalty Transaction belongs to one Loyalty Program.
- Every Loyalty Transaction belongs to one Customer.
- A transaction may reference one Sales Invoice.
- Earn transactions increase customer points.
- Redeem and Expiry transactions decrease customer points.
- Negative balances are not permitted unless explicitly configured.
- Posted transactions cannot be modified.
- Reversals create opposite transactions instead of updates.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Customer
     │
     ▼
LoyaltyTransaction
     ▲
     │
LoyaltyProgram
     │
     └────────► SalesInvoice
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Foreign Key | loyaltyProgramId | INTEGER | BIGINT | No | References LoyaltyProgram.id |
| Foreign Key | customerId | INTEGER | BIGINT | No | References Customer.id |
| Foreign Key | salesInvoiceId | INTEGER | BIGINT | Yes | References SalesInvoice.id |
| Business | transactionNumber | TEXT | VARCHAR(30) | No | Unique transaction number |
| Business | transactionType | TEXT | VARCHAR(20) | No | EARN, REDEEM, ADJUSTMENT, BONUS, EXPIRY, REVERSAL |
| Business | transactionDate | DATETIME | TIMESTAMP | No | Transaction date |
| Financial | points | INTEGER | INTEGER | No | Points earned or deducted |
| Financial | monetaryValue | REAL | NUMERIC(12,2) | Yes | Monetary equivalent |
| Financial | balanceAfterTransaction | INTEGER | INTEGER | Yes | Running balance after transaction |
| Business | remarks | TEXT | TEXT | Yes | Remarks |
| Status | isPosted | INTEGER | BOOLEAN | No | Posted flag |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (transactionNumber)
- Foreign Key (loyaltyProgramId → LoyaltyProgram.id)
- Foreign Key (customerId → Customer.id)
- Foreign Key (salesInvoiceId → SalesInvoice.id)
- CHECK (transactionType IN ('EARN','REDEEM','ADJUSTMENT','BONUS','EXPIRY','REVERSAL'))
- CHECK (points <> 0)
- CHECK (version >= 1)

---

## Indexes

- PK_LoyaltyTransaction
- UK_LoyaltyTransaction_UUID
- UK_LoyaltyTransaction_Number
- IDX_LoyaltyTransaction_Customer
- IDX_LoyaltyTransaction_Program
- IDX_LoyaltyTransaction_Invoice
- IDX_LoyaltyTransaction_Date
- IDX_LoyaltyTransaction_Type

---

## Sample Records

| id | customerId | transactionType | points | balanceAfterTransaction |
|----|-----------:|----------------|-------:|------------------------:|
| 1 | 101 | EARN | 25 | 125 |
| 2 | 101 | REDEEM | -50 | 75 |
| 3 | 205 | BONUS | 100 | 100 |

---

## Prisma Model

```prisma
model LoyaltyTransaction {
  id                       BigInt   @id @default(autoincrement())

  uuid                     String   @unique 

  loyaltyProgramId         BigInt
  customerId               BigInt
  salesInvoiceId           BigInt?

  transactionNumber        String   @unique

  transactionType          String

  transactionDate          DateTime

  points                   Int

  monetaryValue            Decimal? 

  balanceAfterTransaction  Int?

  remarks                  String?

  isPosted                 Boolean  @default(true)

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  deletedAt                DateTime?

  version                  Int      @default(1)

  loyaltyProgram           LoyaltyProgram @relation(fields: [loyaltyProgramId], references: [id])
  customer                 Customer       @relation(fields: [customerId], references: [id])
  salesInvoice             SalesInvoice?  @relation(fields: [salesInvoiceId], references: [id])

  @@index([customerId])
  @@index([loyaltyProgramId])
  @@index([salesInvoiceId])
  @@index([transactionDate])
  @@index([transactionType])
}
```

---

## Notes

- This table is the **transaction ledger** for the loyalty system.
- Every points movement should be recorded as a separate transaction.
- Customer loyalty balance should be calculated from transactions rather than maintained directly.
- Reversals should create new transactions instead of modifying historical records.
- Loyalty transactions should be generated automatically during Sales Invoice posting and point redemption.
- Supports manual adjustments by authorized users with proper audit logging.
- Historical loyalty transactions should never be deleted.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
