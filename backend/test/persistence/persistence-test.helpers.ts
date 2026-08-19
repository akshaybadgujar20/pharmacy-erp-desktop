import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Batch, Branch, Company, Stock } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { RequestContextService } from '../../src/persistence/context/request-context.service';
import type { RequestContextData } from '../../src/persistence/context/request-context';
import { DocumentType } from '../../src/persistence/sequence/document-type.constants';
import { UnitOfWorkService } from '../../src/persistence/unit-of-work/unit-of-work.service';
import { PersistenceTestModule } from './persistence-test.module';

export const TEST_DEVICE_ID = 'test-device-001';

export interface SeededBranchContext {
  company: Company;
  branch: Branch;
}

export interface SeededStockContext {
  stock: Stock;
  batch: Batch;
}

export interface PersistenceTestServices {
  prisma: PrismaService;
  unitOfWork: UnitOfWorkService;
  requestContext: RequestContextService;
}

export async function createPersistenceTestContext(): Promise<{
  moduleRef: TestingModule;
  services: PersistenceTestServices;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [PersistenceTestModule],
  }).compile();

  await moduleRef.init();

  return {
    moduleRef,
    services: {
      prisma: moduleRef.get(PrismaService),
      unitOfWork: moduleRef.get(UnitOfWorkService),
      requestContext: moduleRef.get(RequestContextService),
    },
  };
}

export async function loadSeededBranch(prisma: PrismaService): Promise<SeededBranchContext> {
  const branch = await prisma.client.branch.findFirst({
    orderBy: { id: 'asc' },
  });
  if (!branch) {
    throw new Error('No seeded branch found in pharmacy.sqlite');
  }
  const company = await prisma.client.company.findUniqueOrThrow({
    where: { id: branch.companyId },
  });
  return { company, branch };
}

export async function loadSeededBatchWithStock(
  prisma: PrismaService,
  branchId: bigint,
): Promise<SeededStockContext> {
  const stock = await prisma.client.stock.findFirst({
    where: { branchId, isActive: true, deletedAt: null },
    orderBy: { id: 'asc' },
  });
  if (!stock) {
    throw new Error(`No stock for branch ${branchId}`);
  }
  const batch = await prisma.client.batch.findUniqueOrThrow({ where: { id: stock.batchId } });
  return { stock, batch };
}

function parseSequenceSuffix(documentNumber: string): bigint {
  const last = documentNumber.split('-').pop();
  if (!last || !/^\d+$/.test(last)) {
    return 0n;
  }
  return BigInt(last);
}

async function maxSequenceFromDocuments(
  prisma: PrismaService,
  branchId: bigint,
  documentType: string,
): Promise<bigint> {
  let maxSeq = 0n;

  if (documentType === DocumentType.STOCK_MOVEMENT) {
    const rows = await prisma.client.stockMovement.findMany({
      where: { branchId },
      select: { movementNumber: true },
    });
    for (const row of rows) {
      const seq = parseSequenceSuffix(row.movementNumber);
      if (seq > maxSeq) maxSeq = seq;
    }
  } else if (documentType === DocumentType.SALES_INVOICE) {
    const rows = await prisma.client.salesInvoice.findMany({
      where: { branchId },
      select: { invoiceNumber: true },
    });
    for (const row of rows) {
      const seq = parseSequenceSuffix(row.invoiceNumber);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  return maxSeq;
}

export async function syncSequenceBaseline(
  prisma: PrismaService,
  companyId: bigint,
  branchId: bigint,
  documentType: string,
  defaults: {
    prefix: string;
    format: string;
    resetPolicy?: string;
  },
): Promise<void> {
  const maxSeq = await maxSequenceFromDocuments(prisma, branchId, documentType);

  const existing = await prisma.client.sequenceGenerator.findFirst({
    where: { companyId, branchId, documentType },
  });

  if (existing) {
    if (existing.currentNumber < maxSeq) {
      await prisma.client.sequenceGenerator.update({
        where: { id: existing.id },
        data: { currentNumber: maxSeq },
      });
    }
    return;
  }

  await prisma.client.sequenceGenerator.create({
    data: {
      companyId,
      branchId,
      documentType,
      prefix: defaults.prefix,
      currentNumber: maxSeq,
      resetPolicy: defaults.resetPolicy ?? 'NEVER',
      format: defaults.format,
      isActive: true,
    },
  });
}

export async function ensureStockMovementSequence(
  prisma: PrismaService,
  companyId: bigint,
  branchId: bigint,
): Promise<void> {
  await syncSequenceBaseline(prisma, companyId, branchId, DocumentType.STOCK_MOVEMENT, {
    prefix: 'SM',
    format: 'SM-{BR}-{SEQ}',
  });
}

export async function ensureSalesInvoiceSequence(
  prisma: PrismaService,
  companyId: bigint,
  branchId: bigint,
): Promise<void> {
  await syncSequenceBaseline(prisma, companyId, branchId, DocumentType.SALES_INVOICE, {
    prefix: 'SI',
    format: 'SI-{BR}-{SEQ}',
    resetPolicy: 'YEARLY',
  });
}

export function buildTestRequestContext(seed: SeededBranchContext): RequestContextData {
  return {
    companyId: seed.company.id,
    branchId: seed.branch.id,
    deviceId: TEST_DEVICE_ID,
  };
}

export async function runWithTestContext<T>(
  services: PersistenceTestServices,
  seed: SeededBranchContext,
  fn: () => Promise<T>,
): Promise<T> {
  return services.requestContext.run(buildTestRequestContext(seed), fn);
}
