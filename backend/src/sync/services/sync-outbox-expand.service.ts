import { Injectable } from '@nestjs/common';
import type { Outbox } from '@prisma/client';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OUTBOX_PAYLOAD_VERSION } from '../../persistence/outbox/outbox-payload.types';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { serializeRowForSync } from '../utils/sync-serialize.util';
import {
  expandBatchRow,
  expandGoodsReceiptRow,
  expandPrescriptionRow,
  expandPriceListRow,
  expandPurchaseOrderRow,
  expandSalesInvoiceRow,
  expandStockMovementRow,
  expandStockRow,
} from '../utils/sync-outbox-expand-transactional.util';

export interface ExpandedOutboxPayload {
  payloadVersion: number;
  entityVersion: string;
  data: Record<string, unknown>;
}

@Injectable()
export class SyncOutboxExpandService {
  async expand(
    tx: TxClient,
    row: Outbox,
  ): Promise<ExpandedOutboxPayload | null> {
    const data = await this.loadEntityData(tx, row.entityType, row.entityUuid);
    if (!data) {
      return null;
    }
    const entityVersion =
      typeof data.version === 'string'
        ? data.version
        : String(data.version ?? row.version);
    return {
      payloadVersion: OUTBOX_PAYLOAD_VERSION,
      entityVersion,
      data,
    };
  }

  private async loadEntityData(
    tx: TxClient,
    entityType: string,
    entityUuid: string,
  ): Promise<Record<string, unknown> | null> {
    switch (entityType) {
      case OutboxEntityType.PARTY:
        return this.loadParty(tx, entityUuid);
      case OutboxEntityType.CUSTOMER:
        return this.loadCustomer(tx, entityUuid);
      case OutboxEntityType.SUPPLIER:
        return this.loadSupplier(tx, entityUuid);
      case OutboxEntityType.DOCTOR:
        return this.loadDoctor(tx, entityUuid);
      case OutboxEntityType.EMPLOYEE:
        return this.loadEmployee(tx, entityUuid);
      case OutboxEntityType.PARTY_ROLE:
        return this.loadPartyRole(tx, entityUuid);
      case OutboxEntityType.PARTY_ADDRESS:
        return this.loadPartyAddress(tx, entityUuid);
      case OutboxEntityType.PARTY_CONTACT:
        return this.loadPartyContact(tx, entityUuid);
      case OutboxEntityType.COMPANY:
        return this.loadSimple(tx, tx.company, entityUuid);
      case OutboxEntityType.BRANCH:
        return this.loadBranch(tx, entityUuid);
      case OutboxEntityType.COUNTRY:
        return this.loadSimple(tx, tx.country, entityUuid);
      case OutboxEntityType.STATE:
        return this.loadState(tx, entityUuid);
      case OutboxEntityType.CITY:
        return this.loadCity(tx, entityUuid);
      case OutboxEntityType.AREA:
        return this.loadArea(tx, entityUuid);
      case OutboxEntityType.MANUFACTURER:
        return this.loadManufacturer(tx, entityUuid);
      case OutboxEntityType.MEDICINE:
        return this.loadMedicine(tx, entityUuid);
      case OutboxEntityType.MEDICINE_CATEGORY:
        return this.loadSimple(tx, tx.medicineCategory, entityUuid);
      case OutboxEntityType.MEDICINE_SCHEDULE:
        return this.loadSimple(tx, tx.medicineSchedule, entityUuid);
      case OutboxEntityType.UNIT_OF_MEASURE:
        return this.loadSimple(tx, tx.unitOfMeasure, entityUuid);
      case OutboxEntityType.MEDICINE_GENERIC:
        return this.loadSimple(tx, tx.medicineGeneric, entityUuid);
      case OutboxEntityType.SALT_COMPOSITION:
        return this.loadSaltComposition(tx, entityUuid);
      case OutboxEntityType.MEDICINE_SALT:
        return this.loadMedicineSalt(tx, entityUuid);
      default:
        return this.loadTransactional(tx, entityType, entityUuid);
    }
  }

