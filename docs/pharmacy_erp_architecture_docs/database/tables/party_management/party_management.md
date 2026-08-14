# Party Management

Party Management is the shared master-data area for every person and organization in the Pharmacy ERP. Common identity information is stored once in `Party`; related tables store roles, contact details, addresses, and role-specific data.

## Relationship Diagram

```mermaid
flowchart TB
    PARTY["Party<br/><small>Person or Organization<br/>Master identity</small>"]

    subgraph SHARED["Shared Party Information"]
        direction LR
        ROLE["PartyRole<br/><small>Business roles</small>"]
        ADDRESS["PartyAddress<br/><small>Home • Work • Billing • Shipping</small>"]
        CONTACT["PartyContact<br/><small>Phone • Email • WhatsApp</small>"]
    end

    subgraph DETAILS["Role-Specific Details"]
        direction LR
        CUSTOMER["Customer<br/><small>Retail • Wholesale • Corporate</small>"]
        SUPPLIER["Supplier<br/><small>Manufacturer • Distributor • Wholesaler</small>"]
        DOCTOR["Doctor<br/><small>Registration and practice details</small>"]
        EMPLOYEE["Employee<br/><small>Employment and pharmacist details</small>"]
    end

    PARTY -->|"1 : many"| ROLE
    PARTY -->|"1 : many"| ADDRESS
    PARTY -->|"1 : many"| CONTACT
    PARTY -->|"1 : 0..1"| CUSTOMER
    PARTY -->|"1 : 0..1"| SUPPLIER
    PARTY -->|"1 : 0..1"| DOCTOR
    PARTY -->|"1 : 0..1"| EMPLOYEE

    ROLE -.->|"roleType should match detail"| CUSTOMER
    ROLE -.->|"roleType should match detail"| SUPPLIER
    ROLE -.->|"roleType should match detail"| DOCTOR
    ROLE -.->|"roleType should match detail"| EMPLOYEE

    classDef master fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff,stroke-width:3px;
    classDef shared fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:1.5px;
    classDef detail fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    class PARTY master;
    class ROLE,ADDRESS,CONTACT shared;
    class CUSTOMER,SUPPLIER,DOCTOR,EMPLOYEE detail;
```

**Legend:** solid arrows show database relationships. Dashed arrows show the application rule that a `PartyRole.roleType` should correspond to the related detail record.
## How the Tables Work Together

- **Party** is the central parent record for a person or organization. It stores shared identity and status information.
- **PartyRole** assigns business roles such as `CUSTOMER`, `SUPPLIER`, `DOCTOR`, `EMPLOYEE`, `ADMIN`, or `OTHER`. A party can have multiple roles.
- **PartyAddress** stores one or more addresses for a party, such as home, work, billing, or shipping addresses.
- **PartyContact** stores phone numbers, email addresses, WhatsApp details, and other contact values.
- **Customer**, **Supplier**, **Doctor**, and **Employee** store attributes specific to those business functions. Each is optional from `Party`, but each record belongs to exactly one party through a unique `partyId`.
- A single person or organization can have multiple business roles. For example, one person may be both a `DOCTOR` and an `EMPLOYEE`.
- `PartyRole` and the detail tables represent related business concepts, but the role-to-detail consistency rule should be enforced by the application service layer.
- All tables use a UUID for synchronization, timestamps for auditing, soft deletion through `deletedAt`, and optimistic locking through `version`.

## Tables

- [[01_party]] — central person or organization master.
- [[02_party_role]] — roles assigned to a party.
- [[03_party_address]] — addresses associated with a party.
- [[04_party_contact]] — contact methods associated with a party.
- [[05_customer]] — customer-specific information.
- [[06_supplier]] — supplier-specific information.
- [[07_doctor]] — doctor-specific professional information.
- [[08_employee]] — employee-specific information.
