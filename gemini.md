# ViperMesh — Current Progress

## Last Session: 2026-03-30 (Local Asset Production Migration Stages Saved)

### What Was Done
1. **Added a separate migration-sequence note for the future asset system:**
   - Added `docs/local-asset-production-stages.md`
   - This stays separate from both `docs/future-plans.md` and the broader production draft

2. **Defined the staged path from current local-disk behavior to a more production-capable asset system:**
   - Stage 0: current dev baseline
   - Stage 1: managed local defaults
   - Stage 2: previews and human browsing
   - Stage 3: cloud catalog with local files still primary
   - Stage 4: managed download and local cache
   - Stage 5: multi-source managed + BYO model
   - Stage 6: optional product-layer UX additions

3. **Linked the stages note from the existing production draft:**
   - Updated `docs/local-asset-production-draft.md`

### Notes
- This is intentionally a pragmatic migration path, not a fixed product roadmap.
- The current recommendation in the doc is to start with Stage 1 when production work begins.

## Last Session: 2026-03-30 (Long-Term Managed Asset Delivery Draft Saved)

### What Was Done
1. **Saved a separate draft architecture note for future managed asset delivery:**
   - Added `docs/local-asset-production-draft.md`
   - This document is explicitly marked as a draft and intentionally kept separate from `docs/future-plans.md`

2. **Captured the current preferred long-term direction without locking the product into a final implementation:**
   - cloud catalog for metadata and search
   - object storage / CDN for binary assets and previews
   - managed local cache on the user machine for Blender imports
   - optional BYO asset library override for private user assets

3. **Clarified an important production constraint:**
   - Blender still needs real local files at import time
   - the agent can choose assets, but the Blender addon still imports them from disk
   - so a cloud database alone is not enough without a local cache or download step

4. **Stored the same direction in Graphiti memory:**
   - Saved under group `modelforge` as `ModelForge long-term managed asset delivery draft`

### Notes
- This is intentionally a working architecture note, not a committed final production design.
- Other upcoming product features may still change the final shape of the managed asset system.

## Last Session: 2026-03-29 (Selective ViperMesh Asset Usage Clarified)

### What Was Done
1. **Confirmed the local asset library is already runtime-gated in the addon:**
   - When `blendermcp_use_local_assets` is off, the Blender MCP server does **not** expose:
     - `search_local_assets`
     - `import_local_asset`
   - So the user-facing checkbox already controls whether the agent can use the curated local asset library at all

2. **Renamed the addon UI wording from generic local-library language to product language:**
   - `Local Asset Library` → `ViperMesh Assets`
   - Updated both addon copies:
     - `desktop/assets/vipermesh-addon.py`
     - `public/downloads/vipermesh-addon.py`
   - Updated the enabled/disabled status messages to use the same wording

3. **Strengthened the live Blender agent policy for hybrid asset use:**
   - Updated `lib/orchestration/prompts/blender-agent-system.md`
   - The prompt now tells the agent to:
     - use local curated assets selectively for commodity props with recognizable silhouettes
     - keep room shells, layout, architecture, cameras, lighting, and bespoke hero forms procedural/direct
     - search/import a single strong asset candidate rather than replacing whole scenes with premade assets
     - expect some local assets to need transform correction because cross-asset scale may not match perfectly

4. **Strengthened supporting local-asset guidance and tool descriptions:**
   - Updated `data/tool-guides/local-asset-guide.md`
   - Updated local asset tool descriptions in `lib/ai/agents.ts`

### Validation
- `python -m py_compile desktop/assets/vipermesh-addon.py public/downloads/vipermesh-addon.py` ✅
- `npx tsc --noEmit` ✅
- `npm run lint` ✅

## Last Session: 2026-03-29 (Initial Curated BlenderKit Batch Promoted)

### What Was Done
1. **Promoted the current BlenderKit intake batch into the final local asset library:**
   - External asset root:
     - `C:\Users\krist\Documents\ViperMeshAssets`
   - Promoted curated `.blend` assets into final `props\...` folders for:
     - footwear
     - plants
     - baskets
     - lamps
     - books

