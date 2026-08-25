/**
 * Standard outbox payload envelope. Every enqueue should include entity version
 * for conflict detection during delta sync (handbook §13).
 */
export interface OutboxPayloadEnvelope<T = Record<string, unknown>> {
  payloadVersion: number;
  entityType: string;
  entityUuid: string;
  operation: string;
  entityVersion: number;
  occurredAt: string;
  data: T;
}

export const OUTBOX_PAYLOAD_VERSION = 1;

export function buildOutboxPayload<T>(
  entityType: string,
  entityUuid: string,
  operation: string,
  entityVersion: number,
  data: T,
): OutboxPayloadEnvelope<T> {
  return {
    payloadVersion: OUTBOX_PAYLOAD_VERSION,
    entityType,
    entityUuid,
    operation,
    entityVersion,
    occurredAt: new Date().toISOString(),
    data,
  };
}
