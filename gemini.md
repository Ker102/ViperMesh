# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-16 — Tool Context Guides System (vectorstore-integrated domain knowledge)

## What Changed (Session 2026-03-16)

### Tool Context Guides System ✅
- Created 7 domain knowledge guides in `data/tool-guides/`:
  - `camera-guide.md` — focal length→distance table, DOF rules, composition patterns
  - `lighting-guide.md` — light types, energy scales, color temperatures, 3-point setups
  - `materials-guide.md` — PBR parameter ranges, surface presets, Blender 5.x socket names
  - `modifiers-guide.md` — SubSurf levels, bevel, boolean solver (EXACT only), auto-smooth
  - `render-guide.md` — engine comparison, samples, EEVEE-Next changes, output formats
  - `export-guide.md` — format selection, pre-export checklist, scale factors
  - `scene-management-guide.md` — transforms, hierarchy, collections, origins
- Created `scripts/ingestion/ingest-tool-guides.ts` for vectorstore ingestion
- Ingested all 7 guides into pgvector with `source: "tool-guides"`
- Updated `lib/ai/rag.ts` → `formatContextFromSources()` now separates "Domain Guides" from "Script References"
- Verified: all 4 similarity search tests pass (camera 0.676, lighting 0.705, materials 0.698, render 0.741)

## Previous Sessions
- **2026-03-15**: MCP tool verification (13/14 pass), Studio persistence API, agent test runs
- **2026-03-14 Evening**: Agent execution fix (RAG middleware SystemMessage ordering), LangSmith observability, DB-backed Studio persistence (Prisma)
- **2026-03-14**: Studio Chat Persistence (localStorage), Auth Pages Teal Redesign, BETA Badge, Filesystem Reorganization

## Known Issues / Blockers
- **gcloud auth expiry**: Vertex AI OAuth tokens expire frequently
- **Session expiry UI**: False positive "session expired" notifications in Electron
- **Blender crash (2026-03-16)**: Blender 5.0.1 crashed during Test 4 attempt.
  - **Root cause: RAM exhaustion** — NULL pointer dereference inside `Py_GetAllocatedBlocks` (Python GC).
  - **NOT caused by our agent** — addon was just closing a socket when the allocator failed.
  - **Mitigation**: Close other apps before opening Blender. Reduce Undo Steps to 16 (Edit → Preferences → System → Undo Steps).

## Remaining Tasks — NEXT SESSION START HERE
1. **Re-run Test 4** via Electron Studio mode with Blender open (close other heavy apps first!)
   - Start servers: `npm run dev` in `ModelForge/`, then `npm run dev` in `ModelForge/desktop/`
   - Paste this prompt in Studio mode:
     > Set up a camera for a product shot: place it at a 45-degree angle looking down at the scene center, use a 85mm portrait lens, enable depth of field focused at 5 meters with f/2.8 aperture, then render the scene at 1920x1080 using EEVEE.
   - **Success criteria**: camera placed at 8–12m (not 5m), uses `add_camera` + `set_camera_properties` (not `execute_code`), rendered image produced
   - Check LangSmith trace: Camera Guide should appear in RAG context
2. **Git commit & push** `feature/addon-tools-phase3` → open PR for CodeRabbit review
3. Feature brainstorm P2/P3 implementation

## Branch
`feature/addon-tools-phase3`