  private async loadTransactional(
    tx: TxClient,
    entityType: string,
    entityUuid: string,
  ): Promise<Record<string, unknown> | null> {
    switch (entityType) {
      case OutboxEntityType.PRICE_LIST:
        return expandPriceListRow(tx, entityUuid);
      case OutboxEntityType.PRICE_LIST_ITEM:
        return this.loadPriceListItem(tx, entityUuid);
      case OutboxEntityType.TAX:
        return this.loadSimpleRow(tx.tax, entityUuid);
      case OutboxEntityType.DISCOUNT_RULE:
        return this.loadSimpleRow(tx.discountRule, entityUuid);
      case OutboxEntityType.PRESCRIPTION:
        return expandPrescriptionRow(tx, entityUuid);
      case OutboxEntityType.PRESCRIPTION_ITEM:
        return this.loadPrescriptionItem(tx, entityUuid);
      case OutboxEntityType.PURCHASE_ORDER:
        return expandPurchaseOrderRow(tx, entityUuid);
      case OutboxEntityType.GOODS_RECEIPT:
        return expandGoodsReceiptRow(tx, entityUuid);
      case OutboxEntityType.PURCHASE_INVOICE:
        return this.loadSimpleRow(tx.purchaseInvoice, entityUuid);
      case OutboxEntityType.PURCHASE_RETURN:
        return this.loadSimpleRow(tx.purchaseReturn, entityUuid);
      case OutboxEntityType.SALES_INVOICE:
        return expandSalesInvoiceRow(tx, entityUuid);
      case OutboxEntityType.SALES_PAYMENT:
        return this.loadSimpleRow(tx.salesPayment, entityUuid);
      case OutboxEntityType.SALES_RETURN:
        return this.loadSimpleRow(tx.salesReturn, entityUuid);
      case OutboxEntityType.BATCH:
        return expandBatchRow(tx, entityUuid);
      case OutboxEntityType.STOCK:
        return expandStockRow(tx, entityUuid);
      case OutboxEntityType.STOCK_MOVEMENT:
        return expandStockMovementRow(tx, entityUuid);
      case OutboxEntityType.STOCK_ADJUSTMENT:
        return this.loadSimpleRow(tx.stockAdjustment, entityUuid);
      case OutboxEntityType.STOCK_TRANSFER:
        return this.loadSimpleRow(tx.stockTransfer, entityUuid);
      case OutboxEntityType.STOCK_TAKE:
        return this.loadSimpleRow(tx.stockTake, entityUuid);
      case OutboxEntityType.LEDGER:
        return this.loadSimpleRow(tx.ledger, entityUuid);
      case OutboxEntityType.LEDGER_ENTRY:
        return this.loadSimpleRow(tx.ledgerEntry, entityUuid);
      case OutboxEntityType.PAYMENT:
        return this.loadSimpleRow(tx.payment, entityUuid);
      case OutboxEntityType.RECEIPT:
        return this.loadSimpleRow(tx.receipt, entityUuid);
      case OutboxEntityType.LOYALTY_PROGRAM:
        return this.loadSimpleRow(tx.loyaltyProgram, entityUuid);
      case OutboxEntityType.LOYALTY_TRANSACTION:
        return this.loadSimpleRow(tx.loyaltyTransaction, entityUuid);
      case OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP:
        return this.loadSimpleRow(tx.customerLoyaltyMembership, entityUuid);
      default:
        return null;
    }
  }

  private async loadSimpleRow(
    delegate: {
      findFirst: (args: { where: { uuid: string } }) => Promise<object | null>;
    },
    uuid: string,
  ): Promise<Record<string, unknown> | null> {
    const row = await delegate.findFirst({ where: { uuid } });
    if (!row) {
      return null;
    }
    return serializeRowForSync(row as Record<string, unknown>);
  }

  private async loadSimple(
    tx: TxClient,
    delegate: {
      findFirst: (args: { where: { uuid: string } }) => Promise<object | null>;
    },
    uuid: string,
  ): Promise<Record<string, unknown> | null> {
    return this.loadSimpleRow(delegate, uuid);
  }

