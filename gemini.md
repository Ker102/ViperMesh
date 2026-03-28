# ViperMesh — Current Progress

## Last Session: 2026-03-28 (Tool Failure Surfacing + MCP Timeout Fix)

### What Was Done
1. **Fixed false-success tool streaming:**
   - Updated `lib/ai/agents.ts` so tool results that return an embedded JSON error payload (for example `{"error":"..."}` inside `ToolMessage.content`) are treated as failures
   - Both the dedup cache and the streaming middleware now use the same parsing path, so failed MCP responses no longer get cached as successful executions and no longer show green checks in the Studio activity panel

2. **Raised default Blender MCP timeout:**
   - Increased `lib/mcp/config.ts` default timeout from 30s to 120s
   - The existing `BLENDER_MCP_TIMEOUT_MS` env override still works, but the default now better matches real Studio preview renders and other long-running Blender operations

3. **Verification:**
   - `npx tsc --noEmit` passes
   - `npm run lint` passes

### Notes
- This change was driven by the entryway Studio trace where `delete_object(Camera)` and `render_image` returned embedded MCP errors even though the local monitor showed them as completed
- The goal is trustworthy telemetry first; recursion limits and agent strategy decisions should not be made from false-positive success states

## Last Session: 2026-03-28 (Execute-Code Guidance Repair + Staged Reference Strategy)

### What Was Done
1. **Fixed live `execute_code` guide wiring:**
   - Audited the tool-guide binding path in `lib/ai/agents.ts`
   - Confirmed `TOOL_GUIDE_MAP` keeps only one guide per tool name, and `execute_code` was accidentally resolving to `weight-painting-guide.md`
   - Added a new curated guide `data/tool-guides/execute-code-guide.md` so `execute_code` now receives general scene-building guidance instead of an unrelated specialist document

2. **Aligned guide triggers with the one-guide-per-tool architecture:**
   - Removed `execute_code` from `material-realism-guide.md`, `object-assembly-guide.md`, and `spatial-positioning-guide.md` trigger lists so they continue to serve their direct tools without hijacking generic scene generation
   - Cleared `weight-painting-guide.md` triggers so it no longer overrides the global `execute_code` guide

3. **Added generalized expert-strategy guidance for reference scenes:**
   - New `execute-code-guide.md` teaches staged reference reconstruction:
     - block out scene anchors first
     - verify with screenshot
     - refine only the camera-visible props that still fail silhouette/proportion
     - avoid monolithic “build everything at once” Python passes
   - Encoded the generalized missing-link rule from the entryway test:
     prominent props need a minimum-part decomposition that preserves recognizable silhouette, even when the overall scene blockout is already correct

4. **Updated the live Blender agent system prompt:**
   - `lib/orchestration/prompts/blender-agent-system.md` now explicitly tells the Studio Blender agent to:
     - stage image-reference reconstructions
     - use screenshot checkpoints to decide targeted refinement
     - reserve giant first-pass scripts for major layout only
     - use direct tools for camera/light/render work once geometry stabilizes

5. **Strengthened preview-render guidance:**
   - `data/tool-guides/render-guide.md` now explicitly distinguishes interactive validation renders from final renders
   - New rule: prefer EEVEE or low-sample Cycles for iterative previews, and avoid near-final Cycles settings until composition is already approved

### Notes
- This was driven by the successful 8-tool Studio entryway run: layout was decent, but prop fidelity on camera-visible details lagged because the agent over-compressed the scene into one coarse geometry pass
- The design intent is generalized guidance only — no scene-specific heuristics were added
- Blender target remains 5.x+

## Last Session: 2026-03-28 (Recursion-Limit Telemetry Hardening)

### What Was Done
1. **Recursion-limit failure diagnosis:**
   - Reviewed the failing Studio-mode session `d85b06a0`
   - Confirmed the agent ran for about 3 minutes after CRAG injection, then died with `GraphRecursionError: Recursion limit of 50 reached`
   - Confirmed the current persisted monitoring did **not** preserve the in-flight tool-call sequence for this failure mode, so the logs could not prove whether the agent was making real progress or looping wastefully

