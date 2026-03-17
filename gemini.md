# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-17 — Debugging RAG Context Injection & Removing Legacy Planner

## What Changed (Session 2026-03-17)

### RAG Middleware Fixes ✅
- Fixed content type mismatch in `agents.ts:862` — RAG middleware now handles both `string` and `array` content types for system messages
- Fixed user message content extraction to handle array format
- Added 10-second timeout to RAG similarity search with `Promise.race`
- Added `[RAG]` console logging for pipeline visibility

### Agent System Prompt Update ✅
- Updated `blender-agent-system.md` — added all direct MCP tools to `<tools_capability>`, added `<tool_selection_rules>` table, replaced execute_code-only examples with general-purpose ones

### Legacy Planner Removal ✅ (KEY ARCHITECTURAL CHANGE)
- **Root cause found**: `BlenderPlanner` (planner.ts) was using `agents.legacy.ts` which only knew about `execute_code`, not direct MCP tools
- The planner pre-determined tool usage BEFORE the v2 agent (with RAG) ever ran
- **Fix**: Removed planner from both `workflow-step/route.ts` and `chat/route.ts`
- Both now call `createBlenderAgentV2` directly with `useRAG: true`
- Legacy files (`agents.legacy.ts`, `executor.legacy.ts`, `chains.ts`) left as dead code for reference

### Executor Prompt Fix ✅
- Updated `executor.ts:139` to use neutral phrasing instead of biasing toward execute_code

## Previous Sessions
- **2026-03-16**: Tool Context Guides (7 domain knowledge guides ingested into vectorstore)
- **2026-03-15**: MCP tool verification (13/14 pass), Studio persistence API, agent test runs
- **2026-03-14**: Studio Chat Persistence, Auth Pages Teal Redesign, BETA Badge

## Known Issues / Blockers
- **gcloud auth expiry**: Vertex AI OAuth tokens expire frequently
- **LangSmith tracing**: Not producing traces — investigate env var loading
- **Blender RAM**: Close other apps before opening Blender. Reduce Undo Steps to 16.

## Remaining Tasks
1. **Re-run Test 4** — verify RAG injects Camera Guide + agent uses direct tools
2. **Git push** `feature/addon-tools-phase3` → open PR for CodeRabbit review
3. Feature brainstorm P2/P3 implementation

## Branch
`feature/addon-tools-phase3`
