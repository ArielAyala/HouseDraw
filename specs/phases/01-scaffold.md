# Phase 01 — Scaffold

## Goal

Runnable Vite + React + TypeScript app with dark-default theme, agent docs, and phase specs. No floor-plan canvas yet.

## In scope

- Project tooling: pnpm, Vite, React 19, TypeScript strict, Biome, Vitest
- `AGENTS.md`, `specs/*`
- App shell: full-viewport layout, brand, theme toggle
- Theme persisted in `localStorage` (`housedraw.theme`), default `dark`
- Avoid flash of wrong theme on load
- Path alias `@/` → `src/`

## Out of scope

Canvas, camera, document store, walls, furniture, file I/O, 3D.

## Acceptance

- `pnpm dev` shows HouseDraw chrome on a dark background
- Theme toggle switches dark/light and survives reload
- `pnpm test:run`, `pnpm lint`, and `pnpm typecheck` pass
- Boilerplate Vite marketing page is gone
