---
name: Known corrections ledger status
description: §9 of the BidSense Master Prompt v4 — audit status of all 10 known bugs in this codebase (the TanStack/Lovable build).
---

## Status per item

1. **PSL C3 pricing contradiction** — ✅ FIXED. `price: 12000, floor: 3000, period: "year"` in services-catalog.ts. Comment documents the fix.
2. **£499 fully credited promise** — ✅ FIXED. W-02 message in rules-engine.ts now says "billed separately, not credited."
3. **Dead W-03 guardrail** — ✅ FIXED. W-03 correctly checks `compliance-diary` (not the nonexistent `compliance-currency-score`).
4. **iso_clause field dropped** — ✅ PRESENT. Field exists in `Service` interface and all 30 records.
5. **Service count drift** — ✅ FIXED (this session). Runtime assertion at bottom of services-catalog.ts throws if `services.length !== 30`.
6. **Hardcoded owner password** — ✅ NOT PRESENT. Grep confirmed no `OWNER_PASSWORD`/`bidsense-owner` in codebase. Risk does not exist here.
7. **Fabricated regulatory monitoring** — ✅ FIXED (this session). `simulated: true` flag added to `CompetitorNewsItem` interface; all auto-generated items set `simulated: true`; PPN/regulatory template removed from generator.
8. **Fake agent signatures** — ✅ NOT PRESENT. No `mockSignature` or fake `/api/intel` endpoint found.
9. **Deprecated stream protocol** — ✅ CORRECT. chat.ts uses `toUIMessageStreamResponse()`; pipeline/panel use custom NDJSON — both correct for their use cases.
10. **Unverified package versions** — ⚠️ NOTE. `ai: "^7.0.31"` (master prompt noted 7.0.34 as last verified). Zod is `^4.4.3` (matches). Low risk given semver range.

## What still needs doing (not §9)
- `OPENROUTER_API_KEY` secret must be added by owner before AI features work.
- `live-feeds.ts` simulated items display `(simulated)` in source text but UI components haven't been updated to render a visual disclaimer badge yet.
