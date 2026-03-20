# ModelForge — Current Progress

## Last Session: 2026-03-20 (03:00–05:15 AM)

### What Was Done
1. **Chat UI Fixes** (`project-chat.tsx`):
   - Cleared agent streaming state (`agentEvents`, `agentActive`, `monitoringLogs`, `monitoringSummary`) on new sends
   - Old failed plan blocks now collapsed with "Previous run" label — hides stale error details
   - TypeScript compilation verified clean
   - Committed: `fix: clear agent state on new send + collapse old plan errors`

2. **Aesthetic Quality Skill Guide** (`data/tool-guides/aesthetic-quality-guide.md`):
   - Created new guide teaching agent anti-minimalism, stylistic coherence, and multi-component assembly
   - Refactored to remove scene-specific code (torch/chair Python) — replaced with generic multi-component assembly template
   - Ingested into vectorstore (13 total guides)
   - Committed: `feat: add aesthetic quality & stylistic coherence guide` + refactor commit

3. **Test Prompts 13-16** (`docs/test-prompts.md`):
   - Test 13: Rigify biped rigging with weight painting
   - Test 14: UniRig AI auto-rigging for quadrupeds  
   - Test 15: Keyframe bouncing ball animation with easing
   - Test 16: MoMask AI text-to-motion walking animation
   - Committed: `test: add rigging/animation/skeleton test prompts (13-16)`

### Open Bugs / Issues
- **Test 13 failed**: Agent didn't execute any tools — didn't even remove default cube. Root cause NOT YET diagnosed (terminal logs rotated). Need to reproduce and check:
  - Was it run in Studio or Autopilot?
  - Which tool card was selected?
  - Did the agent respond with text-only or error?
  - Possible: skeleton tools might not be available under the selected tool card
- **Agent streaming UI**: AgentActivity component is wired correctly but not yet confirmed visible during actual agent runs. Need live test.
- **Follow-up question quality**: Still weak/irrelevant — needs prompt engineering in backend

### Next Steps
1. **Reproduce and debug Test 13** — check agent routing for skeleton/rigging tool card
2. **Verify agent streaming UI** is visible during a live run
3. Run Tests 14-16 (UniRig, keyframe animation, MoMask)
4. Consider improving follow-up question prompt

### Key Architectural Notes
- Recursion limit bumped to 50 (line 738 in `route.ts`)
- Tool guides should be GENERAL, never scene-specific (agent applies wrong guides to wrong scenes via RAG)
- 13 tool guides total in vectorstore, ingestion via `npx tsx scripts/ingestion/ingest-tool-guides.ts --force`
