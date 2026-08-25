# Localization

## Implemented

| Piece | Detail |
|-------|--------|
| Runtime i18n | `@ngx-translate/core` v18 |
| Default locale | `en-IN` via Angular `LOCALE_ID` |
| Translation files | `public/i18n/en.json` (login, shortcuts, common strings) |
| Convention | No hardcoded user-facing strings in components — use translation keys |

Backend dates and amounts use ISO/Decimal; display formatting is client-side.

## Configuration (not hardcoded)

- Default currency — `AppSetting` `DEFAULT_CURRENCY` (seed: `INR`)
- Tax rules — `Tax` master + `AppSetting` defaults
- Receipt prefix — per-branch `BRANCH_RECEIPT_PREFIX` in `AppSetting`

## Planned

- Additional language packs (`hi`, `mr`, etc.)
- Regional date/currency display per branch or company setting
- GST state-specific report labels
- RTL layout support (if required)

## Rules

- Add new UI strings to `public/i18n/en.json` (and future locale files) when building features
- Medicine names remain master data — not i18n keys
- Regulatory labels (Schedule H warnings) may need locale-specific templates on receipts

## Related

- [Early foundations — Angular client](../architecture/early-foundations.md#angular-client-layer)
- [Product UX](../architecture/product-ux.md)
