import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { isSyncPhase1EntityType } from './sync-phase1-entity-types';

export const SyncEntityApplyPolicy = {
  SERVER_WIN: 'SERVER_WIN',
  CONFLICT_FIRST: 'CONFLICT_FIRST',
  SKIP: 'SKIP',
} as const;

export type SyncEntityApplyPolicy =
  (typeof SyncEntityApplyPolicy)[keyof typeof SyncEntityApplyPolicy];

const conflictFirst = new Set<string>([
  OutboxEntityType.STOCK,
  OutboxEntityType.STOCK_MOVEMENT,
  OutboxEntityType.STOCK_ADJUSTMENT,
  OutboxEntityType.STOCK_TRANSFER,
  OutboxEntityType.STOCK_TAKE,
  OutboxEntityType.LEDGER,
  OutboxEntityType.LEDGER_ENTRY,
  OutboxEntityType.PAYMENT,
  OutboxEntityType.RECEIPT,
  OutboxEntityType.LOYALTY_TRANSACTION,
]);

export function getEntityApplyPolicy(
  entityType: string,
): SyncEntityApplyPolicy {
  if (isSyncPhase1EntityType(entityType)) {
    return SyncEntityApplyPolicy.SERVER_WIN;
  }
  if (conflictFirst.has(entityType)) {
    return SyncEntityApplyPolicy.CONFLICT_FIRST;
  }
  return SyncEntityApplyPolicy.SERVER_WIN;
}
