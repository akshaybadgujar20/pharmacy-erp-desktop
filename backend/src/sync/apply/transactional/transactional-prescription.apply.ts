import { OutboxEntityType } from '../../../persistence/outbox/entity-type.constants';
import type { TxClient } from '../../../persistence/prisma/prisma-tx.type';
import type { SyncCloudPullRecord } from '../../cloud/sync-cloud.contract';
import {
  asBigInt,
  asOptionalString,
  asString,
  extractApplyData,
  recordEntityUuid,
  serverVersionFromRecord,
  SyncApplyError,
} from '../sync-apply.util';
import {
  resolveIdField,
  stripIncomingSyncData,
  txBranchLookup,
  txCustomerLookup,
  txDoctorLookup,
  txMedicineLookup,
  txPrescriptionLookup,
  txUnitLookup,
} from '../sync-fk-resolve.util';
import {
  applyEmbeddedLines,
  applyServerWin,
  asDecimal,
  asInt,
} from './transactional-apply-shared';

export async function applyPrescriptionTransactional(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  switch (record.entityType) {
    case OutboxEntityType.PRESCRIPTION:
      await applyPrescription(tx, record);
      return;
    case OutboxEntityType.PRESCRIPTION_ITEM:
      await applyPrescriptionItem(tx, record);
      return;
    default:
      throw new SyncApplyError(
        `Prescription apply does not handle ${record.entityType}`,
      );
  }
}

async function upsertPrescriptionItemLine(
  tx: TxClient,
  line: Record<string, unknown>,
): Promise<void> {
  const uuid = asString(line.uuid ?? line.entityUuid, 'uuid');
  const prescriptionId = await resolveIdField(
    txPrescriptionLookup(tx),
    line,
    'prescriptionId',
    'prescriptionUuid',
    'prescription',
    true,
  );
  const medicineId = await resolveIdField(
    txMedicineLookup(tx),
    line,
    'medicineId',
    'medicineUuid',
    'medicine',
    true,
  );
  const unitId = await resolveIdField(
    txUnitLookup(tx),
    line,
    'unitId',
    'unitUuid',
    'unit',
    true,
  );
  const serverVersion = line.version ? asBigInt(line.version, 'version') : 1n;
  const existing = await tx.prescriptionItem.findFirst({ where: { uuid } });
  const payload = {
    prescriptionId: prescriptionId!,
    medicineId: medicineId!,
    unitId: unitId!,
    lineNumber: asInt(line.lineNumber, 'lineNumber'),
    prescribedQuantity: asDecimal(line.prescribedQuantity),
    dispensedQuantity: asDecimal(line.dispensedQuantity ?? '0'),
    remainingQuantity: asDecimal(line.remainingQuantity),
    dosage: asOptionalString(line.dosage),
    frequency: asOptionalString(line.frequency),
    duration: asOptionalString(line.duration),
    route: asOptionalString(line.route),
    instructions: asOptionalString(line.instructions),
    status: asString(line.status, 'status'),
    remarks: asOptionalString(line.remarks),
    version: serverVersion,
    updatedAt: BigInt(Date.now()),
  };
  if (existing) {
    await tx.prescriptionItem.update({
      where: { id: existing.id },
      data: payload as never,
    });
    return;
  }
  await tx.prescriptionItem.create({
    data: {
      uuid,
      ...payload,
      createdAt: BigInt(Date.now()),
    } as never,
  });
}

async function applyPrescription(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  await applyServerWin(
    tx,
    record,
    async (uuid) => {
      const row = await tx.prescription.findFirst({ where: { uuid } });
      return row ? { id: row.id, version: row.version } : null;
    },
    async (data, uuid, serverVersion) => {
      const base = stripIncomingSyncData(data);
      const customerId = await resolveIdField(
        txCustomerLookup(tx),
        base,
        'customerId',
        'customerUuid',
        'customer',
        true,
      );
      const doctorId = await resolveIdField(
        txDoctorLookup(tx),
        base,
        'doctorId',
        'doctorUuid',
        'doctor',
        true,
      );
      const branchId = await resolveIdField(
        txBranchLookup(tx),
        base,
        'branchId',
        'branchUuid',
        'branch',
        true,
      );
      return {
        uuid,
        prescriptionNumber: asString(
          base.prescriptionNumber,
          'prescriptionNumber',
        ),
        customerId: customerId!,
        doctorId: doctorId!,
        branchId: branchId!,
        prescriptionDate: asBigInt(base.prescriptionDate, 'prescriptionDate'),
        validUntil: base.validUntil
          ? asBigInt(base.validUntil, 'validUntil')
          : null,
        diagnosis: asOptionalString(base.diagnosis),
        symptoms: asOptionalString(base.symptoms),
        visitNumber: asOptionalString(base.visitNumber),
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      };
    },
    (data, serverVersion) => {
      const base = stripIncomingSyncData(data);
      return {
        prescriptionNumber: asString(
          base.prescriptionNumber,
          'prescriptionNumber',
        ),
        prescriptionDate: asBigInt(base.prescriptionDate, 'prescriptionDate'),
        validUntil: base.validUntil
          ? asBigInt(base.validUntil, 'validUntil')
          : null,
        diagnosis: asOptionalString(base.diagnosis),
        symptoms: asOptionalString(base.symptoms),
        visitNumber: asOptionalString(base.visitNumber),
        status: asString(base.status, 'status'),
        remarks: asOptionalString(base.remarks),
        version: serverVersion,
        updatedAt: BigInt(Date.now()),
      };
    },
    (row) => tx.prescription.create({ data: row as never }),
    (id, row) => tx.prescription.update({ where: { id }, data: row as never }),
    async (data) => {
      await applyEmbeddedLines(tx, data, '', async (ltx, line) => {
        await upsertPrescriptionItemLine(ltx, line);
      });
    },
  );
}

async function applyPrescriptionItem(
  tx: TxClient,
  record: SyncCloudPullRecord,
): Promise<void> {
  const data = extractApplyData(record.payload);
  const uuid = recordEntityUuid(record, data);
  const serverVersion = serverVersionFromRecord(record);
  await upsertPrescriptionItemLine(tx, {
    ...data,
    uuid,
    version: serverVersion,
  });
}
