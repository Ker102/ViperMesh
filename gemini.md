# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-19 — Dedup Middleware Bug Fix, Monitoring Audit, Test 6 Analysis

## What Changed (Session 2026-03-19)

### Dedup Middleware Bug Fix ✅
- **Root cause**: `lastCalls` Map was keyed by tool name only — calls to the same tool with different args overwrote each other's cache, so true duplicates slipped through
- **Fix**: Cache key changed from `toolName` to `toolName:stableHash(args)`
- **Stable hashing**: Added sorted-key JSON.stringify so `{a:1,b:2}` and `{b:2,a:1}` produce identical hashes
- **System prompt**: Added rule #8 "No Duplicate Calls" to `blender-agent-system.md`
- **Executor prompt**: Added dedup hint to `executor.ts` agent prompt

### Test 6 Analysis ✅
- Analyzed session `4929c689` (17 tool calls, 91.8s agent execution)
- Found 4 duplicate calls: `create_material("Ceramic")` ×2, `assign_material("Laptop_Screen","Silver")` ×2, `assign_material("Mug_Handle","Ceramic")` ×2
- Table "missing legs" confirmed as expected behavior — prompt says "flat box"
- RAG surfaced 3 scripts at 0.719/0.685/0.675 similarity — adequate coverage

### Monitoring Infrastructure Documented ✅
- Saved to Graphiti memory: `agent-monitor.ts`, `monitoring/logger.ts`, `orchestration.ndjson`
- No LangSmith integration currently active

## Previous Sessions
- **2026-03-18**: RAG→tool-guide binding, conversation isolation, test suite expansion (4/4b/4c/5)
- **2026-03-17**: RAG middleware fixes, legacy planner removal, agent system prompt update
- **2026-03-16**: Tool Context Guides (7 domain knowledge guides ingested into vectorstore)

## Known Issues / Blockers
- **Pre-existing lint errors**: `ExecutionResult` (route.ts:190), `.filter()` type mismatch (route.ts:644)
- **Future task**: 3D Engineering Skills scripts for RAG (saved to Graphiti memory)

## Branch
`feature/addon-tools-phase3` → PR #23