2. **Added reproducible promotion tooling and metadata:**
   - Added `scripts/maintenance/promote-local-asset-batch.ts`
   - Added `data/local-assets/initial-blenderkit-batch.json`
   - This promotion plan now captures the curated target paths, category/tags/style metadata, quality scores, and exact `.blend` collection names for import

3. **Extracted exact import collection names from the staged `.blend` files using Blender 5.0:**
   - The catalog now points at real `import_spec.asset_names` instead of empty placeholders
   - Examples:
     - `Army  Shoes`
     - `Olive Branches in Ceramic Vase`
     - `White Ceramic Table Lamp`
     - `Stack of magazines Blue Grey`

4. **Built the live external catalog:**
   - `C:\Users\krist\Documents\ViperMeshAssets\catalog\assets.json`
   - Current catalog count: `29` curated assets
   - The normal `assets:catalog` rebuild now preserves this metadata and still skips raw `incoming\...` assets

### Validation
- `npm run assets:promote -- --root "C:\Users\krist\Documents\ViperMeshAssets"` ✅
- `npm run assets:catalog -- --root "C:\Users\krist\Documents\ViperMeshAssets"` ✅
- `npx tsc --noEmit` ✅
- `npm run lint` ✅

### Notes
- Preview images have not been generated yet; `preview_path` is still empty for this batch.
- A few basket and book subtype placements remain provisional semantic matches, but the assets are fully usable as curated local imports now.

## Last Session: 2026-03-29 (BlenderKit Intake Batch Imported Into ViperMesh Staging)

### What Was Done
1. **Copied the current BlenderKit download batch into the ViperMesh intake tree:**
   - Source cache root:
     - `C:\Users\krist\blenderkit_data\models`
   - Destination staging root:
     - `C:\Users\krist\Documents\ViperMeshAssets\incoming\blenderkit`

2. **Imported the first full raw intake set across the current priority categories:**
   - footwear
   - plants
   - baskets
   - lamps
   - books

3. **Normalized the raw intake filenames to stable ViperMesh staging names:**
   - examples:
     - `blenderkit_ankle_boots_suede_brown_a.blend`
     - `blenderkit_olive_branch_vase_a.blend`
     - `blenderkit_lamp_brass_desk_a.blend`
     - `blenderkit_books_stack_blue_gray_a.blend`

4. **Kept the BlenderKit cache intact:**
   - Files were copied into the ViperMesh intake tree rather than removed from the BlenderKit cache

### Notes
- This batch includes more than the original strict 20-target minimum because a few categories now have multiple candidate variants staged for later curation.
- Some category placements are intentionally provisional at the raw intake stage, especially for:
  - basket subtypes
  - book subtype buckets
- That is acceptable because these are still **incoming** assets. Final correctness will be enforced during the curated `.blend` promotion pass into `props\...`.

## Last Session: 2026-03-29 (Local Asset Catalog Builder Hardened)

### What Was Done
1. **Hardened the local asset catalog builder for real curation workflows:**
   - Updated `scripts/maintenance/build-local-asset-catalog.ts`
   - The generator now skips raw staging folders under `incoming\...`
   - Rebuilds now preserve manual enrichment where the curated file path stays the same:
     - `name`
     - `tags`
     - `style`
     - `description`
     - `license`
     - `source`
     - `source_url`
     - `preview_path`
     - `quality_score`
     - `validated_blender_version`
     - `dimensions_m`
     - `.blend` import settings such as `append_type` and `asset_names`

2. **Improved generated manifest quality:**
   - Derived `category` is now more useful for curated `props\...` assets, e.g. `footwear` instead of the deepest folder slug
   - Rebuilds now filter noisy one-character auto-tags

3. **Updated docs to match the live local library workflow:**
   - `docs/local-asset-library.md`
   - `docs/first-20-local-assets.md`
   - Clarified that `incoming\...` is staging only and that the catalog should point at curated assets only

### Validation
- `npx tsc --noEmit` ✅
- `npm run lint` ✅
- Fixture rebuild test confirmed:
  - raw `incoming\...` assets are skipped
  - curated metadata survives rebuilds
  - exact `.blend` import names are preserved

## Last Session: 2026-03-29 (First BlenderKit Asset Moved Into Intake Library)

