# Phase 0 / Dashboard Stage A Audit

## Inspected
- `app/dashboard/page.tsx`
- `components/dashboard/live-dashboard.tsx`
- `components/dashboard/dashboard.tsx`
- `components/layout/app-shell.tsx`
- `convex/examAccess.ts`
- `convex/lib/auth.ts`
- `convex/aiGateway.ts`

## Confirmed
- Existing routes and Convex-backed dashboard are preserved.
- Sidebar has responsive desktop and mobile drawer behavior.
- AI quota is server-side controlled through the AI gateway.

## Gaps found
1. Dashboard shows an unsupported pass probability and inventory metrics; Stage C/D must replace these with transparent readiness and personal metrics.
2. Ask CivilMind AI and a persistent Copilot launcher are absent from the dashboard shell.
3. Sidebar does not use the specified grouped information architecture.
4. `examAccess.listMyEligibleArchive` currently applies Premium access to official archive retrieval. This conflicts with the public-access rule and is the first Phase 1 source-access fix.
5. Descriptive guides are modeled distinctly, but the UI/data import must continue linking them separately by session and qualification.
6. Exact question/page citations are partially modeled; extraction is pending.

## Acceptance criteria prepared
- Guests and free users can access official source files, keys, descriptive guides and free discipline/qualification filtering.
- Premium locks only AI capability keys.
- `View official source` resolves to a verified direct document or nearest exact source anchor.
- Answer keys and descriptive guides render as distinct document types.

## Stage A implementation
- Added a centralized typed capability registry at `lib/access/capabilities.ts`.
- No visible dashboard layout was changed in Stage A; visual work begins in Stage B.
