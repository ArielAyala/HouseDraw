# HouseDraw

HouseDraw is a browser-based floor-plan editor for creating practical house plans with real metric dimensions. It is designed to be approachable for people who are not architects.

**Try HouseDraw:** [house-draw.arielayala.me](https://house-draw.arielayala.me/)

HouseDraw is a frontend-only project: there are no accounts or cloud storage. Your work is autosaved in your browser for recovery, and you can open and save plan files on your device.

## Features

- Draw, select, move, and edit walls on a zoomable, pannable canvas with grid snapping.
- Work in real metric units; enter lengths in meters, centimeters, or millimeters.
- Automatically detect enclosed rooms, rename them, and view their areas and dimensions.
- Add doors and windows to walls, and place, rotate, and remove furniture and fixture stamps from the catalog.
- Inspect a generated 3D preview of the plan. It is read-only and is not an editable 3D model.
- Undo and redo edits.
- Open and save `.housedraw.json` plan files, export a PNG, and recover recent work with browser autosave.
- Use the interface in English or Spanish, with dark and light themes.

## Getting started

### Use the deployed app

Open [house-draw.arielayala.me](https://house-draw.arielayala.me/) in your browser. No account or installation is needed.

### Run locally

Requirements: Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Vite prints the local development URL when the server starts.

## Basic controls

Choose a tool from the toolbar, then draw or edit on the canvas. Use the catalog to select a stamp and place it on the plan. Drag the toolbar grip to reposition the toolbar.

| Action | Shortcut |
| --- | --- |
| Select | `V` |
| Draw walls | `W` |
| Pan | `H` or hold `Space` |
| Save plan | `Ctrl+S` / `⌘S` |
| Open plan | `Ctrl+O` / `⌘O` |
| Undo / redo | `Ctrl+Z` / `⌘Z`; redo with `Ctrl+Shift+Z`, `Ctrl+Y`, or the equivalent Mac shortcut |

## Development checks

```bash
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
```

## Project documentation

- [`specs/product.md`](specs/product.md) — product goals and scope
- [`specs/architecture.md`](specs/architecture.md) — project structure and technical architecture
- [`specs/phases/`](specs/phases/) — implementation specifications
