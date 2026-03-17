# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-18 — Fix Agent Crash & Separate Studio/Autopilot Pipelines

## What Changed (Session 2026-03-18)

### Agent Crash Fix ✅
- **Root cause**: Module-level shared `MemorySaver` (agents.ts:926) accumulated state across invocations → moved to per-agent creation
- Added `wrapToolCall` safety wrapper in `ViewportScreenshotMiddleware` — catches tool errors and returns `ToolMessage` to prevent framework crash
- Removed dead `checkpointer` export

### Studio/Autopilot Pipeline Separation ✅
- Added `studioStep: boolean` flag to request schema in `chat/route.ts`
- When `studioStep=true`: skips initial LLM text streaming AND strategy classification → goes straight to agent execution
- `studio-layout.tsx` now sends `studioStep: true` alongside `workflowMode: "autopilot"`
- Uses `classificationMethod: "user_override"` for clarity

### Lint Fixes ✅
- Added `"agent"` to `LogNamespace` type and `NAMESPACE_LABELS` in `logger.ts`
- Imported `StrategyDecision` type in `route.ts` for proper typing

### Knowledge Graph ✅
- Stored 4 episodes in Graphiti: chat route flow, agents.ts structure, UI architecture, crash investigation

## Previous Sessions
- **2026-03-17**: RAG middleware fixes, legacy planner removal, agent system prompt update
- **2026-03-16**: Tool Context Guides (7 domain knowledge guides ingested into vectorstore)
- **2026-03-15**: MCP tool verification (13/14 pass), Studio persistence API, agent test runs

## Known Issues / Blockers
- **Pre-existing lint errors**: `ExecutionResult` (route.ts:190), `.filter()` type mismatch (route.ts:644), `analysis` on never (route.ts:729), `skipped` status type (studio-layout:254)
- **gcloud auth expiry**: Vertex AI OAuth tokens expire frequently
- **LangSmith tracing**: Not producing traces — investigate env var loading

## Remaining Tasks
1. **Test the fix** — clear .next cache, run Test 4 from Studio mode
2. Verify no strategy classification in Pipeline Monitor
3. Verify RAG logs appear and agent executes without crash
4. **Git push** `feature/addon-tools-phase3` → PR for CodeRabbit review

## Branch
`feature/addon-tools-phase3`
