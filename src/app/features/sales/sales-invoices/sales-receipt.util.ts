import { SalesInvoice } from './sales-invoice.models';

export function buildSalesReceiptHtml(invoice: SalesInvoice): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt</title>
<style>body{font-family:monospace;font-size:12px;margin:16px}h1{font-size:14px}</style></head><body>
<h1>Sales receipt</h1>
<p>Invoice: ${invoice.invoiceNumber || invoice.id}</p>
<p>Date: ${invoice.invoiceDate}</p>
<p>Net: ${invoice.netAmount ?? ''}</p>
<p>Status: ${invoice.status} / ${invoice.paymentStatus}</p>
</body></html>`;
}