2. **Partial tool-trace persistence added for direct agent runs:**
   - Enriched `agent:tool_call` events with `toolCallId`, `args`, duplicate markers, and failure details
   - Dedup middleware now emits explicit `skipped` events when an identical tool call is suppressed
   - `app/api/ai/chat/route.ts` now records streamed tool events incrementally into `executionLog` during the run instead of reconstructing everything only after `agent.invoke()` returns
   - On agent crashes, partial tool history is now preserved in `planningMetadata.rawPlan`, `planningMetadata.executionLog`, and the orchestration log record

3. **Failure summaries improved:**
   - Recursion/interruption failures no longer collapse to “no tools were used” if tools actually ran before the crash
   - Partial completed/failed tool calls are now surfaced from the streamed trace so the next failure can be diagnosed from stored logs

4. **UI typing aligned with richer tool events:**
   - Added `skipped` support to the Agent Activity event typing so duplicate-suppression events remain type-safe

### Notes
- This patch does **not** raise the recursion limit yet
- The current conclusion is: we need one rerun with the new telemetry to determine whether the Blender agent is genuinely hitting a complexity ceiling or wasting steps on redundant action patterns

## Last Session: 2026-03-28 (Baseline Repair + Lint Stabilization)

### What Was Done
1. **TypeScript baseline repair:**
   - Fixed live typecheck failures in `app/api/ai/chat/route.ts`, `app/api/ai/workflow-step/route.ts`, and `app/api/projects/studio-session/route.ts`
   - Aligned workflow event typing across `workflow-timeline.tsx`, `studio-layout.tsx`, and `step-session-drawer.tsx`
   - Excluded non-runtime `scripts/` and `tmp/` paths from repo-wide typecheck noise in `tsconfig.json`
   - Verified: `npx tsc --noEmit` passes

2. **Lint/tooling modernization for Next 16:**
   - Replaced deprecated `next lint` script with direct ESLint invocation in `package.json`
   - Removed legacy `.eslintrc.json` and added flat config via `eslint.config.mjs`
   - Fixed error-level React/JSX lint issues in setup, generation, and project activity/session UI files
   - Verified: `npm run lint` passes

3. **Image warning cleanup:**
   - Converted static public asset usage to `next/image` in the auth callback and landing UI
   - Kept user-supplied data URL previews on raw `<img>` in Studio/session surfaces via small helper wrappers with explicit rationale

4. **Studio test-analysis workflow saved:**
   - Added `docs/studio-script-gap-analysis.md` to capture the reusable comparison process for failed agent scripts vs expert scripts
   - This is intended for manual Studio-mode test review, not Autopilot validation

5. **New Studio-only image-context test added:**
   - Added Test 20 in `docs/test-prompts.md` for an entryway console scene with round-mirror alignment, on-surface placement, and under-table spacing checks
   - Included both a reference-image generation prompt and the matching Studio Blender agent prompt

6. **Studio streaming indicator cleanup:**
   - Removed the redundant standalone `Thinking…` bubble from the Studio session drawer
   - Moved reasoning-state display into the `AgentActivity` panel so it appears inline between tool-call phases while the step is still running

### Notes
- `components/generation/ModelViewer.tsx` is already imported by `components/generation/GenerationPanel.tsx`, so it is part of the checked surface even if broader viewer work is still future-facing
- Remaining non-failing console notice during lint: `baseline-browser-mapping` package age warning

## Previous Session: 2026-03-24 (PR #26 CodeRabbit Triage)

### What Was Done
1. **README Updates:** Renamed "Gemini 2.5 Pro" → "ViperAgent 2.0", Next.js 15 → 16, "Together.ai embeddings" → "Gemini embeddings".
2. **PR #26 Triage — Batch 1 (Quick Wins):**
   - Fixed `doc_url` in both addon copies (ModelForge → ViperMesh repo)
   - Added `timeout=30/60` to all 6 `requests.get()` calls in both addons
   - Replaced `<img>` with Next.js `Image` in `start-oauth/page.tsx`
   - Fixed markdown lint (MD040) in `spatial-positioning-guide.md` and `test-prompts.md`
   - Added "attach image" instruction to Test 18
