# gemini.md — ModelForge Dev Tracker

## Current Task
Session 2026-03-19 — Agent Stop Button, Mode-Switch Fix, Dedup Middleware

## What Changed (Session 2026-03-19)

### Agent Stop Button ✅
- **Autopilot mode**: Added `abortControllerRef` to `project-chat.tsx`. Send button toggles to "Stop Processing" (destructive red) when agent is active. Clicking aborts the fetch and resets state.
- **Studio mode**: Added `onStop` prop to `step-session-drawer.tsx`. Red "■ Stop" button appears next to "Agent is processing..." indicator. Wired in `studio-layout.tsx` via `handleStopStep` callback that aborts the controller and marks step as failed.

### Mode-Switch Fix ✅
- **Bug**: Switching from Studio → Autopilot mode killed the running agent because `StudioLayout` was conditionally rendered via ternary (unmounted on switch).
- **Fix**: Changed to `display: none` wrapping so StudioLayout stays mounted when Autopilot is active, preserving the agent's running fetch connection.

### Dedup Middleware Bug Fix ✅
- Cache key changed from `toolName` to `toolName:stableHash(args)`
- Stable hashing added for consistent key ordering
- System prompt rule #8 "No Duplicate Calls" + executor hint

### Test 6-8 Analysis ✅
- Test 6: 4 duplicate calls identified and fixed by dedup middleware
- Test 7: Perfect, no duplicates after fix
- Test 8: Cube moved Z=4 instead of Z=2 (potential missing get_object_info); light energy doubled correctly

## Previous Sessions
- **2026-03-18**: RAG→tool-guide binding, conversation isolation, test suite expansion (4/4b/4c/5)
- **2026-03-17**: RAG middleware fixes, legacy planner removal, agent system prompt update
- **2026-03-16**: Tool Context Guides (7 domain knowledge guides ingested into vectorstore)

## Known Issues / Blockers
- **Pre-existing lint errors**: `ExecutionResult` (route.ts:190), `.filter()` type mismatch (route.ts:644), `"skipped"` not in StepCommandResult union (studio-layout.tsx:257)
- **Future task**: 3D Engineering Skills scripts for RAG (saved to Graphiti memory)
- **Test 8**: Agent moved cube Z=4 instead of Z=2 — needs investigation

## Branch
`feature/addon-tools-phase3` → PR #23
