# ViperMesh — Current Progress

## Last Session: 2026-03-23 (20:10–20:30 PM)

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
