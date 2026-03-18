# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-18 — Agent Intelligence, Dedup Middleware, Conversation Isolation

## What Changed (Session 2026-03-18)

### RAG → Tool-Guide Binding ✅
- Removed middleware-based RAG injection (was ignored by `createAgent`)
- Built `TOOL_GUIDE_MAP`: loads `data/tool-guides/*.md`, parses `triggered_by` YAML
- `withGuide()` appends full domain guide to tool description (zero latency)
- Vector search retained for blender-scripts examples only

### Detailed Tool Logging ✅
- `route.ts`: logs `[Agent] Tool: {name} | Args: {JSON}` for every tool call
- `executeMcpCommand` returns `_applied` params so agent sees what was configured

### Dedup Middleware ✅
- Sequential dedup: caches last successful result per tool, skips identical re-calls
- Parallel dedup: coalesces concurrent identical calls via in-flight promise tracking
- Retries allowed after failures — no false blocking

### Autopilot/Studio Conversation Isolation ✅
- Fixed `studio-layout.tsx`: sends `workflowMode: "studio"` (was incorrectly `"autopilot"`)
- `route.ts`: tags every saved message with `workflowMode` in `mcpResults` JSON
- History loading filters by current mode — studio messages don't leak into autopilot

### Test Suite Expansion ✅
- Tests 4b/4c: multi-camera cinematic rig, architectural interior wide-angle
- Test 9: full production stress test (14 tools, pedestal + 3 objects + lighting + camera + render)
- Test 10: spatial reasoning with no exact values (park bench scene)

### Test Results
| Test | Tools | Time | Result |
|---|---|---|---|
| 4 | 4 | 36s | ✅ 85mm at ~9.8m |
| 4b | 6 | 60s | ✅ 3 cameras, correct distances |
| 4c | 4 | 28s | ✅ 24mm, zero duplicates |
| 5 | 4 | ~30s | ✅ Org + export pipeline |

## Previous Sessions
- **2026-03-17**: RAG middleware fixes, legacy planner removal, agent system prompt update
- **2026-03-16**: Tool Context Guides (7 domain knowledge guides ingested into vectorstore)
- **2026-03-15**: MCP tool verification (13/14 pass), Studio persistence API, agent test runs

## Known Issues / Blockers
- **Render dedup verification**: need to confirm render_image dedup works in Tests 9/10
- **Pre-existing lint errors**: `ExecutionResult` (route.ts:190), `.filter()` type mismatch (route.ts:644)

## Branch
`feature/addon-tools-phase3` → PR #23
