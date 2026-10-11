# Phase 07 — Doors and windows

## Goal

Place doors and windows on walls as openings with real widths.

## In scope

- Door default width 800 mm; window default 1200 mm (tweakable)
- Opening stored as `{ type, wallId, offsetMm, widthMm }`
- 2D: gap / swing hint on the wall
- Cannot place an opening that does not fit on the wall

## Out of scope

3D voids, door hardware, window frames as models.

## Acceptance

- Opening stays glued when the wall moves
- Tests for offset clamping
