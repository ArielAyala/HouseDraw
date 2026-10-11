# Architecture

## Stack

- Vite 8, React 19, TypeScript (strict)
- pnpm
- Biome (lint + format)
- Vitest + jsdom for domain tests
- Zustand from phase 03 (document store)
- React Three Fiber only in phase 11+
- No UI component library. Lucide for toolbar icons.

## Units

- World coordinates: **integer millimeters**
- Display: meters when ≥ 1 m, otherwise centimeters
- Parse user input such as `3.5m`, `350cm`, `3500` (bare number = mm in internals, UI may treat bare numbers as meters — decide in the wall-tool spec and keep it consistent)

## Document (file format, from phase 03)

Versioned JSON, e.g. `.housedraw.json`:

```json
{
  "version": 1,
  "unit": "mm",
  "settings": { "gridMm": 100, "wallThicknessMm": 150, "theme": "dark" },
  "walls": [],
  "openings": [],
  "items": [],
  "labels": []
}
```

The canvas renders this document. Tools mutate it. The 3D view will read the same document later.

## Layers

| Layer | Owns |
| --- | --- |
| `document` | Types, store, undo/redo |
| `tools` | Pointer input, snapping policy |
| `canvas` | Camera, grid, hit-test, 2D draw |
| `catalog` | Stamp definitions and SVG |
| `file` | Open, save, autosave, PNG export |
| `app` / `ui` | Shell, theme, chrome |

Do not put geometry math inside React components.

## Theme

`data-theme="dark" | "light"` on `<html>`. CSS variables in `src/index.css`.
Default dark. Persist `housedraw.theme` in `localStorage`.