3. **PR #26 Triage — Batch 2 (Component Fixes):**
   - Fixed nested `<button>` inside `<Link>` in `navbar.tsx` (motion.button → motion.div)
   - Added file input reset, 10MB validation, and FileReader error handling in `studio-workspace.tsx`
   - Added failed tool count + display in `agent-activity.tsx` collapsed summary
4. **PR #26 Triage — Batch 3 (Logic Fixes):**
   - Fixed RAG retry: now picks most-recent substantive prompt (reverse iter) instead of longest
   - Fixed stale closure: added `workflowStepsRef` in `studio-layout.tsx` for `executeStep`/`handleRunAll`
   - Fixed pre-existing lint: added `"skipped"` to `StepCommandResult.status` union in `workflow-timeline.tsx`

## Previous Session: 2026-03-23 (20:30–20:50 PM)

### What Was Done
1. **Streaming UI Fix** (`project-chat.tsx`, `agent-activity.tsx`):
   - Hid per-message `mcpCommands` (TOOL CALLS) block during active streaming — only `AgentActivity` shows live
   - Fixed "Thinking…" indicator — now only appears when agent is reasoning, NOT during tool execution
   - `AgentActivity` collapses into a closed-by-default `<details>` dropdown ("✓ N tools used") when agent finishes
   - MCP execution summary is also now a `<details>` (closed by default) for past messages

2. **Follow-up Quality Fix** (`route.ts`):
   - Expanded `friendlyToolMap` from 7 to 27 entries — all common Blender tools now have human-readable labels
   - Grouped & deduplicated tool labels (e.g. "cleaned up the scene (3×)" instead of "delete_object, delete_object, delete_object")
   - Summary prompt now references visual outcomes, not tool names
   - Fallback message uses grouped labels instead of raw tool names
   - System prompt updated from "ModelForge" to "ViperMesh"

3. **Documentation Rebrand (previous sub-session)** — All ~50 "ModelForge" → "ViperMesh" references updated across 13 doc files

4. **New Test Prompts** (`docs/test-prompts.md`):
   - Test 17: Multi-Object Fruit Market Stall (spatial + lighting)
   - Test 18: Image Reference Recreation (vision + spatial)
   - Tests 14-16 marked as future-only

## Previous Session: 2026-03-23 (20:10–20:30 PM)

### What Was Done
1. **Documentation Rebrand** — Renamed all ~50 "ModelForge" → "ViperMesh" references across 13 doc files:
   - `docs/future-plans.md`, `docs/architecture.md`, `docs/architecture-notes.md`
   - `docs/3d-pipeline-strategy.md`, `docs/3d-pipeline-integration.md`
   - `docs/HANDOFF.md`, `docs/research-pipeline-techniques.md`, `docs/test-prompts.md`
   - `docs/addon-integration-roadmap.md`
   - `SETUP.md`, `SECURITY.md`, `deploy/runpod/README.md`
   - **Zero remaining `ModelForge` references in the entire project** (code + docs + config verified)

## Previous Session: 2026-03-23 (04:00–04:20 AM)

### What Was Done
1. **Code Logic Rebrand** — Renamed `window.modelforge` → `window.vipermesh` and `modelforge-addon.py` → `vipermesh-addon.py`:
   - Electron bridge: `preload.js` (exposeInMainWorld key), `electron.d.ts` (interface + Window prop)
   - Frontend consumers: `login-form.tsx`, `electron-auth-listener.tsx`, `setup/page.tsx`
   - Desktop app: `main.js` (env vars, deep link protocol, window title, HTML auth pages, addon paths)
   - Desktop metadata: `package.json` (name, description, author, appId, productName, copyright)
   - Addon file: renamed in both `desktop/assets/` and `public/downloads/`
   - Addon internals: bl_info, User-Agent, sidebar panel category, class names, operator bl_idnames, UI text
   - Download URLs: `docs/page.tsx`, `quick-start-card.tsx`
   - **Build passed** (exit code 0). Zero remaining `window.modelforge`, `modelforge-addon`, or `modelforge` refs.

