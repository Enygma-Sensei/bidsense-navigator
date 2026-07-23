# BidSense

UK public-sector tender intelligence dashboard for SMEs and PSL partners. Built with TanStack Start (SSR), React 19, TypeScript, Tailwind CSS v4, and shadcn/ui components.

## How to run

```sh
npm run dev   # starts the dev server on port 5000
```

The workflow **Start application** (`npm run dev`) is pre-configured and auto-starts.

## Stack

- **Framework**: TanStack Start (SSR/file-based routing via `@tanstack/react-start`)
- **UI**: React 19 + Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **State**: TanStack Query + Zustand
- **AI features**: Vercel AI SDK (`ai` package) — requires `LOVABLE_API_KEY` secret
- **Build tooling**: Vite 8 via `@lovable.dev/vite-tanstack-config`

## Environment variables / secrets

| Name | Required | Purpose |
|------|----------|---------|
| `SESSION_SECRET` | Yes | Session signing |
| `LOVABLE_API_KEY` | Yes (for AI features) | Powers AI chat, adversarial pipeline, and panel routes |

## Key routes

| Path | Description |
|------|-------------|
| `/` | Dashboard — compliance HUD |
| `/catalogue` | Service catalogue (30 services, ISO-mapped) |
| `/cart` | BYOB shopping cart with tiered pricing |
| `/simulator` | Operational profit simulator |
| `/pipeline` | Adversarial peer-review pipeline |
| `/panel` | Panel of experts |
| `/compliance` | ISO compliance HUD |
| `/chat` | AI chat interface |

## Notes

- The Lovable vite plugin normally forces port 8080; `vite.config.ts` overrides this to port 5000 for Replit.
- AI routes (`src/routes/api/chat.ts`, `panel.ts`, `pipeline.ts`) require `LOVABLE_API_KEY` — they will error gracefully without it.

## User preferences
