import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  PurchaseInvoiceStatus,
  PurchaseOrderStatus,
} from '../../purchase/constants/purchase.constants';
import {
  SalesInvoicePaymentStatus,
  SalesInvoiceStatus,
} from '../../sales/constants/sales.constants';
import {
  StockTakeStatus,
  StockTransferStatus,
} from '../../inventory/constants/inventory.constants';
import { PrismaService } from '../../prisma.service';

export interface PreCloseBlocker {
  code: string;
  count: number;
  message: string;
}

export interface PreCloseChecklistResult {
  canClose: boolean;
  blockers: PreCloseBlocker[];
}

@Injectable()
export class ClosingService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreCloseChecklist(
    companyId: bigint,
    branchId?: bigint,
  ): Promise<PreCloseChecklistResult> {
    const branchFilter = branchId ? { branchId } : {};
    const blockers: PreCloseBlocker[] = [];

    const [
      openPurchaseOrders,
      unpaidSalesInvoices,
      unpaidPurchaseInvoices,
      openTransfers,
      incompleteStockTakes,
    ] = await Promise.all([
      this.prisma.client.purchaseOrder.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              PurchaseOrderStatus.DRAFT,
              PurchaseOrderStatus.PENDING_APPROVAL,
            ],
          },
          branch: { companyId, deletedAt: null },
          ...branchFilter,
        },
      }),
      this.prisma.client.salesInvoice.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              SalesInvoiceStatus.POSTED,
              SalesInvoiceStatus.PARTIALLY_RETURNED,
            ],
          },
          paymentStatus: {
            in: [
              SalesInvoicePaymentStatus.UNPAID,
              SalesInvoicePaymentStatus.PARTIALLY_PAID,
            ],
          },
          balanceAmount: { gt: 0 },
          branch: { companyId, deletedAt: null },
          ...branchFilter,
        },
      }),
      this.prisma.client.purchaseInvoice.count({
        where: {
          deletedAt: null,
          status: PurchaseInvoiceStatus.POSTED,
          paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          balanceAmount: { gt: 0 },
          branch: { companyId, deletedAt: null },
          ...branchFilter,
        },
      }),
      this.prisma.client.stockTransfer.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              StockTransferStatus.IN_TRANSIT,
              StockTransferStatus.PARTIALLY_RECEIVED,
            ],
          },
          ...(branchId
            ? {
                OR: [
                  { sourceBranchId: branchId },
                  { destinationBranchId: branchId },
                ],
              }
            : {
                OR: [
                  { sourceBranch: { companyId, deletedAt: null } },
                  { destinationBranch: { companyId, deletedAt: null } },
                ],
              }),
        },
      }),
      this.prisma.client.stockTake.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              StockTakeStatus.DRAFT,
              StockTakeStatus.IN_PROGRESS,
              StockTakeStatus.COUNTED,
            ],
          },
          branch: { companyId, deletedAt: null },
          ...branchFilter,
        },
      }),
    ]);

    if (openPurchaseOrders > 0) {
      blockers.push({
        code: 'OPEN_PURCHASE_ORDERS',
        count: openPurchaseOrders,
        message: 'Open purchase orders must be completed or cancelled',
      });
    }

    if (unpaidSalesInvoices > 0) {
      blockers.push({
        code: 'UNPAID_SALES_INVOICES',
        count: unpaidSalesInvoices,
        message: 'Posted sales invoices with outstanding balance remain',
      });
    }

    if (unpaidPurchaseInvoices > 0) {
      blockers.push({
        code: 'UNPAID_PURCHASE_INVOICES',
        count: unpaidPurchaseInvoices,
        message: 'Posted purchase invoices with outstanding balance remain',
      });
    }

    if (openTransfers > 0) {
      blockers.push({
        code: 'IN_TRANSIT_TRANSFERS',
        count: openTransfers,
        message: 'Stock transfers are still in transit or partially received',
      });
    }

    if (incompleteStockTakes > 0) {
      blockers.push({
        code: 'INCOMPLETE_STOCK_TAKES',
        count: incompleteStockTakes,
        message: 'Stock takes are not reconciled',
      });
    }

    return {
      canClose: blockers.length === 0,
      blockers,
    };
  }

  assertCanClose(
    checklist: PreCloseChecklistResult,
    force?: boolean,
    forceReason?: string,
  ): void {
    if (checklist.canClose || force) {
      return;
    }

    throw new ApplicationException(
      ErrorCode.PRE_CLOSE_CHECKLIST_FAILED,
      'Financial year cannot be closed until pre-close checklist passes',
      HttpStatus.CONFLICT,
      {
        blockers: checklist.blockers,
        forceReason,
      },
    );
  }
}
