# ADR-160: Export libraries: exceljs and pdfmake

**Status:** Active  
**Confidence:** Explicit  
**Modules:** reporting

---

## Problem / Context

Need Excel and PDF generation without native build deps.

## Question Discussed

Which libraries should power XLSX and PDF export?

## Options Considered

1. exceljs + pdfmake
2. xlsx + puppeteer
3. Server-side only CSV

## Decision Selected

Use `exceljs` for xlsx and `pdfmake` for tabular PDFs (Roboto fonts from package).

## Rationale

The historical discussion confirms the selection above, but does not explicitly record the reasoning.

## Rejected Alternatives

xlsx + puppeteer; Server-side only CSV

## Historical Source

- Doc 10 — subagent draft ADR-042

**Phase 2 draft cross-ref:** subagent draft ADR-042

