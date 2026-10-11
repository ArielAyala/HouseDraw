# Phase 03 — Document store

## Goal

Single source of truth for the plan, with undo/redo, ready for tools to mutate.

## In scope

- Zustand store holding the versioned document (see `specs/architecture.md`)
- IDs as strings; walls/openings/items/labels as typed arrays
- Undo/redo stack (command or snapshot). Ctrl+Z / Ctrl+Y (Ctrl+Shift+Z)
- Empty document factory and a tiny fixture for tests
- Keep renderer reading from the store; still nothing to draw except the grid

## Out of scope

Persistence to disk (phase 09), wall tool UI.

## Acceptance

- Unit tests: create empty doc, apply a dummy mutation, undo, redo
- Store is the only mutable plan state
