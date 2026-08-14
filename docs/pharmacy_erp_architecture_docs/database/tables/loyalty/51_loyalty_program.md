# LoyaltyProgram

## Purpose

The LoyaltyProgram table defines customer loyalty schemes offered by the pharmacy.

A Loyalty Program specifies how customers earn and redeem loyalty points based on purchases. Multiple programs may exist simultaneously for different customer groups or promotional campaigns.

Examples include:

- Standard Customer Rewards
- Premium Membership
- Senior Citizen Rewards
- Corporate Employee Program
- Festival Bonus Program

Customer point transactions are recorded separately in the **LoyaltyTransaction** table.

---

## Business Rules

- Every Loyalty Program has a unique program code.
- Only active programs can earn or redeem points.
- A program has an effective start date and optional expiry date.
- Only one default loyalty program may exist.
- Redemption rules must not exceed available customer points.
- Historical programs should never be modified after becoming effective.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
LoyaltyProgram
        │
        └────────< LoyaltyTransaction
                         │
                         ▼
                      Customer
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | programCode | TEXT | VARCHAR(20) | No | Unique loyalty program code |
| Business | programName | TEXT | VARCHAR(100) | No | Loyalty program name |
| Business | description | TEXT | TEXT | Yes | Program description |
| Business | pointsPerAmount | REAL | NUMERIC(10,2) | No | Points earned per currency amount |
| Business | redemptionValue | REAL | NUMERIC(10,2) | No | Currency value of one point |
| Business | minimumRedemptionPoints | INTEGER | INTEGER | No | Minimum points required for redemption |
| Business | maximumRedemptionPoints | INTEGER | INTEGER | Yes | Maximum points redeemable per invoice |
| Business | effectiveFrom | DATE | DATE | No | Program start date |
| Business | effectiveTo | DATE | DATE | Yes | Program expiry date |
| Status | isDefault | INTEGER | BOOLEAN | No | Default loyalty program |
| Status | isActive | INTEGER | BOOLEAN | No | Active status |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (programCode)
- Unique (programName)
- CHECK (pointsPerAmount > 0)
- CHECK (redemptionValue >= 0)
- CHECK (minimumRedemptionPoints >= 0)
- CHECK (maximumRedemptionPoints IS NULL OR maximumRedemptionPoints >= minimumRedemptionPoints)
- CHECK (effectiveTo IS NULL OR effectiveTo >= effectiveFrom)
- CHECK (version >= 1)

---

## Indexes

- PK_LoyaltyProgram
- UK_LoyaltyProgram_UUID
- UK_LoyaltyProgram_Code
- UK_LoyaltyProgram_Name
- IDX_LoyaltyProgram_Active
- IDX_LoyaltyProgram_Default
- IDX_LoyaltyProgram_Effective

---

## Sample Records

| id | programCode | programName | pointsPerAmount | redemptionValue | isDefault |
|----|-------------|-------------|----------------:|----------------:|----------|
| 1 | STD | Standard Rewards | 1.00 | 0.25 | Yes |
| 2 | GOLD | Gold Membership | 2.00 | 0.30 | No |
| 3 | SENIOR | Senior Citizen Rewards | 1.50 | 0.30 | No |

---

## Prisma Model

```prisma
model LoyaltyProgram {
  id                          BigInt   @id @default(autoincrement())

  uuid                        String   @unique @db.Uuid

  programCode                 String   @unique
  programName                 String   @unique

  description                 String?

  pointsPerAmount             Decimal  @db.Decimal(10,2)
  redemptionValue             Decimal  @db.Decimal(10,2)

  minimumRedemptionPoints     Int
  maximumRedemptionPoints     Int?

  effectiveFrom               DateTime
  effectiveTo                 DateTime?

  isDefault                   Boolean  @default(false)
  isActive                    Boolean  @default(true)

  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
  deletedAt                   DateTime?

  version                     Int      @default(1)

  transactions                LoyaltyTransaction[]

  @@index([isActive])
  @@index([isDefault])
  @@index([effectiveFrom, effectiveTo])
}
```

---

## Notes

- This is the **master table** for customer loyalty schemes.
- Individual earning and redemption events are stored in **LoyaltyTransaction**.
- Customers should normally be enrolled in the default active program unless another program is explicitly assigned.
- The pricing engine should evaluate the active loyalty program during Sales Invoice posting to calculate earned or redeemed points.
- Historical loyalty programs should not be modified once transactions exist; create a new program for revised rules.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
