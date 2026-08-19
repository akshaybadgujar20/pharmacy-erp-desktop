# PartyContact

## Purpose

The PartyContact table stores one or more contact details associated with a Party.

A Party can have multiple contact methods such as:

- Mobile Number
- Landline Number
- Email Address
- WhatsApp Number
- Fax Number
- Other contact details

Separating contact information from the Party table keeps the database normalized and allows unlimited contact methods for each Party.

---

## Business Rules

- Every contact must belong to exactly one Party.
- A Party can have multiple contact records.
- Only one contact of a specific type should be marked as primary; this is an application-level rule.
- Contact type is restricted to the `ContactType` enum: PHONE, MOBILE, EMAIL, FAX, WHATSAPP, or OTHER.
- Email addresses should be stored in lowercase.
- Mobile numbers should include the country code where applicable.
- Soft delete should be used.
- UUID is used for synchronization.
- BIGINT is used as the internal primary key.
- Optimistic locking is maintained using the version column.

---

## Relationships

```
Party (1)
    │
    └──────< PartyContact (Many)
```

---

## Columns

| Category    | Column       | SQLite   | PostgreSQL   | Nullable | Description                                     |
|-------------|--------------|----------|--------------|----------|-------------------------------------------------|
| Primary Key | id           | INTEGER  | BIGINT       | No       | Auto increment primary key                      |
| Foreign Key | partyId      | INTEGER  | BIGINT       | No       | References Party.id                             |
| Identifier  | uuid         | TEXT     | UUID         | No       | Global unique identifier                        |
| Basic       | contactType  | TEXT     | VARCHAR(30)  | No       | PHONE, MOBILE, EMAIL, FAX, WHATSAPP, OTHER    |
| Contact     | contactValue | TEXT     | VARCHAR(250) | No       | Contact value                                   |
| Contact     | countryCode  | TEXT     | VARCHAR(10)  | Yes      | Country dialing code                            |
| Status      | isPrimary    | INTEGER  | BOOLEAN      | No       | Primary contact of this type                    |
| Status      | isVerified   | INTEGER  | BOOLEAN      | No       | Indicates whether the contact has been verified |
| Status      | isActive     | INTEGER  | BOOLEAN      | No       | Active status                                   |
| Audit       | createdAt    | DATETIME | TIMESTAMP    | No       | Record creation timestamp                       |
| Audit       | updatedAt    | DATETIME | TIMESTAMP    | No       | Last update timestamp                           |
| Audit       | deletedAt    | DATETIME | TIMESTAMP    | Yes      | Soft delete timestamp                           |
| Audit       | version      | INTEGER  | INTEGER      | No       | Optimistic locking version                      |

---

## Constraints

- Primary Key (id)
- Foreign Key (partyId → Party.id)
- Unique (uuid)
- Unique (partyId, contactType, contactValue)
- `contactType` uses the `ContactType` enum: PHONE, MOBILE, EMAIL, FAX, WHATSAPP, OTHER.
- version >= 1

---

## Indexes

- PK_PartyContact (id)
- UK_PartyContact_UUID (uuid)
- UK_PartyContact_Party_Type_Value (partyId, contactType, contactValue)
- IDX_PartyContact_Party
- IDX_PartyContact_Type
- IDX_PartyContact_Primary
- IDX_PartyContact_Active

---

## Sample Records

| id | partyId | contactType | contactValue | countryCode | isPrimary | isVerified |
|----|---------|-------------|--------------|-------------|-----------|------------|
| 1 | 1 | MOBILE | 9876543210 | +91 | Yes | Yes |
| 2 | 1 | EMAIL | john.doe@email.com | NULL | Yes | Yes |
| 3 | 2 | PHONE | 02012345678 | +91 | Yes | No |
| 4 | 2 | OTHER | https://abcpharma.com | NULL | Yes | No |

---

## Prisma Model

```prisma
// contactType stored as String (no Prisma enums on SQLite).
// Allowed values: PHONE, MOBILE, EMAIL, FAX, WHATSAPP, OTHER
model PartyContact {
  id            BigInt   @id @default(autoincrement())
  partyId       BigInt   @map("party_id")

  uuid          String   @unique @default(uuid())

  contactType   String   @map("contact_type") // PHONE, MOBILE, EMAIL, FAX, WHATSAPP, OTHER
  contactValue  String   @map("contact_value")
  countryCode   String?  @map("country_code")

  isPrimary     Boolean  @default(false) @map("is_primary")
  isVerified    Boolean  @default(false) @map("is_verified")
  isActive      Boolean  @default(true) @map("is_active")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  version       Int      @default(1)

  party         Party    @relation(fields: [partyId], references: [id])

  @@unique([partyId, contactType, contactValue])

  @@index([partyId])
  @@index([contactType])
  @@index([isPrimary])
  @@index([isActive])
}
```

---

## Notes

- Stores all contact methods for every Party in the ERP.
- Supports multiple phone numbers, email addresses, and other contact details for a single Party.
- Business modules should retrieve the primary contact where available.
- Verification status can be used for OTP/email verification workflows.
- Supports offline-first synchronization using UUID.
- Compatible with both SQLite and PostgreSQL.

