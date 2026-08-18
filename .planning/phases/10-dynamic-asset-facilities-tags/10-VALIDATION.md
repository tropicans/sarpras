# Phase 10: Dynamic Asset Facilities & Tags Management - Validation Strategy

## Verification Matrix

| Requirement | Description | Test File / Verification Method | Criteria |
|---|---|---|---|
| **ASSET-FAC-01** | Database schema & migration for `facilities: jsonb` | `src/db/migration.test.ts` & `src/db/migrate.ts` | Column exists, persists arrays of strings, supports null/empty values |
| **ASSET-FAC-02** | Server functions CRUD validation & persistence | `src/lib/assets/facilities.test.ts` & `src/lib/booking/admin.test.ts` | `saveAssetFn`, `getAssetsListFn`, `getPublicAssetsListFn` persist and return sanitized facilities |
| **ASSET-FAC-03** | Admin form UI for tags & category suggestions | Visual inspection & component testing | Operator can click preset chips, add custom tags, delete tags, and save |
| **PUBLIC-CARD-01** | Public asset cards render dynamic facilities | Visual inspection & component verification | Custom tags from database display on asset cards |
| **PUBLIC-CARD-02** | Fallback to category defaults when empty | `src/lib/assets/facilities.test.ts` & Visual inspection | Assets with no custom tags display standard category presets |
| **PUBLIC-CARD-03** | Facility tags on Schedule Modal & Booking Page | Visual inspection & component verification | Schedule modal and booking header display facility badges |

## Automated Test Suites
1. `src/lib/assets/facilities.test.ts`:
   - Validates sanitization: trimming whitespace, deduplication, length limiting, non-string filtering.
   - Validates fallback resolution: returns custom tags if present, otherwise returns category default tags.
2. `src/db/migration.test.ts`:
   - Validates database round-trip for assets with custom `facilities` JSONB column.
