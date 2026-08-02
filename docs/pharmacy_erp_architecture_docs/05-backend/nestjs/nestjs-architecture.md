# NestJS Architecture

> Source: Original Architecture Handbook

Structure

```
Controller

↓

DTO

↓

Validation

↓

Service

↓

Prisma

↓

SQLite

```

Keep:

- Controllers thin
- Services rich
- DTOs validated
- Business rules in services

---