### What Was Done
1. **Moved the first real BlenderKit source asset out of the BlenderKit cache and into the ViperMesh intake library:**
   - Source cache path:
     - `C:\Users\krist\blenderkit_data\models\army-shoes_0a407d12-e06d-42a5-9b94-d4777b5384a5\army-shoes_2K_412e4cfe-3568-4d4c-a8ce-246a3be7a75f.blend`
   - New intake path:
     - `C:\Users\krist\Documents\ViperMeshAssets\incoming\blenderkit\footwear\ankle-boots-dark\blenderkit_ankle_boots_dark_a.blend`

2. **Naming choice:**
   - Renamed the file away from the BlenderKit UUID-style cache name to a stable intake filename:
     - `blenderkit_ankle_boots_dark_a.blend`

### Notes
- This is still a **raw intake asset**, not the final curated library asset yet.
- The later curated target remains:
  - `C:\Users\krist\Documents\ViperMeshAssets\props\footwear\ankle-boots\ankle_boots_dark_a.blend`

## Last Session: 2026-03-29 (BlenderKit Intake Path Alignment)

### What Was Done
1. **Aligned the seed scaffold with the actual raw intake source:**
   - Updated `scripts/maintenance/init-local-asset-library.ts`
   - Added `incoming/blenderkit` to the generated library structure

2. **Aligned the first 20 intake document with the real working paths:**
   - Updated `docs/first-20-local-assets.md`
   - Switched the raw staging examples from old `a23d` paths to the current `blenderkit` paths under:
     - `C:\\Users\\krist\\Documents\\ViperMeshAssets\\incoming\\blenderkit\\...`

3. **Created the real BlenderKit raw intake folders on disk for the current shortlist:**
   - footwear
   - plants
   - baskets
   - lamps
   - books
   - including the specific target folders for the full 20-asset shortlist

4. **Validation:**
   - `npx tsc --noEmit` passes
   - `npm run lint` passes

### Notes
- This was a path-alignment checkpoint only. No changes to the live agent/runtime behavior.
- The working raw intake root for the current curation pass is:
  `C:\\Users\\krist\\Documents\\ViperMeshAssets\\incoming\\blenderkit`

## Last Session: 2026-03-29 (BlenderKit + Adobe Asset Source Guidance)

### What Was Done
1. **Extended the local asset sourcing strategy doc:**
   - Updated `docs/local-asset-library.md` with:
     - BlenderKit guidance
     - Adobe Substance 3D Assets guidance
     - a clearer source matrix for what is safe as:
       - manual artist-side use
       - manual curation input
       - agent-accessible internal library source

2. **Captured the current position on BlenderKit:**
   - Attractive for its large Blender-native library and subscription pricing
   - Not yet something to architect the ViperMesh agent runtime around because:
     - no clearly documented stable third-party API was surfaced in the public docs review
     - BlenderKit's current public user terms require caution for use in developing other products/services or competing services

3. **Captured the current position on Adobe Substance 3D Assets:**
   - Best fit is materials / PBRs rather than models
   - Strong manual look-dev value
   - Public terms still need caution for an agent-accessible internal library because of AI/ML restrictions in the published Product Specific Terms

### Notes
- The practical recommendation remains:
  1. Poly Haven for open/on-demand assets
  2. private/user-owned/internal-safe assets for the first agent library seed
  3. BlenderKit and Adobe as manual curation sources first, not automatic agent-library defaults

## Last Session: 2026-03-29 (First 20 Local Asset Intake Plan + A23D Restriction Check)

### What Was Done
1. **Defined the first concrete 20-asset intake shortlist:**
   - Added `docs/first-20-local-assets.md`
   - The doc specifies for each target asset:
     - target prop
     - recommended source class
     - raw download staging folder
     - curated final library path
     - final preferred format

2. **Extended the seed scaffold for raw download staging:**
   - Updated `scripts/maintenance/init-local-asset-library.ts` to create:
     - `incoming/a23d`
     - `incoming/polyhaven`
     - `incoming/private`
     - `incoming/marketplace`

