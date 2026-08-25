# Medicine Master

Medicine Master is the product catalog for the pharmacy. `Medicine` is the central record; related tables classify medicines, define compositions, link manufacturers, and standardize units of measure.

## Relationship Diagram

```mermaid
flowchart TB
    MED["Medicine<br/><small>Central product record</small>"]

    subgraph CLASSIFICATION["Classification & Composition"]
        direction LR
        CAT["MedicineCategory<br/><small>Tablet • Syrup • Injection</small>"]
        SCHED["MedicineSchedule<br/><small>Schedule H • OTC</small>"]
        GENERIC["MedicineGeneric<br/><small>Paracetamol • Amoxicillin</small>"]
        SALT["SaltComposition<br/><small>Active ingredients</small>"]
    end

    subgraph LINKS["Links & References"]
        direction LR
        MFG["Manufacturer<br/><small>Pharma company</small>"]
        MSALT["MedicineSalt<br/><small>Medicine ↔ Salt strength</small>"]
        UOM["UnitOfMeasure<br/><small>Tablet • Strip • Bottle</small>"]
    end

    MED -->|"many : 1"| CAT
    MED -->|"many : 1"| SCHED
    MED -->|"many : 1"| GENERIC
    MED -->|"many : 1"| MFG
    MED -->|"many : 1"| UOM
    MED -->|"1 : many"| MSALT
    SALT -->|"1 : many"| MSALT

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef shared fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef detail fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    class MED master;
    class CAT,SCHED,GENERIC,SALT,MFG,UOM shared;
    class MSALT detail;
```

**Legend:** `Medicine` is org-global master data referenced by inventory batches, purchase, sales, and prescriptions.

## How the Tables Work Together

- **Medicine** is the central product record — name, barcode, HSN, storage rules, prescription flags.
- **MedicineGeneric** groups branded medicines under a common generic (e.g. Crocin and Dolo under Paracetamol).
- **MedicineCategory** classifies dosage form or product type (Tablet, Syrup, Surgical Item).
- **MedicineSchedule** stores regulatory schedule (Schedule H, H1, X, OTC) for compliance rules.
- **Manufacturer** links to `Party` (party management) for pharma company identity.
- **SaltComposition** is the master list of active pharmaceutical ingredients.
- **MedicineSalt** is the junction defining which salts and strengths a medicine contains.
- **UnitOfMeasure** standardizes quantity units used across inventory, purchase, and sales.
- Sale pricing lives in `PriceListItem` (pricing), not on Medicine.
- All syncable masters use UUID, soft delete, and `version` for optimistic locking.

## Tables

- [[15_medicine]] — central medicine master record.
- [[16_medicine_generic]] — generic medicine grouping.
- [[17_medicine_category]] — medicine classification.
- [[18_medicine_schedule]] — regulatory drug schedule.
- [[19_manufacturer]] — medicine manufacturer (links to Party).
- [[20_salt_composition]] — active ingredient master.
- [[21_medicine_salt]] — medicine-to-salt composition junction.
- [[22_unit_of_measure]] — standard units of measure.
