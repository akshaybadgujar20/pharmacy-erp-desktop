# DiscountRule

## Purpose

The DiscountRule table defines configurable discount policies used during billing.

It enables the ERP to automatically determine applicable discounts based on customer type, medicine, category, price list, quantity, promotional campaigns, and validity periods.

Typical discount rules include:

- Retail Customer Discount
- Wholesale Discount
- Senior Citizen Discount
- Doctor Discount
- Employee Discount
- Festival Offer
- Buy X Get Y
- Quantity Discount

The billing engine evaluates these rules during Sales Invoice creation.

---

## Business Rules

- Every Discount Rule has a unique code.
- Multiple Discount Rules may exist simultaneously.
- Rules are evaluated based on priority.
- Only active rules are considered during billing.
- Discount percentage cannot exceed the configured maximum.
- Effective dates determine rule validity.
- Rules can be limited to Medicines, Categories, Customers, or Price Lists.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Medicine
     │
Category
     │
Customer
     │
PriceList
     │
     ▼
DiscountRule
     │
     ▼
SalesInvoiceItem
```

---

## Columns

| Category | Column | SQLite | PostgreSQL | Nullable | Description |
|----------|--------|---------|------------|----------|-------------|
| Primary Key | id | INTEGER | BIGINT | No | Auto increment primary key |
| Identifier | uuid | TEXT | UUID | No | Global unique identifier |
| Business | ruleCode | TEXT | VARCHAR(30) | No | Unique discount rule code |
| Business | ruleName | TEXT | VARCHAR(150) | No | Discount rule name |
| Business | discountType | TEXT | VARCHAR(20) | No | PERCENTAGE, AMOUNT |
| Business | discountValue | REAL | NUMERIC(12,2) | No | Percentage or fixed amount |
| Business | appliesTo | TEXT | VARCHAR(30) | No | MEDICINE, CATEGORY, CUSTOMER, PRICE_LIST, INVOICE |
| Foreign Key | medicineId | INTEGER | BIGINT | Yes | Applicable medicine |
| Foreign Key | categoryId | INTEGER | BIGINT | Yes | Applicable category |
| Foreign Key | customerId | INTEGER | BIGINT | Yes | Applicable customer |
| Foreign Key | priceListId | INTEGER | BIGINT | Yes | Applicable price list |
| Business | minimumQuantity | REAL | NUMERIC(14,3) | Yes | Minimum quantity required |
| Financial | minimumAmount | REAL | NUMERIC(14,2) | Yes | Minimum invoice amount |
| Business | priority | INTEGER | INTEGER | No | Rule evaluation priority |
| Business | effectiveFrom | DATE | DATE | No | Effective start date |
| Business | effectiveTo | DATE | DATE | Yes | Effective end date |
| Status | isActive | INTEGER | BOOLEAN | No | Active rule |
| Business | remarks | TEXT | TEXT | Yes | Rule description |
| Audit | createdAt | DATETIME | TIMESTAMP | No | Record creation timestamp |
| Audit | updatedAt | DATETIME | TIMESTAMP | No | Last update timestamp |
| Audit | deletedAt | DATETIME | TIMESTAMP | Yes | Soft delete timestamp |
| Audit | version | INTEGER | INTEGER | No | Optimistic locking version |

---

## Constraints

- Primary Key (id)
- Unique (uuid)
- Unique (ruleCode)
- Foreign Key (medicineId → Medicine.id)
- Foreign Key (categoryId → MedicineCategory.id)
- Foreign Key (customerId → Customer.id)
- Foreign Key (priceListId → PriceList.id)
- CHECK (discountType IN ('PERCENTAGE','AMOUNT'))
- CHECK (discountValue >= 0)
- CHECK (priority >= 1)
- CHECK (effectiveTo IS NULL OR effectiveTo >= effectiveFrom)
- CHECK (version >= 1)

---

## Indexes

- PK_DiscountRule
- UK_DiscountRule_UUID
- UK_DiscountRule_Code
- IDX_DiscountRule_Priority
- IDX_DiscountRule_Active
- IDX_DiscountRule_Effective
- IDX_DiscountRule_Medicine
- IDX_DiscountRule_Category
- IDX_DiscountRule_Customer

---

## Sample Records

| id | ruleCode | ruleName | discountType | discountValue | appliesTo | priority |
|----|----------|----------|--------------|--------------:|-----------|---------:|
| 1 | DISC001 | Retail Festival Offer | PERCENTAGE | 10.00 | INVOICE | 1 |
| 2 | DISC002 | Wholesale Discount | PERCENTAGE | 5.00 | PRICE_LIST | 2 |
| 3 | DISC003 | Senior Citizen | AMOUNT | 100.00 | CUSTOMER | 3 |

---

## Prisma Model

```prisma
model DiscountRule {
  id                BigInt   @id @default(autoincrement())

  uuid              String   @unique 

  ruleCode          String   @unique
  ruleName          String

  discountType      String
  discountValue     Decimal  

  appliesTo         String

  medicineId        BigInt?
  categoryId        BigInt?
  customerId        BigInt?
  priceListId       BigInt?

  minimumQuantity   Decimal? 
  minimumAmount     Decimal? 

  priority          Int

  effectiveFrom     DateTime
  effectiveTo       DateTime?

  isActive          Boolean  @default(true)

  remarks           String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  version           Int      @default(1)

  medicine          Medicine?         @relation(fields: [medicineId], references: [id])
  category          MedicineCategory? @relation(fields: [categoryId], references: [id])
  customer          Customer?         @relation(fields: [customerId], references: [id])
  priceList         PriceList?        @relation(fields: [priceListId], references: [id])

  @@index([priority])
  @@index([isActive])
  @@index([effectiveFrom, effectiveTo])
  @@index([medicineId])
  @@index([categoryId])
  @@index([customerId])
  @@index([priceListId])
}
```

---

## Notes

- This table stores only **discount rules**, not applied discounts.
- During billing, the pricing engine evaluates active rules based on:
  - Effective date
  - Priority
  - Customer
  - Medicine
  - Category
  - Quantity
  - Invoice amount
- The calculated discount amount should be stored in `SalesInvoiceItem` or `SalesInvoice`, ensuring historical invoices remain unchanged even if discount rules are later modified.
- Historical Discount Rules should not be edited once they have been used in transactions. Instead, create a new rule with a new effective period.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.
