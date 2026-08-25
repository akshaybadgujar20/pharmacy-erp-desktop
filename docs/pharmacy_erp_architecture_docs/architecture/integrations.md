# Integrations

## Hardware Integration

Abstract hardware behind interfaces.

Examples:

- PrinterService
- BarcodeScannerService
- PaymentGatewayService

This allows easy replacement of vendors without changing business logic.

## Printing

Support:

- Thermal printers
- A4 invoices
- Labels
- Barcode labels

Keep templates configurable. Printer mappings are stored in `AppSetting` — see [Early foundations — settings](./early-foundations.md#configuration-driven-settings-appsetting).

## Barcode

Support:

- USB HID scanners
- Manual barcode entry
- Barcode generation
- Label printing

## Reporting

Provide:

- Sales
- Purchase
- Stock
- Profit
- GST
- Expiry
- Fast-moving medicines
- Slow-moving medicines

Reports should be exportable to PDF and Excel.

## Related docs

- [Application architecture](./application-architecture.md) — Electron main process for hardware
- [Early foundations](./early-foundations.md) — Electron IPC
