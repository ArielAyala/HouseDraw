# Phase 04 — Wall tool

## Goal

Draw walls with real lengths, orthogonal by default, snap, live dimension label.

## In scope

- Tool `wall` (shortcut `W` can wait until phase 10 if needed; pointer flow cannot)
- Click-click segments; thickness default 150 mm
- Orthogonal constraint on by default; Shift = free angle
- Snap to grid, wall endpoints, and perpendiculars
- Live length label while drawing (`3.20 m`)
- Parse length input `3.5m`, `350cm`, and meters as the default unit for typed lengths
- Selected wall shows its length

## Out of scope

Doors/windows, rooms, select-move of other entity types.

## Acceptance

- A 4 m horizontal wall stores `a`/`b` 4000 mm apart
- Tests for snap, length parse, and orthogonal lock