3. **Re-verified the A23D fit for ViperMesh:**
   - Updated `docs/local-asset-library.md` with the key restriction:
     - A23D's public Fair Usage Policy dated **2026-01-06** says downloading assets solely to build private libraries is prohibited
     - the same public policy also says downloading assets for creating, testing, benchmarking, improving, or operating AI/generative systems is prohibited
   - Also noted from A23D's public Licenses page dated **2026-01-06**:
     - only **Business Commercial** allows storage on company servers/internal asset libraries
     - **Enterprise** is the path for custom AI/ML permissions

4. **Validation:**
   - `npx tsc --noEmit` passes
   - `npm run lint` passes
   - `npm run assets:init -- --root tmp/local-assets-seed-2` succeeds with the new staging folders

### Notes
- Because of the current published A23D restrictions, a one-month bulk download plan just to seed the ViperMesh agent's private local asset library is not a safe assumption under their standard public terms.
- The practical recommendation remains:
  1. keep Poly Haven mostly on-demand
  2. use private/user-owned/internal-safe assets for the first local catalog population
  3. use A23D for the local agent library only after written confirmation or a license that explicitly covers the AI/internal-library workflow

## Last Session: 2026-03-29 (Seed Local Asset Library Scaffold + A23D Guidance)

### What Was Done
1. **Added a seed local-library scaffold script:**
   - Added `scripts/maintenance/init-local-asset-library.ts`
   - Added npm script `assets:init`
   - The script creates the first recommended folder structure for:
     - footwear
     - plants
     - baskets
     - lamps
     - books
     - decor
     - console tables / chairs / stools
     - materials
     - HDRIs
   - It also creates:
     - `README.md`
     - `catalog/taxonomy.json`

2. **Extended the local asset library doc with sourcing guidance:**
   - Updated `docs/local-asset-library.md` with:
     - A23D guidance
     - the Poly Haven on-demand vs local-cache distinction
     - the new two-step bootstrap flow:
       1. `npm run assets:init`
       2. `npm run assets:catalog`

3. **Validation:**
   - `npx tsc --noEmit` passes
   - `npm run lint` passes
   - `npm run assets:init -- --root tmp/local-assets-seed` succeeds
   - `npm run assets:catalog -- --root tmp/local-assets-seed --out tmp/local-assets-seed/catalog/assets.json` succeeds and produces an empty starter manifest before assets are added

### Notes
- A23D looks useful as a selective paid source for local ingestion, but not as something to mirror wholesale into ViperMesh. Their public legal terms explicitly restrict circumvention/scraping and treat assets as licensed, not sold.
- Poly Haven should remain mostly on-demand through the existing integration. Only frequently reused assets need local caching.

## Last Session: 2026-03-29 (Local Asset Library MVP)

### What Was Done
1. **Added the first local curated asset-library layer to the live Studio stack:**
   - Added local asset MCP support to both addon copies:
     - `desktop/assets/vipermesh-addon.py`
     - `public/downloads/vipermesh-addon.py`
   - New Blender-side tools:
     - `get_local_asset_library_status`
     - `search_local_assets`
     - `import_local_asset`
   - Added addon UI settings for:
     - enabling the local asset library
     - setting the catalog JSON path
     - setting an optional library root path

2. **Wired the new tools into the live agent/runtime path:**
   - Added LangGraph tool wrappers in `lib/ai/agents.ts`
   - Added tool metadata in `lib/orchestration/tool-registry.ts`
   - Updated tool selection heuristics in `lib/orchestration/tool-filter.ts`
   - Updated the live system prompt in `lib/orchestration/prompts/blender-agent-system.md`
   - Updated UI/tool label maps in:
     - `components/projects/agent-activity.tsx`
     - `components/projects/step-session-drawer.tsx`
   - Updated post-run tool summaries in `app/api/ai/chat/route.ts`

3. **Added the first manifest/bootstrap layer for catalog population:**
   - Added schema/helpers in `lib/assets/local-catalog.ts`
   - Added bootstrap script `scripts/maintenance/build-local-asset-catalog.ts`
   - Added npm script `assets:catalog`
   - Added example manifest `data/local-assets/catalog.example.json`
   - Added local asset tool guide `data/tool-guides/local-asset-guide.md`
   - Added sourcing/design doc `docs/local-asset-library.md`

