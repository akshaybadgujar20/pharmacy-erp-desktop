# Lookup / Masters

Lookup / Masters provides hierarchical geographic reference data used across addresses, GST compliance, and reporting. Country → State → City → Area forms a strict parent-child hierarchy.

## Relationship Diagram

```mermaid
flowchart TB
    COUNTRY["Country<br/><small>ISO code • currency</small>"]
    STATE["State<br/><small>GST state code</small>"]
    CITY["City<br/><small>City within state</small>"]
    AREA["Area<br/><small>Locality • postal zone</small>"]

    COUNTRY -->|"1 : many"| STATE
    STATE -->|"1 : many"| CITY
    CITY -->|"1 : many"| AREA

    AREA -.->|"referenced by"| ADDR["PartyAddress"]
    ADDR -.->|"used by"| PARTIES["Customer • Supplier • Branch"]

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef geo fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef local fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;
    classDef external fill:#f3f4f6,stroke:#6b7280,color:#374151,stroke-width:1px,stroke-dasharray:5;

    class COUNTRY master;
    class STATE,CITY geo;
    class AREA local;
    class ADDR,PARTIES external;
```

**Legend:** addresses store lookup IDs instead of free-text geography for consistency and reporting.

## How the Tables Work Together

- **Country** is the root geographic master with ISO codes and currency metadata.
- **State** belongs to a country and carries GST state codes for Indian tax compliance.
- **City** belongs to a state; used in party addresses, company, and branch records.
- **Area** is a locality or delivery zone within a city, optionally with postal codes.
- Lookup IDs replace repeated free-text in thousands of address records.
- Consistent spelling improves search, GST reporting, and delivery zone management.
- Future lookup tables (Currency, PaymentMethod, DosageForm, etc.) follow the same pattern.

## Tables

- [[67_country]] — country master.
- [[68_state]] — state or province master.
- [[69_city]] — city master.
- [[70_area]] — locality / area master.
