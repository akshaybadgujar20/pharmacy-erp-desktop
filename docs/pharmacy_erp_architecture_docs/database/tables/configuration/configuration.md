# Configuration

Configuration stores org structure, document numbering, runtime settings, and device preferences. These are reference tables — changed infrequently but referenced by almost every module.

## Relationship Diagram

```mermaid
flowchart TB
    COMPANY["Company<br/><small>Organization root</small>"]
    BRANCH["Branch<br/><small>Store • warehouse</small>"]
    FY["FinancialYear<br/><small>Open • Closed periods</small>"]

    subgraph SETTINGS["Runtime Configuration"]
        direction LR
        APP["AppSetting<br/><small>Business rules • flags</small>"]
        SEQ["SequenceGenerator<br/><small>Document numbers</small>"]
        PRINTER["PrinterConfiguration<br/><small>Receipt • label printers</small>"]
        BARCODE["BarcodeConfiguration<br/><small>Label formats</small>"]
    end

    COMPANY -->|"1 : many"| BRANCH
    COMPANY -->|"1 : many"| FY
    COMPANY -->|"1 : many"| SEQ
    BRANCH -->|"1 : many"| SEQ
    BRANCH -->|"1 : many"| APP
    BRANCH -->|"1 : many"| PRINTER

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef org fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef config fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    class COMPANY master;
    class BRANCH,FY org;
    class APP,SEQ,PRINTER,BARCODE config;
```

**Legend:** `AppSetting` resolves branch-scoped row → company-wide row. See `SettingsService` in early foundations.

## How the Tables Work Together

- **Company** is the tenant root — legal name, GSTIN, drug license, and statutory details for documents.
- **Branch** represents each pharmacy location with independent inventory and document numbering.
- **FinancialYear** defines accounting periods for reports, GST filings, and year-end closing.
- **SequenceGenerator** produces branch-scoped document numbers (invoice, PO, GRN, etc.).
- **AppSetting** holds configurable business rules — GST defaults, sync interval, receipt prefix — without code changes.
- **PrinterConfiguration** maps document types to printers and templates per branch.
- **BarcodeConfiguration** defines barcode formats, label sizes, and print layouts.
- Configuration changes should be audited via `AuditService` when exposed in admin UI.

## Tables

- [[60_company]] — organization / company master.
- [[61_branch]] — pharmacy branch or location.
- [[62_financial_year]] — accounting financial year.
- [[63_sequence_generator]] — document number sequences.
- [[64_app_setting]] — application settings and business rules.
- [[65_printer_configuration]] — printer mappings and templates.
- [[66_barcode_configuration]] — barcode generation settings.
