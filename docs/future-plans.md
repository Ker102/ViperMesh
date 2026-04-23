# ViperMesh — Future Plans & Roadmap

> **Last Updated:** 2026-04-20
> **Rule:** This file is the single source of truth for planned features. Do NOT merge these into gemini.md.
> **Competitive Analysis:** See `tripo_competitive_analysis.md` artifact for detailed Tripo P1.0 breakdown.

---

## P0 — In Progress / Immediate Next

1. ~~**Debug Test 13 failure**~~ — ✅ Resolved: Created `rigging-guide.md`, `animation-guide.md`, `weight-painting-guide.md` tool guides, fixed `auto_rigify.py`.
2. ~~**Verify AgentActivity streaming UI**~~ — ✅ Resolved: Streaming activity UI and Studio follow-through were verified through the live workflow/debug passes.
3. ~~**Run Tests 14-16**~~ — ✅ Resolved: The immediate neural/Studio validation batch was completed and the roadmap priority has moved to viewer/workflow polish rather than these placeholder test items.
4. ~~**Follow-up question quality**~~ — ✅ Resolved: The current Studio execution flow now prioritizes stage-aware workflow guidance and downstream actions instead of weak generic follow-up prompts.
5. **Viewer inspection follow-up: secondary heavy viewer path** — After the current `<model-viewer>` inspection/workflow polish batch is complete, build the next viewer implementation as a heavier diagnostic/editor surface for true wireframe, flat-vs-smooth shading inspection, and deeper geometry debugging that the current MVP stack cannot represent cleanly.

---

## P1 — Short Term (Critical Competitive Gaps)

### 🔴 3D Model Viewer Engine (HIGHEST PRIORITY)
When neural 3D models are generated, there is **no way to preview them in-app**. Users must open Blender.
Competitors (Tripo, Modiff, Meshy) all have in-browser 3D viewers.

**Recommended:** Google `<model-viewer>` web component (what Tripo/Zubnet use)
- Rotatable, zoomable GLB preview
- Wireframe/texture/normals toggle
- Download in multiple formats
- Side-by-side comparison of variants
- **Alternative:** Three.js for more control, Babylon.js for full PBR pipeline

**Current implementation reality (2026-04-20):**
- ViperMesh is already using `<model-viewer>` as the active Studio viewer surface for result inspection, download, clay/geometry-style inspection, and metadata overlays
- This remains the right MVP/review viewer
- **Next viewer implementation after the current Studio polish batch:** add a secondary heavier viewer path for true wireframe, flat/smooth shading diagnostics, and deeper material/geometry debugging that should not be faked inside the MVP stack

### 🟠 Tripo P1.0 API Integration
Tripo P1.0 generates production-ready assets in **2 seconds** (mesh) / **60 seconds** (PBR). ~$0.20/model.
- Direct API (no cold starts, always-on infrastructure)
- Text-to-3D, Image-to-3D, Multiview-to-3D
- Smart Low-Poly (`smart_low_poly=true`), Quad Mesh (`quad=true`), Face Limit control
- Auto-size to real-world meters
- Parts segmentation via API
- **Action:** Create `tripo-client.ts` provider in `lib/neural/providers/`

### 🟠 Multi-View Input (Partially Implemented)
Hunyuan3D 2.0 natively supports multi-view input but it is **not wired** in our `fal-client.ts`.
Tripo API accepts exactly 4 views (front, left, back, right).
- **Action:** Wire multi-image input in existing Hunyuan client + new Tripo client

### Pipeline Gaps (from `3d-pipeline-strategy.md`)
| Stage | Status | Target | Approach |
|-------|--------|--------|----------|
| Topology | ⚠️ Basic | ✅ Auto retopology | Quadriflow/Instant Meshes via MCP |
| UV Unwrap | ❌ Not automated | ✅ Smart UV unwrap | Blender's Smart UV Project via MCP |
| Rigging | ✅ Guide created | ✅ Auto-rig | Rigify via `rigging-guide.md` + `auto_rigify.py` + Blender addon integration |
| Animation | ✅ Guide created | ✅ Keyframe animation | `animation-guide.md` + keyframe gen via agent |
| Weight Paint | ✅ Guide created | ✅ Quality weights | `weight-painting-guide.md` cleanup pipeline |
| Export | ❌ Not implemented | ✅ Multi-format | FBX/glTF/USD via Blender export API |

