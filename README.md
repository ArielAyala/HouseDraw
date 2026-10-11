# HouseDraw

Browser floor-plan editor with real metric units. Frontend only. No accounts.

Dark theme by default. Plans will save as local `.housedraw.json` files (phase 09).

## Status

See `AGENTS.md`. Current work is tracked there so coding agents do not reload the whole product each session.

## Setup

```bash
pnpm install
pnpm dev
```

```bash
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
```

## Docs

- `specs/product.md` — what we are building
- `specs/architecture.md` — how it is structured
- `specs/phases/` — one spec per implementation slice
