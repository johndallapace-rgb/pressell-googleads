# AI Architect Report
Generated: 2026-03-08T23:11:55.262Z

## System Overview
- **Project**: Pressell Google Ads
- **Framework**: Next.js (App Router)
- **Database**: Vercel KV (Redis)
- **State Strategy**: Dual-Write (Canonical + Prefixed Keys)
- **Observability**: Local Structured Logging (JSON Lines)

## Major Modules
1. **Product Management**: 
   - CRUD via Admin Dashboard
   - Dual-write persistence in `src/lib/config.ts`
   - Fallback resolution in `src/app/[...slug]/page.tsx`
   
2. **Google Ads Integration**:
   - Ads Manager & Performance Dashboard
   - AI Optimization Architecture (Placeholder) in `src/lib/ads-ai`
   
3. **Diagnostics & Self-Healing**:
   - Admin Checker (`check-links`)
   - Automatic Self-Heal on Public Access
   - Manual Repair via Admin

## Architectural Risks
- **Concurrency**: High write contention on popular products (Mitigated by Distributed Locks).
- **Edge Consistency**: Vercel KV eventual consistency might lag (Mitigated by 'revalidate=0' and direct KV calls).
- **File System Usage**: Local logging relies on Node.js runtime; Edge functions cannot write logs (Mitigated by runtime detection).

## Future Extension Points
- **AI Ads Optimization**: Logic prepared in `src/lib/ads-ai`.
- **Global Scaling**: Multi-language variants via `src/lib/host.ts`.