## Previous Session: 2026-03-23 (03:30–04:00 AM)

### What Was Done
1. **ViperMesh UI Rebrand** — Replaced all ~80 user-facing "ModelForge" text strings with "ViperMesh" across 20 files
   - **NOT changed**: `--forge-` CSS variable prefix (user confirmed leave as-is)

### Still TODO for Full Rebrand
- [x] `window.modelforge` → `window.vipermesh` ✅
- [x] `modelforge-addon.py` → `vipermesh-addon.py` ✅
- [ ] `--forge-*` CSS variable prefix → `--viper-*` (optional cosmetic, user deferred)
- [ ] GitHub repo, Vercel project, domain

## Previous Session: 2026-03-20 (03:00–05:15 AM)

### What Was Done
1. **Chat UI Fixes** (`project-chat.tsx`):
   - Cleared agent streaming state (`agentEvents`, `agentActive`, `monitoringLogs`, `monitoringSummary`) on new sends
   - Old failed plan blocks now collapsed with "Previous run" label — hides stale error details
   - TypeScript compilation verified clean for touched files (repo has known legacy error: missing `ExecutionResult` import in `route.ts`)
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
- **Pre-existing TS error**: `ExecutionResult` type not imported in `route.ts` line 192 (legacy dead code)

### Next Steps
1. **Live test reasoning streaming** — verify `agent:reasoning` events appear inline in chat during execution
2. **Live test friendly tool names** — verify Executed Commands list shows "Running Python code" instead of `execute_code`
3. **Reproduce and debug Test 13** — check agent routing for skeleton/rigging tool card
4. Run Tests 14-16 (UniRig, keyframe animation, MoMask)

### Architecture (Actual — as of 2026-03-20)

**Two separate modes, fully decoupled:**

1. **Autopilot** (`workflowMode: "autopilot"` — default):
   - `chat/route.ts` → strategy router classifies `procedural|neural|hybrid`
   - Procedural path → `createBlenderAgentV2()` directly (no planner)
   - Agent uses LangChain v1 `createAgent` with built-in ReAct loop (LangGraph)
   - Middleware stack: Dedup → Streaming → ViewportScreenshot → RAG/CRAG
   - System prompt loaded from `lib/orchestration/prompts/blender-agent-system.md`
   - Domain guides bound to tool descriptions from `data/tool-guides/*.md` 
   - RAG: blender-scripts searched in route.ts, tool-guides injected via agents.ts at module load
   - Recursion limit: 50 (line 738 in `route.ts`)

2. **Studio** (`workflowMode: "studio"`):
   - `chat/route.ts` → `workflow-advisor.ts` generates a workflow proposal (step-by-step cards)
   - UI shows cards; user clicks Execute/Skip/Manual Done per step
   - Each step hits `workflow-step/route.ts` which creates a fresh `createBlenderAgentV2()` per step
   - Neural steps use `lib/neural/registry` → provider clients (fal.ai, RunPod, YVO3D)

**Dead code (preserved for reference/revert):**
- `planner.ts` — old planner prompt; NOT in the live execution path
- `executor.legacy.ts` — old hand-rolled step executor (37KB)
- `agents.legacy.ts` — old agent without LangChain v1 (19KB)

**Key rules:**
- Tool guides must be GENERAL, never scene-specific (RAG matches wrong guides otherwise)
- 13 tool guides total; ingestion: `npx tsx scripts/ingestion/ingest-tool-guides.ts --force`

### Future Implementation Plans
> See `docs/future-plans.md` — the single source of truth for P0-P3 roadmap  
> See `docs/architecture.md` — the canonical architecture reference (current vs legacy)
- Added glassmorphism floating pill navbar with magnetic hover pills and spring CTA animations.
- Added LineShadowText component (Magic UI) to '3D Models' hero text with teal shadow.
