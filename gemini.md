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

## Remaining Tasks
1. ~~Tool Context Guides for agent domain knowledge~~ ✅
2. Re-test Test 4 prompt with guides active → verify camera placement
3. Push branch + PR for CodeRabbit review
4. Feature brainstorm P2/P3 implementation

## Branch
`feature/addon-tools-phase3`
