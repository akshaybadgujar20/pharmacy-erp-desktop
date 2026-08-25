import { AuditAction } from '../../src/audit/audit-action.constants';
import { AuditModule as AuditModuleName } from '../../src/audit/audit-module.constants';
import {
  createPersistenceTestContext,
  loadSeededBranch,
  runWithTestContext,
  type PersistenceTestServices,
} from './persistence-test.helpers';

const TEST_AUDIT_MARKER = 'audit-integration-test';

describe('AuditService (integration)', () => {
  let services: PersistenceTestServices;

  beforeAll(async () => {
    const context = await createPersistenceTestContext();
    services = context.services;
  });

  afterAll(async () => {
    await services.prisma.client.auditLog.deleteMany({
      where: { description: TEST_AUDIT_MARKER },
    });
  });

  it('persists AuditLog row inside UnitOfWork transaction', async () => {
    const seed = await loadSeededBranch(services.prisma);

    await runWithTestContext(services, seed, async () => {
      await services.unitOfWork.run(async (tx) => {
        await services.auditService.log(tx, {
          entityType: 'TestEntity',
          action: AuditAction.CREATE,
          module: AuditModuleName.CONFIGURATION,
          description: TEST_AUDIT_MARKER,
        });
      });
    });

    const row = await services.prisma.client.auditLog.findFirst({
      where: { description: TEST_AUDIT_MARKER },
    });

    expect(row).toBeTruthy();
    expect(row?.action).toBe(AuditAction.CREATE);
    expect(row?.module).toBe(AuditModuleName.CONFIGURATION);
    expect(row?.deviceId).toBe('test-device-001');

    await services.prisma.client.auditLog.delete({ where: { id: row!.id } });
  });
});
