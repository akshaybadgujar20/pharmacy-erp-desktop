# Engineering Standards

## Coding Standards

- Strict TypeScript
- ESLint
- Prettier
- Dependency Injection
- SOLID Principles
- Clean Architecture
- Meaningful naming
- Small services
- Small functions

## Testing

- Unit Tests
- Integration Tests
- API Tests
- End-to-End Tests
- Sync Scenario Tests
- Performance Tests

Automate critical business flows.

Commands: [Early foundations — Tests](./early-foundations.md#tests).

## CI/CD

Automate:

- Linting
- Unit tests
- Build
- Packaging
- Versioning
- Release signing

## Error Handling

Show user-friendly messages. Avoid technical stack traces. Allow safe retries where possible.

Backend: `ApplicationException`, `GlobalExceptionFilter`, `ErrorCode`. Angular: `errorInterceptor` with toastr.

## Performance Guidelines

Targets:

- Search < 200 ms
- Open screen < 500 ms
- Invoice print < 2 s
- Startup < 5 s

Use background workers for long-running tasks.

## Observability

Track:

- Errors
- Sync failures
- Performance
- Database latency
- Hardware issues

Logs should help diagnose problems quickly.

Implemented: [Logging and audit](./logging-and-audit.md).

## Telemetry & Analytics

Collect anonymous usage metrics (with customer consent).

Examples:

- Slow screens
- Feature usage
- Error frequency
- Sync duration

Use data to guide product improvements.

## Feature Flags

Enable gradual rollout of new features.

Benefits:

- Safer releases
- A/B testing
- Easy rollback

## Backup & Recovery

Automatic scheduled backups.

Support:

- Local backups
- External drive
- Cloud upload (future)

Test restore procedures regularly.

## Release Checklist

Platform setup reference: [Early foundations](./early-foundations.md) (auth env vars, demo login, `AppSetting` keys, local dev commands).

Before every release, verify:

- [ ] All tests passing
- [ ] No critical lint errors
- [ ] Database migrations reviewed
- [ ] Performance targets met
- [ ] Security review completed
- [ ] Backup tested
- [ ] Sync tested online/offline
- [ ] Printing validated
- [ ] Barcode scanner tested
- [ ] Audit logs verified
- [ ] Release notes prepared

## Related docs

- [Logging and audit](./logging-and-audit.md)
- [Early foundations](./early-foundations.md)
- [Security](./security.md)
