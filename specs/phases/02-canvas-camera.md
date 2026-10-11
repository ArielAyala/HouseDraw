# Phase 02 — Canvas and camera

## Goal

A full-area 2D canvas with a metric grid, pan, and zoom. Empty document (no walls yet).

## In scope

- HTML canvas filling the stage under the top bar
- World units in millimeters; origin somewhere sensible (e.g. centered)
- Grid: minor every 100 mm, major every 1000 mm (fade/skip lines when zoomed out)
- Pan: space+drag, middle-mouse drag
- Zoom: wheel toward cursor; clamp to a usable range
- Status readout: zoom percent and current grid step in m/cm
- Cursor: grab/grabbing while panning

## Out of scope

Drawing walls, hit-testing entities, undo, stamps.

## Acceptance

- Grid looks even in world space (not screen-pixel squares that ignore zoom)
- Zooming on a grid intersection keeps that world point under the cursor
- No walls or furniture
