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

- Language: English for code, comments, commits, specs, and this file. UI copy is available in English and Spanish (react-i18next, dictionaries in `src/i18n/`). Default is English.
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
src/view3d/       # generated 3D preview, read-only (from phase 11)
specs/            # product, architecture, phase specs
```

## Agent rules

1. Implement **one phase at a time**. The phase spec is the contract.
2. Do not start 3D until the 2D editor (phases 01–10) is done.
3. After finishing work, **update the Status section below** so it matches reality.
4. If Status and the repo disagree, believe the repo and fix Status.
5. Do not re-explain the whole product in a later prompt’s output; point at specs.

## Status

- Phase: **11-3d-preview (done). All phases 01–11 are complete.**
- i18n: UI is bilingual (English default, Spanish). `react-i18next` with dictionaries in `src/i18n/en.ts` and `es.ts` (`es` is typed as `typeof en`, so keys stay in sync). The EN/ES button in the topbar (next to the theme toggle) saves the choice in `localStorage` key `housedraw.language`. Numbers use the active locale (`1,5 m` in Spanish). Catalog names come from `catalog.items.<id>`. Rooms with no name store an empty label; the default name ("Room"/"Habitación") is shown at render time, so it follows the language. Files are unchanged. Error messages from file validation (`documentFile.ts`) and browser errors are still English. Lint, typecheck and 155 tests pass.
- Done: 01-scaffold, 02-canvas-camera, 03-document-store, 04-wall-tool, 05-select-edit, 06-rooms, 07-openings, 08-catalog, 09-file-io, 10-ui-polish, 11-3d-preview
- 11-3d-preview: `src/view3d/`. `model.ts` is pure: it extrudes walls to 2400 mm, splits them around openings (door void with lintel, window void with sill and lintel), and turns items into 900 mm boxes. Plan (x, y) maps to three.js (x, z), and height is y. `Preview3D.tsx` uses React Three Fiber and drei `OrbitControls`. It is loaded with `lazy` and shown when `viewMode === 'model'` (toggle button in the topbar, `src/tools/editor.ts`). It reads the document and never mutates it. Added deps: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`. Lint, typecheck, 152 tests and build pass. The 3D view was not checked visually in a browser.
- Next: none in `specs/phases/`. Ideas for later are in `specs/product.md` (multiple floors, PDF export, takeoffs).
- 10-ui-polish: toolbar has Pan, Select, Wall, Room, Door, Window, Stamp (`src/ui/Toolbar.tsx`, shortcut in each tooltip). Tool keys in `src/tools/shortcuts.ts`: `V` select, `W` wall, `H` pan (ignored while typing or with modifiers). Pan tool is `EditorTool 'pan'`, also reachable with Space. Empty state copy shows when there are no walls (`EmptyState` in `PlanCanvas.tsx`). Bottom bar shows zoom, grid, units and active tool. In Select mode, hovering a wall or item highlights it and shows a move cursor (`hover` state in `PlanCanvas.tsx`, `hoverWallId`/`hoverItemId` in `render.ts`). Theme toggle has a title. Lint, typecheck and 143 tests pass.
- 09-file-io: `src/file/`. `documentFile.ts` parses and serializes `.housedraw.json` with explicit validation, rejects unknown future `version` values, and has a `MIGRATIONS` table (empty while only v1 exists). `fileIO.ts` does Open/Save with the File System Access API and falls back to input/download. `autosave.ts` + `useAutosave.ts` write to `localStorage` key `housedraw.document` (debounced, flushed on `pagehide`). `main.tsx` restores it silently before first render. If the autosave cannot be read, it shows an alert and the next edit replaces it. `exportPng.ts` exports a fit-to-content PNG. Topbar buttons in `src/ui/FileActions.tsx`; Ctrl+S saves, Ctrl+O opens. `replaceDocument` in the store clears history. Lint, typecheck and 140 tests pass.

