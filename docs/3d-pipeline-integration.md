# ViperMesh Pipeline — Integration Architecture & Provider APIs

## The Full Production Pipeline

```
USER PROMPT
    │
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. GEOMETRY  │───▶│  2. TEXTURE   │───▶│ 3. TOPOLOGY  │
│  Base mesh    │    │  PBR maps     │    │  Clean quads  │
│  Shape/form   │    │  UV unwrap    │    │  Edge loops   │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
    ┌─────────────────────────────────────────┘
    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  4. RIGGING   │───▶│ 5. ANIMATION  │───▶│  6. EXPORT   │
│  Skeleton     │    │  Keyframes    │    │  GLB/FBX/USD │
│  Weight paint │    │  Motion       │    │  Game-ready   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Provider API Integration Plan

### Tier 1: REST APIs (Integrate Now)

**Rodin/Hyper3D** — Already partially integrated (Rodin job polling exists)
- Endpoint: `https://hyperhuman.deemos.com/api/v2/rodin`
- Modes: Sketch (~20s), Regular (~70s), Gen-2 (~90s)
- Input: text prompt OR image(s), Output: GLB/OBJ/FBX
- Features: 4K textures, adjustable polycount, multi-view, PBR
- Flow: Submit task → poll status → download result → import to Blender

**Tripo AI** — Python SDK available
- Endpoint: `https://api.tripo3d.ai/v2/openapi`
- Full pipeline: generate → retopology → texture → rig → animate
- One-click rigging (unique selling point)
- Export: FBX, OBJ, GLB

**Meshy AI** — REST API
- Text/image to 3D with PBR texturing
- Good for high-fidelity static assets

### Tier 2: Open Source (Self-Host or HuggingFace)

**Hunyuan 3D v2** (Tencent) — GitHub + HuggingFace Space
- Open-source, can self-host or use free HF space
- Text/image (1-4 photos) to mesh + texture
- AI retopology, rigging built-in

**TRELLIS** (Microsoft) — Open source, ComfyUI integration

**Meta SAM 3D** — Single image to full 3D reconstruction
- Reconstructs shape, texture, AND spatial layout
- Free playground + open source

### Tier 3: Specialized Tools

**YVO3D** — Texture specialist ($9.99/mo)
**Sparc3D/Hitem3D** — Ultra HD mesh ($19.90/mo)
**Spline** — Browser 3D editor with AI generation

## ViperMesh's Competitive Advantage

### What 3D-Agent Does (Our Closest Competitor)
- Text → Blender Python → 3D model (same as us)
- Uses Claude + MCP
- Clean topology claims
- No RAG, no vision, no multi-provider, no scene editing

### What We Do Better
1. **RAG Pipeline** — 127 professional scripts inform every generation
2. **Visual Feedback** — Gemini Vision sees viewport, auto-corrects
3. **Scene Editing** — Edit existing scenes, not just create new ones
4. **Multi-Step Planning** — ReAct planner with per-step validation
5. **LLM Completeness Check** — Verifies final scene matches request

### What Nobody Else Does (Our Moat)
**Multi-Provider Orchestration + Blender Post-Processing**

```
User: "Create a game-ready dragon character"
    │
    ├─▶ Rodin Gen-2: Generate base mesh from prompt (90s)
    ├─▶ Import GLB into Blender via MCP
    ├─▶ Blender: Clean topology (decimate, remesh, quads)
    ├─▶ YVO3D or Blender: Generate/refine PBR textures
    ├─▶ Tripo API: Auto-rig the model
    ├─▶ Blender: Weight paint corrections
    ├─▶ Blender: Add keyframe animations
    ├─▶ Vision: Screenshot → verify quality
    └─▶ Export: FBX for Unity/Unreal, GLB for web
```

Nobody combines external AI generation with Blender post-processing.

## Implementation Phases

### Phase 1: Multi-Provider Generation (Next Sprint)
- [ ] Abstract provider interface: `generate3D(prompt, provider, options)`
- [ ] Integrate Tripo API (full pipeline: generate → rig → animate)
- [ ] Enhance existing Rodin integration with Gen-2 support
- [ ] Add Meshy API for high-fidelity static assets
- [ ] UI: Provider selector in chat (auto-suggest best provider)

### Phase 2: Pipeline Orchestration
- [ ] Auto-import generated models into Blender scene
- [ ] Blender post-processing: retopology, UV cleanup, material setup
- [ ] Vision validation: Screenshot imported model, verify quality
- [ ] Provider comparison: Generate from 2 providers, let user pick

### Phase 3: Specialized Integrations
- [ ] Hunyuan 3D HuggingFace API for free-tier users
- [ ] Meta SAM 3D for image-to-3D reconstruction
- [ ] Three.js/code-based generation for parametric shapes
- [ ] Spline-style browser preview before Blender import

### Phase 4: Full Production Pipeline
- [ ] End-to-end: prompt → mesh → texture → rig → animate → export
- [ ] Preset workflows: "Game asset", "Arch viz", "Animation character"
- [ ] Batch generation: Multiple assets for a scene
- [ ] Version control: Track asset iterations

## Revenue Model Impact

| Tier | Current | With Multi-Provider |
|------|---------|-------------------|
| Free | Blender-only generation | + Hunyuan 3D (free), Meta SAM 3D |
| Starter ($12) | Blender + basic RAG | + Rodin Sketch (fast), Tripo basic |
| Pro ($29) | Full RAG + vision | + Rodin Gen-2, Tripo full pipeline, Meshy HD |

## Sources
- [top3d.ai](https://top3d.ai) — Community leaderboard
- [Hyper3D API](https://developer.hyper3d.ai) — Rodin REST API docs
- [Tripo API](https://platform.tripo3d.ai) — Python SDK + REST
- [Hunyuan 3D](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) — Open source
- [Meta SAM 3D](https://ai.meta.com/research/sam3d/) — Research + playground
- [3D-Agent](https://3d-agent.com) — Direct competitor analysis
- [Spline](https://spline.design) — Browser 3D editor