4. **Validation:**
   - `python -m py_compile desktop/assets/vipermesh-addon.py public/downloads/vipermesh-addon.py` passes
   - `npx tsc --noEmit` passes
   - `npm run lint` passes
   - `npm run assets:catalog -- --root tmp/local-assets-test --out tmp/local-assets-test/catalog/assets.json` generated a valid starter manifest

### Notes
- This is intentionally an MVP with no DB migration yet. The feature is configured through the Blender addon and live MCP tools so it can be tested immediately in Studio once the addon is reloaded.
- The bootstrap script discovers supported asset files and creates a starter manifest, but `.blend` entries still need manual `asset_names` refinement for precise imports.
- The intended routing order is now:
  1. local curated assets
  2. Poly Haven
  3. Sketchfab when explicitly enabled and license-safe
  4. procedural `execute_code`

## Last Session: 2026-03-28 (Validated Leftover OAuth + Addon Cleanup Changes)

### What Was Done
1. **Validated the remaining uncommitted user edits:**
   - `app/auth/start-oauth/page.tsx` switches the logo from raw `<img>` to `next/image`
   - `desktop/assets/vipermesh-addon.py` and `public/downloads/vipermesh-addon.py` both:
     - update `doc_url` from the old ModelForge repo to `https://github.com/Ker102/ViperMesh`
     - add explicit request timeouts to PolyHaven HTTP calls

2. **Verification:**
   - `npm run lint` passes
   - `python -m py_compile` passes for both addon copies
   - Confirmed the GitHub repository URL is live

### Notes
- The two addon copies are byte-identical after the change.
- These edits appear to be valid leftover local changes from an earlier session rather than new experimental work.

## Last Session: 2026-03-28 (Reference Reconstruction RAG Expansion)

### What Was Done
1. **Added generalized expert-pattern Blender scripts:**
   - Added `data/blender-scripts/reference_reconstruction_workflow.py`
   - Added `data/blender-scripts/support_surface_alignment.py`
   - These scripts encode the missing generalized patterns from the Studio image-reference analysis:
     - anchor-first blockout
     - camera-prominence-based refinement ordering
     - local-to-world attachment-point alignment
     - world-space bounding-box support placement
     - raycast-assisted drop placement for irregular surfaces

2. **Strengthened existing RAG guides with the same non-scene-specific rules:**
   - Extended `data/tool-guides/spatial-positioning-guide.md` with:
     - local-to-world attachment point alignment
     - world-space support-surface placement
     - raycast placement for sloped/irregular supports
   - Extended `data/tool-guides/scene-composition-guide.md` with a reference-reconstruction priorities section:
     - blockout anchors first
     - screenshot checkpoint before detail
     - refine by camera prominence
     - preserve recognizable silhouettes
     - use focused follow-up passes instead of full-scene rebuilds

### Notes
- This checkpoint is intentionally generalized. No scene-specific recipes or hardcoded placement heuristics were added.
- The goal is to narrow the gap between coarse first-pass agent scripts and expert reconstruction strategy without overfitting the corpus to the entryway test.

## Last Session: 2026-03-28 (Blender 5.x EEVEE Audit + RAG Factual Corrections)

### What Was Done
1. **Re-verified Blender 5.x EEVEE API against official docs:**
   - Confirmed from current Blender API docs that `scene.eevee.taa_render_samples` is still valid in Blender 5.x for final renders
   - Confirmed `scene.eevee.taa_samples` is the viewport sample property
   - Confirmed current AO distance lives on `view_layer.eevee.ambient_occlusion_distance`
   - Confirmed the current render engine enum is `BLENDER_EEVEE`

2. **Corrected inaccurate EEVEE guidance in the RAG corpus:**
   - Fixed `data/tool-guides/render-guide.md` so it no longer falsely claims `taa_render_samples` was removed
   - Rewrote the Blender 5.x EEVEE compatibility notes in:
     - `data/blender-scripts/api_version_compatibility.py`
     - `data/blender-scripts/tasks/rendering/eevee_setup.py`
     - `data/blender-scripts/render_settings.py`
     - `data/blender-scripts/tasks/rendering/render_configuration.py`
   - Updated the affected scripts to use Blender 5.x-compatible sampling, compositor bloom guidance, and view-layer AO handling

