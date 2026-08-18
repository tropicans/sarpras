# Milestone v1.5 Requirements: Dynamic Asset Facilities & Tags

## Overview
Enable dynamic management and public display of asset facilities and tags, transitioning from hardcoded category strings to operator-configurable badges per asset with graceful fallbacks.

## Functional Requirements

### Asset Facilities Data & Management (ASSET-FAC)
- [ ] **ASSET-FAC-01**: Database schema & migration supports storing an array of custom facilities/tags per asset (`facilities: jsonb` or `text[]`).
- [ ] **ASSET-FAC-02**: Asset CRUD server functions (`saveAssetFn`, `getAssetsListFn`, `public-fns`) validate, persist, and retrieve custom facilities/tags.
- [ ] **ASSET-FAC-03**: Admin asset management form provides UI to add, edit, and remove tags with category-based suggestions and custom badge creation.

### Public Discovery & Display (PUBLIC-CARD)
- [ ] **PUBLIC-CARD-01**: Public discovery asset cards display dynamic facility tags saved in the database.
- [ ] **PUBLIC-CARD-02**: Public discovery asset cards gracefully fall back to sensible category presets when tags are empty or undefined.
- [ ] **PUBLIC-CARD-03**: Asset schedule modal and booking page surfaces asset-specific facility badges.

## Future Requirements (Deferred)
- **FAC-FUTURE-01**: Facility icon picker per tag (e.g. WiFi icon, AC icon, Projector icon).
- **FAC-FUTURE-02**: Filter public asset discovery list by specific facility tag.

## Out of Scope
- Uploading photos/media per facility item (tags remain text badges).

## Traceability Matrix

| Requirement | Phase | Status |
|---|---|---|
| ASSET-FAC-01 | Phase 10 | Pending |
| ASSET-FAC-02 | Phase 10 | Pending |
| ASSET-FAC-03 | Phase 10 | Pending |
| PUBLIC-CARD-01 | Phase 10 | Pending |
| PUBLIC-CARD-02 | Phase 10 | Pending |
| PUBLIC-CARD-03 | Phase 10 | Pending |
