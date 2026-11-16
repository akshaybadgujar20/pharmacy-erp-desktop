import {
  isSyncPhase1EntityType,
  SYNC_PHASE1_ENTITY_TYPES,
} from './sync-phase1-entity-types';
import {
  isSyncPhase2Enabled,
  SYNC_PHASE2_ENTITY_TYPES,
} from './sync-phase2-entity-types';

export function getSyncPushEntityTypes(): readonly string[] {
  if (isSyncPhase2Enabled()) {
    return [...SYNC_PHASE1_ENTITY_TYPES, ...SYNC_PHASE2_ENTITY_TYPES];
  }
  return SYNC_PHASE1_ENTITY_TYPES;
}

export function isSyncEnabledEntityType(entityType: string): boolean {
  if (isSyncPhase1EntityType(entityType)) {
    return true;
  }
  if (isSyncPhase2Enabled()) {
    return SYNC_PHASE2_ENTITY_TYPES.includes(entityType);
  }
  return false;
}
