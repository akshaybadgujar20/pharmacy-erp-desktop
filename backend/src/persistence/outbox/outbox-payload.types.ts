/**
 * Standard outbox payload envelope. Every enqueue should include entity version
 * for conflict detection during delta sync (handbook §13).
 */
export interface OutboxPayloadEnvelope<T = Record<string, unknown>> {
  payloadVersion: number;
  entityType: string;
  entityUuid: string;
  operation: string;
  entityVersion: string;
  occurredAt: string;
  data: T;
}

export const OUTBOX_PAYLOAD_VERSION = 1;

export function buildOutboxPayload<T>(
  entityType: string,
  entityUuid: string,
  operation: string,
  entityVersion: bigint,
  data: T,
): OutboxPayloadEnvelope<T> {
  return {
    payloadVersion: OUTBOX_PAYLOAD_VERSION,
    entityType,
    entityUuid,
    operation,
    entityVersion: entityVersion.toString(),
    occurredAt: new Date().toISOString(),
    data,
  };
}
