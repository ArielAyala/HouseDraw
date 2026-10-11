# Product

HouseDraw is a browser floor-plan editor for people who are not architects.
The UI is as quiet as Excalidraw. Measurements are real (meters and centimeters).

## Goals

- Draw a house plan in 2D with true proportions.
- Place simple furniture/fixture stamps (bathroom, kitchen, living, bedroom, garden).
- Switch later to a **generated** 3D preview (walls extruded from the 2D plan). 3D is not a modeller.
- No accounts. Save/open a JSON file, like Excalidraw. Autosave to `localStorage` so a closed tab is recoverable.
- Dark theme by default, light theme available.

## Users

Developers and other non-designers. Prefer numbers and snap over CAD jargon.
Typing `3.5m` or `350cm` must work when setting a length.

## V1 (2D editor)

Phases 01–10: scaffold, canvas/camera, document store, walls, select/edit, rooms, doors/windows, catalog, file I/O, UI polish.

## Explicitly later

- 3D preview (phase 11+)
- Multiple floors
- PDF export
- Material takeoffs
- Scanned-plan import
- Spanish UI (V1 copy is English)

## Non-goals

- User accounts, cloud sync, or a backend
- Freeform illustration (that is Excalidraw)
- BIM / professional architecture certification
- Editable 3D modelling
