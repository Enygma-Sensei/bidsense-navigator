---
name: AI provider swap
description: Multi-provider AI gateway. Lovable removed. Supports OpenRouter (×3 keys), Groq, Gemini — tried in order, automatic fallback.
---

## Rule
Use `getModel()` from `src/lib/ai-gateway.server.ts` in all AI routes. Never use the old `createAiProvider()(CHAT_MODEL)` pattern (kept as deprecated shim only).

## Why
Owner explicitly rejected Lovable and any single-provider lock-in. Gateway now tries each configured provider in order, so no manual switching is needed when a rate limit is hit.

## Supported secrets (all optional, at least one required)
| Secret name | Provider | Cost |
|---|---|---|
| OPENROUTER_API_KEY | OpenRouter key 1 | Free tier |
| OPENROUTER_API_KEY_2 | OpenRouter key 2 (auto-fallback) | Free tier |
| OPENROUTER_API_KEY_3 | OpenRouter key 3 (auto-fallback) | Free tier |
| GROQ_API_KEY | Groq (llama-3.3-70b-versatile) | Free tier |
| GEMINI_API_KEY | Google AI Studio (gemini-2.0-flash) | Free tier |

## How to add keys
All secrets added the same way — via Replit's `requestSecrets()` flow (shows a form in chat). "Secret" and "API key" are the same thing in Replit's UI.

## Where to get free keys
- OpenRouter: openrouter.ai → sign up → profile → Keys → Create Key (unlimited keys, no card)
- Groq: console.groq.com → sign up → API Keys (no card)
- Gemini: aistudio.google.com → Get API Key (no card)

## Model overrides (optional secrets)
OPENROUTER_MODEL, GROQ_MODEL, GEMINI_MODEL — change model without code change.

## How to apply
All three AI routes (chat.ts, panel.ts, pipeline.ts) call `getModel()` which returns the first working provider's model. If a 429 rate-limit is hit at runtime, add a new key or wait for the daily reset.
