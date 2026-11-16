import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';

/** Entity types included in Phase 1 push/pull/apply (masters + party). */
export const SYNC_PHASE1_ENTITY_TYPES: readonly string[] = [
  OutboxEntityType.PARTY,
  OutboxEntityType.PARTY_ROLE,
  OutboxEntityType.PARTY_ADDRESS,
  OutboxEntityType.PARTY_CONTACT,
  OutboxEntityType.CUSTOMER,
  OutboxEntityType.SUPPLIER,
  OutboxEntityType.DOCTOR,
  OutboxEntityType.EMPLOYEE,
  OutboxEntityType.MEDICINE,
  OutboxEntityType.MEDICINE_GENERIC,
  OutboxEntityType.MEDICINE_CATEGORY,
  OutboxEntityType.MEDICINE_SCHEDULE,
  OutboxEntityType.MANUFACTURER,
  OutboxEntityType.SALT_COMPOSITION,
  OutboxEntityType.MEDICINE_SALT,
  OutboxEntityType.UNIT_OF_MEASURE,
  OutboxEntityType.COMPANY,
  OutboxEntityType.BRANCH,
  OutboxEntityType.COUNTRY,
  OutboxEntityType.STATE,
  OutboxEntityType.CITY,
  OutboxEntityType.AREA,
] as const;

const phase1Set = new Set<string>(SYNC_PHASE1_ENTITY_TYPES);

export function isSyncPhase1EntityType(entityType: string): boolean {
  return phase1Set.has(entityType);
}
