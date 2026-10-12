# HouseDraw — agent instructions

Frontend-only floor-plan editor (Excalidraw-like UI, real metric units).
No accounts. Progress is saved as local files (phase 09) plus localStorage recovery.

This file is the always-on map. Do **not** dump full product design here.
Read `specs/product.md` and `specs/architecture.md` when you need the bigger picture.
Read **only** the current phase spec under `specs/phases/` before writing code.

## Commands

```bash
pnpm dev
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm lint:fix` to apply Biome fixes. Do not add a second linter.

## Conventions

- Language: English for code, comments, commits, specs, and this file. UI copy is English in V1.
- TypeScript `strict` + `noUncheckedIndexedAccess`. No `any`. No enums (`erasableSyntaxOnly`).
- Internal geometry uses **integer millimeters**. UI shows meters/centimeters.
- Keep `document` (state) separate from `tools` (input) and `canvas` (render).
- Prefer pure functions for geometry, snap, and unit parsing.
- CSS variables for theme. Dark is default. No heavy UI kit.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Layout

```
src/app/          # shell, theme
src/canvas/       # camera, grid, renderer (from phase 02)
src/tools/        # wall, select, pan, … (from phase 04)
src/document/     # types, store, undo (from phase 03)
src/catalog/      # furniture stamps (from phase 08)
src/ui/           # toolbars, panels
src/file/         # open/save/export (from phase 09)
specs/            # product, architecture, phase specs
```

## Agent rules

1. Implement **one phase at a time**. The phase spec is the contract.
2. Do not start 3D until the 2D editor (phases 01–10) is done.
3. After finishing work, **update the Status section below** so it matches reality.
4. If Status and the repo disagree, believe the repo and fix Status.
5. Do not re-explain the whole product in a later prompt’s output; point at specs.

## Status

- Phase: **06-rooms (implemented, unverified)**
- Done: 01-scaffold, 02-canvas-camera, 03-document-store, 04-wall-tool, 05-select-edit
- 06-rooms: code and tests written; lint, typecheck and tests have NOT been run (Node/pnpm not available in the agent shell)
- Next: run `pnpm lint:fix`, `pnpm typecheck`, `pnpm test:run`; fix any failures, then mark 06 done and start 07
- 3D: blocked until the 2D editor is complete
