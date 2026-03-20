# ModelForge — Future Plans & Roadmap

> **Last Updated:** 2026-03-20
> **Rule:** This file is the single source of truth for planned features. Do NOT merge these into gemini.md.

---

## P0 — In Progress / Immediate Next

1. **Debug Test 13 failure** — Rigify rigging test failed (agent didn't execute tools). Reproduce and fix.
2. **Verify AgentActivity streaming UI** — Component is wired (`agent-activity.tsx`) but unconfirmed in live runs.
3. **Run Tests 14-16** — UniRig AI auto-rigging, keyframe animation, MoMask text-to-motion.
4. **Follow-up question quality** — Post-execution follow-up questions are weak/irrelevant. Needs prompt engineering in `route.ts`.

---

## P1 — Short Term (Pipeline Completeness) Might not be relevant anymore

### Pipeline Gaps (from `3d-pipeline-strategy.md`)
| Stage | Status | Target | Approach |
|-------|--------|--------|----------|
| Topology | ⚠️ Basic | ✅ Auto retopology | Quadriflow/Instant Meshes via MCP |
| UV Unwrap | ❌ Not automated | ✅ Smart UV unwrap | Blender's Smart UV Project via MCP |
| Rigging | ❌ Not implemented | ✅ Auto-rig | Rigify addon (built-in) + UniRig AI |
| Animation | ❌ Not implemented | ✅ AI-driven animation | MoMask + keyframe gen via code |
| Export | ❌ Not implemented | ✅ Multi-format | FBX/glTF/USD via Blender export API |

### Skill Guides (General-Purpose — never scene-specific!)
- Rigging best practices (Rigify workflow, weight painting)
- Animation/keyframing patterns (easing, timeline setup)
- Particle/effects systems
- UV unwrapping workflow

### Neural Tool Integrations
- **Skeleton**: Mixamo auto-rigger or RigNet for automated rigging
- **Motion**: MoMask text-to-motion (CVPR 2024) — client exists at `lib/neural/providers/momask-client.ts`
- **Cleanup**: MeshAnything V2 for auto-retopology
- **Texturing**: Additional texture generation models beyond Yvo3D

---

## P2 — Medium Term (Quality & Polish)

1. **Image reference workflow** — Backend wiring done, test with "recreate this scene" prompts
2. **Agent thought streaming** — Show reasoning text between tool calls (agent:thought events)
3. **Built-in addon integrations** (from `addon-integration-roadmap.md`):
   - Node Wrangler (auto-connect texture nodes)
   - Cell Fracture (destruction effects)
   - A.N.T. Landscape (procedural terrain)
   - Sapling Tree Gen (procedural trees)
   - Archimesh (architectural elements)
4. **More tool context guides** for new tool categories as they're added
5. **Visual feedback loop improvements** — Agent sees viewport, auto-corrects quality issues

---

## P3 — Long Term (Competitive Moat)


2. **Free community addon integrations** (Priority 2 from `addon-integration-roadmap.md`):
   - Realtime Materials, BY-GEN, Nature Clicker, Geo Cables
3. **Fine-tuning pipeline** — Custom Qwen3 for Blender code (269+ training pairs exist)
4. **Revenue/monetization** — Credits + tiers system (Free/Starter/Pro)
5. **Production pipeline completeness** — Concept → Export in one session

---

## Related Documents
- [`addon-integration-roadmap.md`](./addon-integration-roadmap.md) — Detailed addon integration plan (147 lines)
- [`3d-pipeline-strategy.md`](./3d-pipeline-strategy.md) — Full competitive analysis and pipeline strategy
- [`original-legacy-plan.txt`](./original-legacy-plan.txt) — Original project plan
- [`rag-scaling-plan.md`](./rag-scaling-plan.md) — RAG scaling strategy
- [`test-prompts.md`](./test-prompts.md) — Test suite with AI Model Availability Analysis
