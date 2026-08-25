# Product & UX

## UX Guidelines

The ERP should optimize the pharmacist's workflow, not showcase technology.

### Goals

- Minimum clicks
- Large touch targets where appropriate
- Consistent layouts
- Clear feedback
- Fast search
- Helpful validation
- Undo where possible

## Keyboard First Philosophy

Everything should work without a mouse.

Examples:

- F2 → New Sale
- F4 → Search Medicine
- F8 → Payment
- Ctrl+S → Save
- Esc → Cancel

Benefits:

- Faster billing
- Less fatigue
- Better productivity

Implemented placeholders: [Early foundations — Keyboard shortcuts](./early-foundations.md#keyboard-shortcuts-placeholders).

## Workflow Driven UI

Design screens around real work.

Cashier flow:

```text
Search
    ↓
Select Medicine
    ↓
Quantity
    ↓
Payment
    ↓
Print
    ↓
Next Customer
```

Avoid making users jump across unrelated menus.

## Guiding Principle

> **"Design around the pharmacist's workflow, not the database schema."**

A great Pharmacy ERP is not defined by the number of features it has, but by how quickly, reliably, and confidently a pharmacist can complete everyday tasks. Prioritize speed, clarity, resilience, and maintainability in every architectural decision.

## Related docs

- [Overview](./overview.md)
- [Early foundations](./early-foundations.md) — i18n, keyboard shortcuts
