# Multi Presell Variants Checklist

## 1. Database & Schema
- [ ] `ProductConfig` type updated with `variants` array.
- [ ] `ProductConfig` type updated with `is_variant`, `parent_slug`, `noindex`, `canonical_url`.
- [ ] `saveProduct` handles nested variants metadata correctly.

## 2. Admin UI
- [ ] "Presell Variants" section appears in Edit Product.
- [ ] Section is hidden for Variant products (to avoid recursion).
- [ ] "Add Variant" button creates a new product clone with correct parent link.
- [ ] "Generate Variants with AI" creates semantic variants (e.g., "results", "safety").
- [ ] Variant List shows Traffic % and basic stats.

## 3. Routing & Traffic
- [ ] Accessing Parent URL redirects to Variant URL (if variants exist).
- [ ] Redirect is 307 Temporary.
- [ ] Query parameters (UTM, etc.) are preserved across redirect.
- [ ] "Winner" variant receives 100% traffic (or configured high %).
- [ ] Direct access to Variant URL works.

## 4. SEO & Safety
- [ ] Variant page has `<link rel="canonical" href="PARENT_URL" />`.
- [ ] Variant page has `<meta name="robots" content="noindex" />` (if configured).
- [ ] Parent page does NOT redirect if no variants are active.

## 5. Analytics
- [ ] Clicks on Parent URL are tracked (optional, or tracked via redirect logs).
- [ ] Conversions on Variant URL are attributed to the Variant Slug.
