# Overall Architecture

> Source: Original Architecture Handbook

```
                 Cloud

         Spring Boot API
                │
          PostgreSQL
                ▲
                │
        Delta Synchronization
                │

────────────────────────────────

         Local Machine

        Electron Desktop
               │
        Angular Frontend
               │
        IPC (Context Bridge)
               │
         NestJS Backend
               │
            Prisma ORM
               │
            SQLite DB

```

---