  private async loadParty(tx: TxClient, uuid: string) {
    const row = await tx.party.findFirst({ where: { uuid } });
    if (!row) {
      return null;
    }
    return serializeRowForSync(row as unknown as Record<string, unknown>);
  }

  private async loadCustomer(tx: TxClient, uuid: string) {
    const row = await tx.customer.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadSupplier(tx: TxClient, uuid: string) {
    const row = await tx.supplier.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadDoctor(tx: TxClient, uuid: string) {
    const row = await tx.doctor.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadEmployee(tx: TxClient, uuid: string) {
    const row = await tx.employee.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadManufacturer(tx: TxClient, uuid: string) {
    const row = await tx.manufacturer.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadPartyRole(tx: TxClient, uuid: string) {
    const row = await tx.partyRole.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadPartyAddress(tx: TxClient, uuid: string) {
    const row = await tx.partyAddress.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadPartyContact(tx: TxClient, uuid: string) {
    const row = await tx.partyContact.findFirst({
      where: { uuid },
      include: { party: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.partyUuid = row.party.uuid;
    return data;
  }

  private async loadBranch(tx: TxClient, uuid: string) {
    const row = await tx.branch.findFirst({
      where: { uuid },
      include: { company: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.companyUuid = row.company.uuid;
    return data;
  }

  private async loadState(tx: TxClient, uuid: string) {
    const row = await tx.state.findFirst({
      where: { uuid },
      include: { country: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.countryUuid = row.country.uuid;
    return data;
  }

  private async loadCity(tx: TxClient, uuid: string) {
    const row = await tx.city.findFirst({
      where: { uuid },
      include: { state: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.stateUuid = row.state.uuid;
    return data;
  }

  private async loadArea(tx: TxClient, uuid: string) {
    const row = await tx.area.findFirst({
      where: { uuid },
      include: { city: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.cityUuid = row.city.uuid;
    return data;
  }

  private async loadMedicine(tx: TxClient, uuid: string) {
    const row = await tx.medicine.findFirst({
      where: { uuid },
      include: {
        manufacturer: true,
        category: true,
        unit: true,
        schedule: true,
      },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.manufacturerUuid = row.manufacturer.uuid;
    data.categoryUuid = row.category.uuid;
    data.unitUuid = row.unit.uuid;
    if (row.schedule) {
      data.scheduleUuid = row.schedule.uuid;
    }
    return data;
  }

  private async loadSaltComposition(tx: TxClient, uuid: string) {
    const row = await tx.saltComposition.findFirst({
      where: { uuid },
      include: { generic: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.genericUuid = row.generic.uuid;
    return data;
  }

  private async loadPriceListItem(tx: TxClient, uuid: string) {
    const row = await tx.priceListItem.findFirst({
      where: { uuid },
      include: { priceList: true, medicine: true, tax: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.priceListUuid = row.priceList.uuid;
    data.medicineUuid = row.medicine.uuid;
    if (row.tax) {
      data.taxUuid = row.tax.uuid;
    }
    return data;
  }

  private async loadPrescriptionItem(tx: TxClient, uuid: string) {
    const row = await tx.prescriptionItem.findFirst({
      where: { uuid },
      include: { prescription: true, medicine: true, unit: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.prescriptionUuid = row.prescription.uuid;
    data.medicineUuid = row.medicine.uuid;
    data.unitUuid = row.unit.uuid;
    return data;
  }

  private async loadMedicineSalt(tx: TxClient, uuid: string) {
    const row = await tx.medicineSalt.findFirst({
      where: { uuid },
      include: { medicine: true, saltComposition: true },
    });
    if (!row) {
      return null;
    }
    const data = serializeRowForSync(row as unknown as Record<string, unknown>);
    data.medicineUuid = row.medicine.uuid;
    data.compositionUuid = row.saltComposition.uuid;
    return data;
  }
}
