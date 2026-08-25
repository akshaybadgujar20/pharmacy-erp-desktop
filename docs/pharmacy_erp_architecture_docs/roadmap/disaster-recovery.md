# Disaster Recovery

## Threat model (desktop ERP)

| Risk | Mitigation |
|------|------------|
| Database corruption | SQLite file backup; restore from latest good copy |
| Disk failure | Scheduled backups to external drive / network folder |
| Power failure during write | SQLite ACID + single `UnitOfWork` transactions |
| Accidental deletion | Soft delete (`deletedAt`); audit trail |
| Failed sync | Outbox retries; `SyncLog` / `SyncConflict` for diagnosis |
| Lost device | Encrypted token storage; re-login; restore DB from backup |

## Implemented

- **Transactional integrity** — business + audit + outbox in one SQLite transaction
- **Soft delete** on masters and documents — recoverable unless purged
- **AuditLog** + rotating Winston logs (`LOG_DIR`, 14-day retention)
- **Outbox** — changes queued for replay after crash before sync completes

## Planned

| Item | Status |
|------|--------|
| `BackupConfiguration` table | Not in schema yet (mentioned in table_catalog as recommended) |
| Automated scheduled SQLite backup | Documented in engineering standards; app scheduler not implemented |
| Cloud backup upload | Future |
| Point-in-time recovery | SQLite snapshot strategy to be defined |
| DR runbook + quarterly restore test | Operational procedure |

## Recovery procedure (target)

1. Stop NestJS / Electron app
2. Copy current `pharmacy.sqlite` to quarantine
3. Restore last verified backup to `db/pharmacy.sqlite`
4. Run `npm run db:seed` only if schema version matches — otherwise restore matching app version
5. Verify login, sample stock query, and recent invoice count
6. Resume sync; review `Outbox` for pending events

## Related

- [Engineering standards — backup](../architecture/engineering-standards.md)
- [Data and sync](../architecture/data-and-sync.md)
- [Logging and audit](../architecture/logging-and-audit.md)
