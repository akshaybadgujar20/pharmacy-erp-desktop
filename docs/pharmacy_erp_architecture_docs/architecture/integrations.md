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

**Implemented (backend):** extensible report registry with party reports and CSV / Excel / PDF export. See [Reporting architecture](./reporting.md) for API usage, permissions, and how to add providers.

**Planned product coverage** (future providers):

- Sales, purchase, stock, profit, GST
- Expiry, fast/slow-moving medicines

Reports should be exportable to PDF and Excel (supported via `format=pdf` and `format=xlsx`).

## Related docs

- [Reporting (implemented)](./reporting.md) — API, extension guide, party reports
- [Application architecture](./application-architecture.md) — Electron main process for hardware
- [Early foundations](./early-foundations.md) — Electron IPC
