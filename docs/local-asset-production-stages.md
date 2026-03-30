# ViperMesh Local Asset Production Stages

> Status: Draft only
>
> This document is a migration sequence for the local asset system.
> It complements `docs/local-asset-production-draft.md` and does not replace `docs/future-plans.md`.
> Treat it as a pragmatic path, not a locked final roadmap.

## Goal

Move from the current development-only local asset workflow to a production-capable managed asset system without breaking Blender-agent imports or user-owned asset workflows.

## Stage 0 — Current Dev Baseline

### State

- curated assets live on local disk
- Blender addon imports assets from local file paths
- the agent searches a local JSON manifest
- ViperMesh assets and BYO assets are both local-disk concepts

### What must be true

- local curated assets are stable enough for testing
- `search_local_assets` and `import_local_asset` work reliably
- the catalog preserves metadata and import names

### Exit criteria

- the current local library can support repeated Studio tests
- the addon UI can reliably point to a managed catalog/root
- the agent uses curated assets selectively, not indiscriminately

## Stage 1 — Managed Local Defaults

### Goal

Make the current local system production-friendly on a single machine before adding cloud delivery.

### Work

- auto-detect the managed ViperMesh catalog and library root when present
- keep manual `Catalog JSON` and `Library Root` as advanced overrides
- distinguish clearly between:
  - managed ViperMesh assets
  - user BYO assets
- add lightweight validation/status messaging in the addon and app

### Why this stage matters

It reduces friction without changing the core import model.

### Exit criteria

- a normal ViperMesh user does not need to type paths manually for managed assets
- advanced users can still point to their own libraries
- the managed local library remains the same import mechanism Blender already uses

## Stage 2 — Previews And Human Browsing

### Goal

Make the library usable by humans, not just the agent.

### Work

- generate and store preview thumbnails for curated assets
- expose visual search results in the desktop app
- support manual click-to-import selection
- optionally expose lightweight browsing inside Blender later

### Why this stage matters

It improves debugging, trust, and manual workflows without changing asset storage.

### Exit criteria

- users can browse the managed library visually
- users can manually select and import assets without guessing names
- previews are tied to asset IDs and catalog entries consistently

## Stage 3 — Cloud Catalog, Local Files Still Primary

### Goal

Move metadata and search to a managed remote service while keeping Blender imports local.

### Work

- introduce a remote asset catalog API
- store metadata remotely:
  - asset ids
  - categories
  - tags
  - style
  - quality scores
  - dimensions
  - preview URLs
  - storage keys or download URLs
- decide whether ranking lives in the desktop app or backend
- keep local file import as the final Blender step

### Important rule

Do not try to skip local files at this stage. Blender still needs them.

### Exit criteria

- search can work against a remote catalog
- the app can still resolve a local file for import when needed
- local and remote metadata stay consistent enough to avoid broken imports

## Stage 4 — Managed Download And Local Cache

### Goal

Stop bundling the whole library and move to on-demand managed asset delivery.

### Work

- store asset binaries in object storage or CDN
- add a managed local cache on the user machine
- download assets on demand into that cache
- reuse cached files across sessions
- define cache policies:
  - size cap
  - eviction
  - invalidation
  - versioning

### Why this is likely the real production inflection point

This is where ViperMesh stops being “local catalog only” and becomes a managed asset product without forcing huge installers.

### Exit criteria

- managed assets are downloadable on demand
- Blender imports still use local cached files
- the installer does not need to ship the full library
- cache misses are handled automatically

## Stage 5 — Multi-Source Library Model

### Goal

Support both managed ViperMesh assets and user-owned libraries cleanly.

### Work

- support separate source lanes:
  - managed ViperMesh catalog/cache
  - user BYO local library
- decide whether results are merged into one search list or shown as separate sources
- keep provenance, licensing, and ownership clear
- optionally support multiple custom catalogs later

### Exit criteria

- managed assets and BYO assets can coexist without ambiguity
- the agent can reason about source differences when choosing assets
- the user can disable or override managed assets when desired

## Stage 6 — Nice-To-Have Product Layer

### Possible additions

- drag/drop import UX
- favorites and pinned assets
- recent-assets panel
- project-scoped asset sets
- team-shared managed libraries
- per-asset notes, ratings, or validation badges
- richer preview viewer or turntable previews

This stage is intentionally optional. The system does not need it to be production-capable.

## Recommended Order

If work starts later, the safest sequence is:

1. Stage 1
2. Stage 2
3. Stage 3
4. Stage 4
5. Stage 5

Stage 6 is opportunistic.

## What Not To Do Too Early

- do not ship the full managed library inside every installer by default
- do not design as if a cloud database alone can replace local files
- do not merge BYO asset assumptions into the managed library path too early
- do not overbuild drag/drop or gallery UX before managed defaults and import reliability are solid

## Current Recommendation

When ViperMesh gets closer to production, start by implementing Stage 1 first.

It is the smallest, safest improvement and keeps the current local asset flow intact while reducing setup friction for real users.
