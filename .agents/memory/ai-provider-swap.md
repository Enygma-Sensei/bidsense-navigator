---
name: AI provider swap
description: Lovable AI Gateway removed; replaced with OpenRouter. Covers why, what changed, and how to configure.
---

## Rule
Use `createAiProvider()` from `src/lib/ai-gateway.server.ts` — never use the old `createLovableAiGatewayProvider`.

## Why
Owner explicitly rejected Lovable API key lock-in. OpenRouter is provider-agnostic, has free-tier models, uses `@ai-sdk/openai-compatible` (already installed — no new package needed), and requires no monthly minimum.

## Configuration
- Secret: `OPENROUTER_API_KEY` (Replit Secrets → Settings → Secrets)
- Model override: `OPENROUTER_MODEL` env var (optional; defaults to `google/gemini-2.0-flash-exp:free`)
- Base URL: `https://openrouter.ai/api/v1`
- Required attribution headers: `HTTP-Referer: https://bidsense.ai`, `X-Title: BidSense`

## How to apply
All three AI routes (`src/routes/api/chat.ts`, `panel.ts`, `pipeline.ts`) call `createAiProvider()` and pass `provider(CHAT_MODEL)` to `streamText`. If the key is missing, `createAiProvider()` throws a clear error — no silent fallback.