3. **Hardened compositor compatibility guidance:**
   - Replaced the hard claim that `scene.node_tree` is simply “removed” with a version-safe access pattern:
     prefer `scene.compositing_node_group` in Blender 5.x and fall back to `scene.node_tree` for older versions

### Notes
- This audit was triggered by the Studio entryway test review and a factual contradiction in the render guide
- The goal of this checkpoint is corpus correctness first; the next checkpoint will add new generalized expert-pattern scripts/guides for staged reference reconstruction and prop refinement

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

## Current Session: 2026-03-29

### What Was Done
1. **Expert Comparison Artifact for Test 20**
   - Added scene-specific expert comparison script at `scripts/expert/test20_entryway_expert.py`
   - Kept it outside the RAG corpus intentionally to avoid contaminating general retrieval with scene-specific patterns
   - Added reusable MCP helper runner at `scripts/test/run-blender-script.ts`

2. **Expert Scene Build Validation**
   - Validated the expert script with `python -m py_compile`
   - Confirmed the scene builds cleanly in Blender 5.0 headless mode
   - Saved preview outputs:
     - `tmp/expert-test20-render.png`
     - `tmp/expert-test20.blend`

3. **Crash Diagnosis**
   - First attempt crashed Blender 5.0 during a boot construction path that used a more aggressive merged/remesh style
   - Replaced that with a safer boot-construction approach that builds successfully
   - This expert artifact is now usable as the first manual comparison baseline for Test 20

### Current Status
- Expert scene script exists and builds successfully
- Plant silhouette is noticeably stronger than the agent output
- Boot silhouette has been refined again using a safer blended-body construction path and darker materials
- Current expert preview is materially closer to the reference than the earlier blocky boot pass

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

## Current Session: 2026-03-30

### What Was Done
1. **Managed Local Asset Defaults**:
   - Desktop app now bootstraps a managed local asset root automatically on startup at `Documents/ViperMeshAssets`
   - Added default managed catalog creation at `catalog/assets.json` and reserved cache directory at `cache/`
   - Blender addon now auto-discovers the same managed catalog/root by default while keeping manual override fields for BYO libraries
   - Desktop setup page now shows the managed library root, catalog path, cache root, and includes an "Open Managed Asset Folder" action
   - `assets:init` now seeds the same `cache/` structure and writes an empty `catalog/assets.json`

### Notes
- The reserved cache path is only a stable location for future managed downloads. The current runtime still imports local files directly.
- Manual `Catalog JSON` and `Library Root` overrides remain intact for advanced users and BYO asset libraries.
2. **Gemini Tool Schema Compatibility Fix**:
   - Fixed a Studio startup failure where Gemini rejected the `search_local_assets` tool schema because `limit` used a strict positive Zod constraint that serialized to JSON Schema `exclusiveMinimum`
   - Replaced that tool parameter constraint with a Gemini-safe integer range using `min(1)` and `max(25)`
3. **Studio Runtime Hardening for Local Assets + MCP Transport**:
   - Investigated Test 20 run `60874546-2f70-4a50-9f07-80fda1892f84`: local asset search failed once with `Local asset catalog path is not configured`, while 17 material calls failed with `ECONNREFUSED 127.0.0.1:9876`
   - Added a Blender-side local asset status probe to the live chat route and Studio workflow-step route, and now only expose `search_local_assets` / `import_local_asset` to the agent when Blender reports the local library as enabled and ready
   - Extended `/api/mcp/status` to include local asset runtime status, not just raw TCP reachability
   - Serialized MCP command execution in the app and added small retries for transient transport errors so Gemini tool bursts do not open a storm of parallel Blender TCP connections
   - This should prevent the exact failure mode where local asset tools are advertised while Blender is still on stale addon state, and reduce `ECONNREFUSED` churn during material batches
4. **Addon Version Visibility**:
   - Bumped the Blender addon metadata version from `1.1.0` to `1.2.0` in both distributed addon copies
   - Updated the Add-ons panel description to mention the Studio agent and managed asset-source support
   - Added a visible `Addon v1.2.0` label inside the ViperMesh sidebar so stale Blender installs are easier to identify without opening Blender preferences
