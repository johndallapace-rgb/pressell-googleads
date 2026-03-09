# System Flow Map
Generated: 2026-03-09T00:28:51.464Z

## Core Data Flows

### 1. Product Creation (Canonical Save)
All creation entry points (Manual, Auto-Pilot, Scale) converge to a single persistence layer.
- **Function**: `saveProduct(product, source)` in `src/lib/config.ts`
- **Persistence**: 
  - Writes `<vertical>:<slug>` (Primary)
  - Writes `<slug>` (Canonical Fallback)
  - Updates `campaign_config` (Index)
- **Safety**: Uses distributed locking (`lock:save:...`) to prevent race conditions.

### 2. Public Resolution & Self-Healing
- **Route**: `src/app/[...slug]/page.tsx`
- **Logic**:
  1. Detects vertical via Host/Subdomain
  2. Tries KV lookup (Primary -> Canonical -> Index)
  3. If found but canonical keys missing -> **Triggers Self-Heal**
  4. Renders template (Editorial, Story, etc.)

### 3. Admin & Diagnostics
- **Dashboard**: Lists products from `campaign_config` index.
- **Checker**: `check-links` API pings public URLs.
- **Repair**: `cleanup` API scans index and ensures canonical keys exist.

### 4. AI Ads Optimization (Planned)
- **Module**: `src/lib/ads-ai/index.ts`
- **Status**: Architecture Ready / Logic Disabled
- **Entry Point**: Admin -> Ads Performance Manager -> "Analyze Performance" (Coming Soon)

## Entry Points Map

| Feature | Entry Route | Logic Handler | Save Source |
| :--- | :--- | :--- | :--- |
| **Market Trends** | `/admin/trends` | `auto-create/route.ts` | 'Auto-Pilot' |
| **New Pre-Sell** | `/admin/products/new` | `products/route.ts` | 'Manual-Create' |
| **Edit Product** | `/admin/products/[slug]` | `products/save/route.ts` | 'Admin-Save' |
| **Global Scale** | `/admin/scale` | `scale/route.ts` | 'Global-Scale' |
| **Repair Keys** | `/admin/products` | `cleanup/route.ts` | 'Admin-Repair-All' |

## Debugging Guide

- **404 on Public URL**: Check `logs/*-public-route.log` and `logs/*-self-heal.log`.
- **Save Failed**: Check `logs/*-save-product.log` for lock contention or KV errors.
- **Checker Mismatch**: Run "Repair Keys" in Admin to sync Index with KV.
