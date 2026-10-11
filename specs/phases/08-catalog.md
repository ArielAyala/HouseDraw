# Phase 08 — Furniture catalog

## Goal

Stamp simple top-down items with real default sizes.

## Categories

| Group | Items (minimum) | Typical size |
| --- | --- | --- |
| Bathroom | toilet, sink, shower, bathtub | 400×700, 600×450, 800×800, 700×1700 mm |
| Kitchen | sink, stove, fridge, counter | ~600 mm deep |
| Living | sofa, table, chair, tv | realistic footprints |
| Bedroom | single bed, double bed, nightstand, wardrobe | 900×2000, 1600×2000 mm |
| Garden | grass fill, tree, fence segment | simple |

## In scope

- Side catalog; click or drag onto canvas
- Move, rotate 90°, delete
- Show size in the inspector
- SVG (or canvas) top-down symbols, not photos

## Out of scope

3D meshes, vendor catalogs, free scale unless cheap and clearly labeled.

## Acceptance

- Dropping a double bed creates an item ~1600×2000 mm
- Catalog data is data, not hardcoded in the renderer
