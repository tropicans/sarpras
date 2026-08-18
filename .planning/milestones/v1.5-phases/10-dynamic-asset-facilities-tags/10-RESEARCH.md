# Phase 10: Dynamic Asset Facilities & Tags Management - Research

## Context & Objectives
In previous milestones (v1.0–v1.4), asset facility tags on public cards were statically hardcoded based on asset type in `src/components/public/asset-card.tsx` (`getVisualTheme().tags`). Administrators had no way to specify custom amenities or equipment for specific rooms, dormitories, vehicles, fields, or equipment (e.g., "Smart TV 75\"", "Soundcraft Mixer 16Ch", "Kulkas Mini").

Milestone v1.5 Phase 10 introduces dynamic management of facility tags stored in PostgreSQL via Drizzle ORM, with full CRUD support in server functions, an interactive tag management UI in the admin console with category suggestions, dynamic rendering across public asset cards, schedule modals, and booking forms, and fallback defaults when an asset has no custom tags specified.

## Schema Architecture & Migration
- **Table**: `assets`
- **New Column**: `facilities` (`jsonb`, nullable, typing: `string[] | null`)
- **Migration Strategy**:
  - Add idempotent column migration to `src/db/migrate.ts`:
    ```sql
    ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "facilities" jsonb;
    ```
  - Drizzle schema in `src/db/schema.ts`:
    ```ts
    facilities: jsonb("facilities").$type<string[]>(),
    ```

## Default Category Presets & Helpers
To ensure maintainability and DRY principles across client and server:
- Create `src/lib/assets/facilities.ts` (or extend `src/lib/booking/types.ts`):
  - `CATEGORY_FACILITY_PRESETS: Record<AssetType, string[]>`
    - `room`: `["Hybrid Video", "Proyektor 4K", "Wi-Fi 6", "Sound System", "Papan Tulis", "Podium"]`
    - `dormitory`: `["Twin/Single Bed", "AC & Water Heater", "Full Meja Kerja", "Lemari Pakaian", "Wi-Fi"]`
    - `vehicle`: `["Pengemudi Dinas", "AC Dingin", "Asuransi Perjalanan", "Kapasitas Bagasi", "Audio Bluetooth"]`
    - `field`: `["Pencahayaan LED", "Sound Portable", "Outdoor Siap", "Tribun Penonton", "Garis Standar"]`
    - `equipment`: `["Kondisi Prima", "Terawat", "Teknisi Siap", "Kabel Ekstensi", "Hard Case"]`
  - `getAssetFacilities(asset: { type: string; facilities?: string[] | null }): string[]`:
    - Returns `asset.facilities` if non-empty array of valid strings; otherwise returns category default preset.
  - `sanitizeFacilities(input: unknown): string[]`:
    - Trims strings, filters out empty/duplicate values, limits tag length (e.g., max 30 chars per tag, max 15 tags per asset).

## Server Functions
- `saveAssetFn` in `src/lib/assets/assets.functions.ts`:
  - Validates `facilities?: string[] | null`.
  - Sanitizes and stores array of strings in PostgreSQL `assets.facilities`.
  - Records updated/created facilities in audit log metadata.
- `getAssetsListFn` in `src/lib/assets/assets.functions.ts`:
  - Returns `facilities` for each asset.
- `getPublicAssetsListFn` & `getPublicAssetByIdFn` in `src/lib/booking/public-fns.functions.ts`:
  - Includes `facilities: assets.facilities` in selection objects.

## UI Implementation
1. **Admin Asset Management (`src/routes/admin/assets.tsx`)**:
   - Add state `formFacilities: string[]` and `newTagInput: string`.
   - Display active tag badges with removal `x` button.
   - Quick-add chip suggestions based on `formType` (`CATEGORY_FACILITY_PRESETS[formType]`). Clicking an unselected suggestion adds it immediately.
   - Custom tag text input with Enter key / "+" button to add custom tags.
   - Update table view or detail view to display tags if helpful.
2. **Public Discovery Cards (`src/components/public/asset-card.tsx`)**:
   - Use `getAssetFacilities(asset)` to render facility badge chips dynamically.
   - Fall back smoothly to category presets if `facilities` is null/empty.
3. **Schedule Modal (`src/components/public/schedule-modal.tsx`)**:
   - Display asset facility badges in header/info section of modal.
4. **Booking Wizard (`src/routes/book/$assetId.tsx`)**:
   - Render facility badge tags in the top Asset Header Info Card.

## Validation Strategy
- Automated unit tests in `src/lib/assets/facilities.test.ts`:
  - Tests `sanitizeFacilities` (empty removal, trim, deduplication).
  - Tests `getAssetFacilities` fallback behavior for all asset types.
- Automated migration/integration tests in `src/db/migration.test.ts`:
  - Tests saving assets with custom `facilities: string[]` and retrieving them via Drizzle query.
