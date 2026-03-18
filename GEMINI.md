# gemini.md — ModelForge Dev Tracker

## Current Task
Phase 1: Core Addon Tool Expansion (8 new tools)

## What Changed (Latest)
- **Phase 1A — Transform Tools** (4 new commands added to addon + agent):
  - `set_object_transform` — set location/rotation(degrees)/scale
  - `rename_object` — rename object + data block
  - `duplicate_object` — clone with optional linked/new_name
  - `join_objects` — merge multiple MESH objects into one
- **Phase 1B — Modifier & Mesh Tools** (4 new commands):
  - `add_modifier` — add any modifier type with optional properties
  - `apply_modifier` — bake modifier to mesh
  - `apply_transforms` — freeze transforms to data
  - `shade_smooth` — smooth/flat/auto-smooth-by-angle
- All 8 tools: Python handlers in `modelforge-addon.py`, TS tool defs in `agents.ts`
- Handler dispatch, ALL_TOOLS array, and `desktop/assets/` sync updated

## Previous Changes
- Bug fixes: duplicate node wiring, deprecated shaders, temp file leak, use_nodes safety
- New tools: `list_materials`, `delete_object`, `get_all_object_info` pagination
- LangChain v1 migration, agent refactoring, viewport screenshot middleware

## Next Steps
- Phase 2: Medium-priority tools (parent_set, set_origin, export_object, etc.)
- Phase 3: Dynamic addon detection — `list_installed_addons`, addon registry, dynamic prompts
- Phase 4: Curated "Recommended Addons" page on ModelForge website
- Git commit after verification
