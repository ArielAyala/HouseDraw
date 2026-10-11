# Phase 09 — File I/O

## Goal

Save and open the plan as a file; survive a closed tab; export a PNG.

## In scope

- Save/open `.housedraw.json` (File System Access API + input/download fallback)
- Autosave document JSON to `localStorage`
- Restore prompt or silent restore on load if autosave exists
- Export PNG of the current view (or fit-to-content if easy)
- Theme stays independent of the document (document may still store last theme)

## Out of scope

Cloud, accounts, PDF.

## Acceptance

- Round-trip: draw walls → save → reload file → same coordinates
- Tests for parse/serialize of a fixture document
- Reject / migrate unknown future `version` explicitly
