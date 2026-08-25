# Prescription

Prescription stores doctor-issued medication orders for patients. `Prescription` is the header; `PrescriptionItem` lists each prescribed medicine with dosage and dispensing instructions.

## Relationship Diagram

```mermaid
flowchart TB
    RX["Prescription<br/><small>Doctor • patient • date</small>"]
    RX_ITEM["PrescriptionItem<br/><small>Dosage • frequency • qty</small>"]

    RX -->|"1 : many"| RX_ITEM
    RX -.->|"prescribing"| DOC["Doctor"]
    RX -.->|"patient"| CUST["Customer"]
    RX_ITEM -.->|"may convert to"| INV_ITEM["SalesInvoiceItem"]

    classDef header fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef item fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class RX header;
    class RX_ITEM item;
    class DOC,CUST,INV_ITEM external;
```

**Legend:** prescriptions support Schedule H compliance; items may be converted directly into sales invoice lines.

## How the Tables Work Together

- **Prescription** captures doctor, patient, prescription date, validity, and status.
- **PrescriptionItem** stores medicine, dosage, strength, frequency, duration, and substitution rules.
- Pharmacists use prescription items to guide dispensing and regulatory compliance.
- Approved items can be converted into `SalesInvoiceItem` while retaining prescription reference.
- Schedule H and narcotic medicines require prescription linkage before sale.
- Prescriptions may be entered manually or imported from scanned/electronic sources.

## Tables

- [[53_prescription]] — prescription header.
- [[54_prescription_item]] — prescribed medicine line items.
