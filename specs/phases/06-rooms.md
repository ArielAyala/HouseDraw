# Phase 06 — Rooms

## Goal

Create a rectangular room in one gesture; show name and area.

## In scope

- Rectangle-room tool: drag or two clicks → four walls
- Closed wall loops detected as rooms (at least rectangles; polygons if cheap)
- Label + area in m²
- Default names (`Room`, user-editable)

## Out of scope

Automatic furniture layout, 3D volumes.

## Acceptance

- A 4 m × 5 m rectangle reports 20.00 m²
- Tests for area from a closed loop