### Skill Guides (Research-Backed)
- ✅ Rigging best practices → `data/tool-guides/rigging-guide.md`
- ✅ Animation/keyframing patterns → `data/tool-guides/animation-guide.md`
- ✅ Weight painting workflow → `data/tool-guides/weight-painting-guide.md`
- Particle/effects systems
- UV unwrapping workflow

---

## P2 — Medium Term (Quality, Polish & Advanced Features)

### 🔴 In-Browser Model Editing Tools
Inspired by Tripo Studio and Modiff:
- **AI Texture Brush** — Brush over areas on 3D model → AI inpaints/enhances textures in real-time. Architecture: NVIDIA Diffusion Texture Painting (stamp-based SD Inpainting in local render space → UV reprojection). This is what Modiff uses internally. Open-source path: SD Inpainting on RunPod/fal.ai + Three.js projection loop.
- **Intelligent Segmentation** — Auto-split fused mesh into logically organized, editable parts
- **Model Stylization** — Transform models to Lego, voxel, Voronoi styles (Tripo feature)

### 🟠 Animation Preview & Library
- Embed rigged model viewer with **MoCap animation library** (Tripo has 100+ biped animations)
- **Lock Frame** — Freeze animated pose → export as static model
- Preview animations on rigged models directly in UI (no Blender required)

### Other P2 Items
1. **Image reference workflow** — Backend wiring done, test with "recreate this scene" prompts
2. **Agent thought streaming** — Show reasoning text between tool calls (agent:thought events)
3. **Built-in addon integrations** (from `addon-integration-roadmap.md`):
   - Node Wrangler (auto-connect texture nodes)
   - Cell Fracture (destruction effects)
   - A.N.T. Landscape (procedural terrain)
   - Sapling Tree Gen (procedural trees)
   - Archimesh (architectural elements)
4. **Visual feedback loop improvements** — Agent sees viewport, auto-corrects quality issues

---

## P3 — Long Term (Competitive Moat)

1. **Full Tripo Studio Parity** — Unified browser workspace: generate → edit → texture → rig → animate → export
2. **Free community addon integrations** (Priority 2 from `addon-integration-roadmap.md`):
   - Realtime Materials, BY-GEN, Nature Clicker, Geo Cables
3. **Fine-tuning pipeline** — Custom Qwen3 for Blender code (269+ training pairs exist)
4. **Revenue/monetization** — Credits + tiers system (Free/Starter/Pro)
5. **Production pipeline completeness** — Concept → Export in one session
6. **Blender agent toolification layer** — Replace repeated full-length freeform Blender Python generation with a curated tool layer that maps agent intents onto prebuilt Python snippets/scripts, parameterized runners, and reusable API wrappers so the agent can act faster, hallucinate less, and produce more reliable deterministic edits.

### 🤖 Autopilot: Neural Model Agent Integration (Far Future)
Connect the Blender agent to neural models so it can command the full 3D pipeline autonomously.
Requires RunPod Serverless deployment for each model + agent tool wiring.

| Model | Purpose | Client Code | RunPod Status |
|-------|---------|-------------|---------------|
| Hunyuan Paint | Texture painting | `runpod-client.ts` | ✅ Deployed |
| Hunyuan Part | Part segmentation | `runpod-client.ts` | ✅ Deployed |
| UniRig | AI auto-rigging (SIGGRAPH 2025) | `unirig-client.ts` | ❌ Not deployed |
| MoMask | Text-to-motion animation | `momask-client.ts` | ❌ Not deployed |
| MeshAnything V2 | AI retopology | `meshanything-v2-client.ts` | ❌ Not deployed |

**Flow:** Agent creates mesh → exports GLB → calls neural API → imports rigged/animated result back.
**Prerequisite:** Verify agent+RAG capability first, then addon integration, then neural model wiring.

---

## Related Documents
- [`addon-integration-roadmap.md`](./addon-integration-roadmap.md) — Detailed addon integration plan (147 lines)
- [`3d-pipeline-strategy.md`](./3d-pipeline-strategy.md) — Full competitive analysis and pipeline strategy
- [`original-legacy-plan.txt`](./original-legacy-plan.txt) — Original project plan
- [`rag-scaling-plan.md`](./rag-scaling-plan.md) — RAG scaling strategy
- [`test-prompts.md`](./test-prompts.md) — Test suite with AI Model Availability Analysis
- `tripo_competitive_analysis.md` — Tripo P1.0 detailed competitive analysis (artifact)
