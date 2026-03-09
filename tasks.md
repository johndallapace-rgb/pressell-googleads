# Implementation Tasks: Multi Presell Variants

- [ ] **Phase 1: Database & Types**
  - [ ] Update `src/lib/config.ts`: Add `VariantConfig` type and extend `ProductConfig` with `variants`, `is_variant`, `parent_slug`, `noindex`, `canonical_url`.
  - [ ] Update `saveProduct` in `src/lib/config.ts`: Ensure new fields are persisted correctly.

- [ ] **Phase 2: Admin UI**
  - [ ] Update `src/components/ProductForm.tsx`: Add "Presell Variants" section (only if `!is_variant`).
  - [ ] Implement "Variant List" table in `ProductForm.tsx`.
  - [ ] Implement "Add Variant" button logic:
    - [ ] Clone current form state.
    - [ ] Reset specific fields (slug, headline).
    - [ ] Set `parent_slug` and `is_variant`.
    - [ ] Save as new product.
    - [ ] Update parent's `variants` list.
  - [ ] Implement "Generate Variants with AI" button:
    - [ ] Create API route `src/app/api/admin/ai/generate-variants/route.ts` (or reuse generic).
    - [ ] Call AI to get variant suggestions.
    - [ ] Batch create variants.

- [ ] **Phase 3: Routing & Distribution**
  - [ ] Create `src/lib/traffic-distributor.ts`:
    - [ ] `selectVariant(product: ProductConfig): string | null` (returns redirect slug).
    - [ ] Implement weighted random logic.
    - [ ] Check for `is_winner`.
  - [ ] Update `src/app/[...slug]/page.tsx`:
    - [ ] In `CatchAllProductPage`, check if `product.variants` exists and has items.
    - [ ] If yes, call `selectVariant`.
    - [ ] If redirect slug returned, perform `redirect()` with query params.
    - [ ] If no redirect (or if this IS a variant page), render normally.

- [ ] **Phase 4: Tracking & SEO**
  - [ ] Update `src/components/LayoutShell.tsx` or `src/lib/seo.ts`:
    - [ ] Inject `<meta name="robots" content="noindex" />` if `product.noindex`.
    - [ ] Inject `<link rel="canonical" ... />` if `product.canonical_url`.
  - [ ] Verify `TrackingManager` captures variant context (maybe via `slug` which is already unique).

- [ ] **Phase 5: Verification**
  - [ ] Test creating a variant manually.
  - [ ] Test AI generation.
  - [ ] Test traffic redirection (hit parent URL multiple times).
  - [ ] Test SEO tags on variant page.
