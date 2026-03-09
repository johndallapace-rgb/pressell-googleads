# Multi Presell Variants Specification

## Overview
Implement a "Multi Presell Variants" system to allow creating, testing, and optimizing multiple landing page variations for a single keyword/product. This enables A/B testing, semantic targeting (e.g., "results" vs "side effects"), and automatic traffic optimization.

## Architecture

### 1. Data Model (`src/lib/config.ts`)
Extend `ProductConfig` to support a parent-child variant relationship.

```typescript
export type VariantConfig = {
  slug: string; // The slug of the variant page
  weight: number; // Traffic distribution weight (0-100)
  clicks: number; // Tracked clicks (simple counter)
  conversions: number; // Tracked conversions
  is_winner?: boolean; // If true, receives majority traffic
};

export type ProductConfig = {
  // ... existing fields ...
  
  // New Fields
  is_variant?: boolean; // True if this is a child variant
  parent_slug?: string; // Reference to parent if variant
  
  variants?: VariantConfig[]; // List of variants (only on parent)
  
  // SEO Safe Mode
  noindex?: boolean; 
  canonical_url?: string;
};
```

### 2. Traffic Distribution & Routing (`src/app/[...slug]/page.tsx`)
- **Parent Page Logic**:
  - Upon request to a Parent Product with `variants`:
  - Execute **Traffic Split Logic**:
    - Check for "Winner" (Auto-Scale).
    - If no winner, use Weighted Random Distribution.
  - **Action**: Perform a `307 Temporary Redirect` to the selected variant's URL.
  - **Query Params**: Preserve tracking parameters (UTM, gclid, etc.) during redirect.

- **Variant Page Logic**:
  - Renders as a normal product page.
  - Injects `<link rel="canonical" href="PARENT_URL" />` (SEO Safe Mode).
  - Injects `<meta name="robots" content="noindex" />` (if enabled).

### 3. Admin Interface (`src/components/ProductForm.tsx`)
- **New Section: "Presell Variants"** (Only visible on Parent products).
- **Variant List**:
  - Table showing: Slug, Traffic %, Clicks, Conversions, CR%, Status.
  - Actions: Edit, Delete, "Make Winner".
- **Add Variant**:
  - Manual: Clone parent, define new Slug/Headline/Template.
  - **AI Generator**: Button to auto-create 3-5 variants based on intents (Results, Safety, Social Proof).

### 4. AI Generation
- **Prompt Engineering**:
  - Input: Product Name, Main Keyword/Vertical.
  - Output: List of variants with `slug` (semantic), `headline` (hook), and `template` suggestion.
  - Example Intents:
    - "The Truth About [Product]" (Story)
    - "[Product] Side Effects?" (Editorial)
    - "[Product] vs [Competitor]" (Comparison)

### 5. Analytics & Auto-Scale
- **Tracking**:
  - Increment `clicks` on Redirect (Parent -> Variant).
  - Increment `conversions` on "Get Offer" click in Variant.
- **Auto-Winner Logic** (Optional/Manual for V1, or simple threshold):
  - "Auto Select Winner" toggle.
  - If `conversions > Threshold` and `CR` is statistically significant, set `is_winner = true`.

## Implementation Steps

### Phase 1: Database & Types
1.  Update `ProductConfig` in `src/lib/config.ts`.
2.  Update `saveProduct` logic to handle variant metadata (parent link).

### Phase 2: Admin UI
1.  Modify `ProductForm.tsx` to include the "Presell Variants" section.
2.  Implement "Add Variant" (Cloning logic).
3.  Implement "Generate Variants with AI" (Client-side call to Gemini).

### Phase 3: Routing & Distribution
1.  Update `src/app/[...slug]/page.tsx`.
2.  Add `selectVariant(product)` helper function.
3.  Implement Redirect logic with param preservation.

### Phase 4: Tracking & SEO
1.  Update `LayoutShell` or `generateMetadata` to handle `noindex` and `canonical`.
2.  Ensure `TrackingManager` works for variants.

## Risk Assessment
- **Recursion**: Ensure a Variant cannot have variants (depth 1).
- **SEO**: Incorrect canonicals could hurt ranking. Verification required.
- **Performance**: KV writes for metrics need to be non-blocking or batched (for V1, maybe just config updates or separate metrics key). *Decision: Keep metrics simple in config for V1, or use `campaign_metrics` key.*
