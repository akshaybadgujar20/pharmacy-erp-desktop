---
name: Category overview docs
overview: "Add a category-overview markdown doc (like party_management.md) to each database table category folder: an intro, a Mermaid relationship diagram, a \"How the Tables Work Together\" section, and a linked Tables list."
todos:
  - id: user-security
    content: Create user_and_security/user_and_security.md overview (tables 09-14).
    status: completed
  - id: medicine-master
    content: Create medicine_master/medicine_master.md overview (tables 15-22).
    status: completed
  - id: inventory
    content: Create inventory/inventory.md overview (tables 23-29, 71, 72).
    status: completed
  - id: purchase
    content: Create purchase/purchase.md overview (tables 30-37).
    status: completed
  - id: sales
    content: Create sales/sales.md overview (tables 38-42).
    status: completed
  - id: financial
    content: Create financial/financial.md overview (tables 43-46).
    status: completed
  - id: pricing
    content: Create pricing/pricing.md overview (tables 47-50).
    status: completed
  - id: loyalty
    content: Create loyalty/loyalty.md overview (tables 51-52).
    status: completed
  - id: prescription
    content: Create prescription/prescription.md overview (tables 53-54).
    status: completed
  - id: synchronization
    content: Create synchronization/synchronization.md overview (tables 55-57).
    status: completed
  - id: configuration
    content: Create configuration/configuration.md overview (tables 60-66).
    status: completed
  - id: masters
    content: Create masters/masters.md overview (tables 67-70).
    status: completed
  - id: audit
    content: Upgrade audit/audit.md from bare link stub to full overview template (tables 58-59).
    status: completed
isProject: false
---

# Add per-category overview docs under database/tables

## Goal
Mirror [party_management/party_management.md](docs/pharmacy_erp_architecture_docs/database/tables/party_management/party_management.md) in every other category folder so each folder has a `<folder>.md` overview: title + intro, a Mermaid relationship diagram, a "How the Tables Work Together" bullet section, and a "Tables" list using `[[NN_table]]` wikilinks.

## Source material
[table_catalog.md](docs/pharmacy_erp_architecture_docs/database/tables/table_catalog.md) already holds Purpose/Usage text for all 66 tables grouped by these 14 categories. Reuse that text (condensed) plus the individual `NN_*.md` specs.

## Template (each new doc follows this shape)
```markdown
# <Category Name>

<1-2 sentence intro of what the category covers>

## Relationship Diagram
```mermaid
flowchart TB
  ...nodes for each table, edges for FKs, classDef styling like party_management...
```

## How the Tables Work Together
- <bullet per table / key relationship>

## Tables
- [[NN_table]] — short description.
```
Match the example's conventions: colored `classDef` blocks, cardinality edge labels (`"1 : many"`, `"1 : 0..1"`), and wikilink table list.

## Docs to create (file = `<folder>/<folder>.md`)
- `user_and_security/user_and_security.md` — 09_user, 10_role, 11_permission, 12_role_permission, 13_user_role, 14_user_session
- `medicine_master/medicine_master.md` — 15_medicine, 16_medicine_generic, 17_medicine_category, 18_medicine_schedule, 19_manufacturer, 20_salt_composition, 21_medicine_salt, 22_unit_of_measure
- `inventory/inventory.md` — 23_batch, 24_stock, 25_stock_movement, 26_stock_adjustment, 71_stock-adjustment-item, 27_stock_transfer, 72_stock-transfer-item, 28_stock_take, 29_stock_take_item
- `purchase/purchase.md` — 30_purchase_order, 31_purchase_order_item, 32_goods_receipt, 33_goods_receipt_item, 34_purchase_invoice, 35_purchase_invoice_item, 36_purchase_return, 37_purchase_return_item
- `sales/sales.md` — 38_sales_invoice, 39_sales_invoice_item, 40_sales_return, 41_sales_return_item, 42_sales_payment
- `financial/financial.md` — 43_payment, 44_receipt, 45_ledger, 46_ledger_entry
- `pricing/pricing.md` — 47_price_list, 48_price_list_item, 49_tax, 50_discount_rule
- `loyalty/loyalty.md` — 51_loyalty_program, 52_loyalty_transaction
- `prescription/prescription.md` — 53_prescription, 54_prescription_item
- `synchronization/synchronization.md` — 55_outbox, 56_sync_log, 57_sync_conflict
- `configuration/configuration.md` — 60_company, 61_branch, 62_financial_year, 63_sequence_generator, 64_app_setting, 65_printer_configuration, 66_barcode_configuration
- `masters/masters.md` — 67_country, 68_state, 69_city, 70_area (Country -> State -> City -> Area hierarchy)

## Doc to upgrade
- `audit/audit.md` currently only lists `[[58_audit_log]]` / `[[59_change_history]]`. Expand it to the full template (intro + diagram + how-they-work + Tables).

## Not touched
- `party_management/party_management.md` (the template, already complete).
- `table_catalog.md` and other index files (no linking changes unless requested).

## Notes / decisions
- File naming matches the example: the overview file is named after its folder.
- Diagrams reuse the example's colored `classDef` styling for visual consistency across the docs.
- Cross-category FKs (e.g. inventory referencing medicine/branch) are shown as external/dashed nodes where helpful, kept minimal to stay readable.