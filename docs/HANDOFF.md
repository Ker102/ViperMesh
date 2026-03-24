# ViperMesh — Session Handoff: 3D Pipeline Implementation

> **Date:** 2026-02-18
> **Previous Session:** Deep research + strategy planning for multi-strategy 3D pipeline
> **Next Action:** Begin Phase 1 (RAG Scripts) + Phase 2 (Neural Models on Azure ML) in parallel

---

## What Was Accomplished

We completed a full research sprint on how to evolve ViperMesh from a Blender-only procedural code-gen tool into a **multi-strategy 3D production platform**. Three generation strategies were identified and a 6-phase implementation plan was created.

### The Three Strategies
1. **Procedural** (existing) — LLM generates Blender Python → MCP executes → clean, editable output
2. **Neural** (new) — Open-source text/image-to-3D models (Hunyuan 3D, Shap-E, InstantMesh) on Azure ML
3. **Hybrid** (new, THE differentiator) — Neural mesh gen → Blender post-processing (retopo → rig → animate → export)

### Key Decision
**Use ONLY open-source models we can self-host and fine-tune** — NOT competitor APIs (Tripo, Meshy, Rodin). This gives us full control over cost, quality, and competitive advantage.

---

## Where All Knowledge Lives

### Strategy & Research Documents
| File | Contents |
|------|----------|
| `docs/3d-pipeline-strategy.md` | Competitor analysis, 3 approaches mapped, pipeline coverage matrix, revenue model, 10 research topics |
| `docs/research-pipeline-techniques.md` | Concrete Blender Python API code for retopology, auto-rigging (Rigify), PBR textures, procedural animation |
| `GEMINI.md` (Session Log: 2026-02-17) | Full session history, decisions made, files created |

### Research Sources (NotebookLM)
| Notebook | ID | Sources | Contents |
|----------|----|---------|----------|
| Mastering Blender Automation | `27a1b7ba-0b61-40ca-84e3-f8cce152a724` | 90 | Blender Python API docs, best practices, API pitfalls |
| ViperMesh 3D Pipeline Research | `c1ed9929-97af-4c67-944e-ec2932afa0a4` | 28 | Rigify deep research (61 web sources found, 28 imported) |

### Key Research Findings (from `docs/research-pipeline-techniques.md`)
- **Retopology**: `bpy.ops.object.voxel_remesh()` + `bpy.ops.object.quadriflow_remesh(target_faces=N)` — single-line APIs
- **Auto-Rigging**: `rigify.generate.generate_rig(ctx, metarig)` + `bpy.ops.object.parent_set(type='ARMATURE_AUTO')`
- **Animation**: Keyframe insertion, Blender 5.0 `channelbag.fcurves`, NLA strip composition
- **PBR Textures**: No dominant AI solution yet — best pattern is AI-generated maps + Principled BSDF loader
- **Blender 4.x/5.0 Migration**: Bone Layers → Bone Collections, action FCurves → channelbag FCurves

### Existing Codebase Context
| Path | What It Is |
|------|-----------|
| `data/blender-scripts/` | 127 RAG scripts (56 utility + 67 tasks + 4 NotebookLM) |
| `lib/orchestration/planner.ts` | AI planner — breaks user requests into steps |
| `lib/orchestration/executor.ts` | Step executor — generates + validates + runs Blender code |
| `lib/ai/prompts.ts` | All LLM prompts (planning, code generation, validation) |
| `lib/ai/rag.ts` | Vector similarity search against pgvector |
| `lib/ai/agents.ts` | LangChain agent with RAG + MCP tools |
| `lib/mcp/client.ts` | Blender MCP bridge (socket communication) |
| `lib/ai/vision.ts` | Viewport screenshot analysis via Gemini Vision |
| `training/` | Fine-tuning pipeline: 269 training pairs, QLoRA script, eval prompts |
| `scripts/ingest-blender-docs.ts` | RAG ingestion script (recursive, pgvector) |

### Open-Source 3D Models to Deploy
| Model | Input | License | Deploy On |
|-------|-------|---------|-----------|
| **Hunyuan 3D 2.0** | Text/Image | Tencent Open | Azure ML A100 |
| **Shap-E** | Text/Image | MIT | Azure ML T4 (cheaper) |
| **InstantMesh** | Single Image | Apache 2.0 | Azure ML A10G |
| **Spark** | Text | Open | Investigate further |

---

## Implementation Plan (6 Phases)

### Phase 1: RAG Script Creation (START NOW)
Create 6 new scripts in `data/blender-scripts/`:
1. `auto_retopology.py` — Voxel remesh + Quadriflow pipeline
2. `auto_rigify.py` — Rigify metarig → generate_rig() → auto weight paint
3. `auto_uv_unwrap.py` — Smart UV projection
4. `procedural_animation.py` — Keyframe math, NLA, orbit/bounce/wave patterns
5. `pbr_texture_loader.py` — Load texture maps → Principled BSDF
6. `model_export.py` — FBX/glTF/USD/OBJ + LOD generation

Then: update `lib/ai/prompts.ts` and run `npm run ingest:blender` to re-ingest.

All API code patterns are in `docs/research-pipeline-techniques.md`.

### Phase 2: Neural 3D Model Layer (START NOW, parallel with Phase 1)
Create `lib/neural/` — abstraction layer for open-source 3D model inference:
- `types.ts` — NeuralGenRequest/NeuralGenResult interfaces
- `model-registry.ts` — Model catalog + capability mapping
- `hunyuan/client.ts` — Azure ML endpoint client for Hunyuan 3D 2.0
- `shap-e/client.ts` — Azure ML endpoint client for Shap-E
- `instant-mesh/client.ts` — Azure ML endpoint client for InstantMesh
- `inference/azure-ml.ts` — Generic Azure ML managed endpoint caller

Azure ML setup: deploy models as Managed Online Endpoints (serverless, scale-to-zero).

### Phase 3: Hybrid Pipeline (after Phase 1 + 2)
Create `lib/orchestration/hybrid-pipeline.ts`:
- Neural gen → download mesh → MCP import to Blender → cleanup → retopo → UV → texture → rig → animate → export
- Create `import_cleanup.py` RAG script for neural mesh import + fix normals/doubles/holes

### Phase 4: Production Export Presets (after Phase 1)
Game-dev workflow compliance: LODs, normal baking, format presets (Game/VFX/Web/Print).

### Phase 5: AI Strategy Router (after Phase 2 + 3)
Create `lib/ai/strategy-router.ts` — auto-selects procedural vs neural vs hybrid per request.

### Phase 6: Credit System (after Phase 5)
Stripe metered billing per generation step. Tier pricing: Free ($0/20 credits) → Starter ($12/200) → Pro ($29/unlimited).

---

## Full Implementation Plan (Detailed)
See: `C:\Users\krist\.gemini\antigravity\brain\00537199-3b24-4f15-b798-38b6cb9e861c\implementation_plan.md`

## Git Status
- Branch: `main`, 8 commits ahead of origin
- Working tree: clean
- All research docs committed
