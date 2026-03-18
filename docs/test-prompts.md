# ModelForge Blender Agent — Test Prompts & AI Model Analysis

## Test Prompts by Tool Category

Each prompt below is designed to test a specific tool category in the Studio mode.
Run them one at a time and verify the agent completes the task correctly.

---

### 1. Shape (Geometry Generation)
```
Create a low-poly medieval sword with a detailed cross-guard and pommel.
The blade should be slightly tapered and about 1.2 meters long.
```

### 2. Cleanup (Mesh Optimization)
```
Clean up the mesh in the scene: remove duplicate vertices, recalculate normals
to face outward, remove any loose vertices or edges, and apply smooth shading.
```

### 3. Unwrap (UV Mapping)
```
UV unwrap all mesh objects in the scene using Smart UV Project with an island
margin of 0.02. Make sure each object has a proper UV map named "UVMap".
```

### 4. Paint (Materials & Texturing)
```
Apply a realistic brushed gold material to the sword blade with subtle
anisotropic reflections, and a dark leather wrap material to the grip
with a bump texture for stitching detail.
```

### 5. Skeleton (Rigging)
```
Add a simple armature to the sword with 3 bones: a root bone at the pommel,
a blade bone spanning the blade length, and a tip bone at the blade end.
Parent the mesh to the armature with automatic weights.
```

### 6. Motion (Animation)
```
Create a spinning animation for the sword: rotate it 360 degrees around the
Z-axis over 120 frames with ease-in-out interpolation. Set the timeline to
start at frame 1 and end at frame 120.
```

### 7. Effects (Particles & Physics)
```
Add a particle system to emit small golden sparkle particles from the blade
edge. Use a short lifetime of 15 frames, random velocity, and a small emissive
material so they glow. Emit about 100 particles per frame.
```

### 8. Lighting (Scene Illumination)
```
Set up a three-point lighting rig: a warm key light (3500K) at 45 degrees
from front-left, a cool fill light (6500K) at lower intensity from the right,
and a subtle rim light from behind. Use area lights for soft shadows.
```

### 9. Scene (Environment Setup)
```
Create a simple studio backdrop: add a curved plane as an infinity cove behind
the sword, set the world background to a dark gradient, and position the camera
at a 30-degree angle looking slightly down at the sword.
```

### 10. Render (Output Configuration)
```
Configure Cycles render settings: set resolution to 1920x1080, samples to 256,
enable denoising with OpenImageDenoise, set film to transparent background,
and configure the output format as PNG with 16-bit color depth.
```

### 11. Export (File Output)
```
Export the sword mesh as a glTF 2.0 binary (.glb) file with embedded textures.
Include only the mesh and materials, not the lights or camera. Apply modifiers
before export.
```

---

## AI Model Availability Analysis

The table below shows which tool categories currently have or could benefit from
specialized AI models, beyond just the Blender agent's code execution.

| # | Tool | Blender Agent | Neural AI Model Available? | Notes |
|---|------|:---:|:---:|-------|
| 1 | **Shape** | ✅ | ✅ **Yes** | Hunyuan3D 2.1 (fal.ai), TRELLIS 2 (fal.ai) — text/image → 3D mesh. Already integrated via `generate_neural_mesh`. |
| 2 | **Cleanup** | ✅ | ⚠️ **Emerging** | [InstantMesh](https://github.com/TencentARC/InstantMesh) does auto-retopo. [MeshAnything V2](https://github.com/buaacyw/MeshAnythingV2) converts neural meshes to clean artist-topology quads. Not yet integrated. |
| 3 | **Unwrap** | ✅ | ⚠️ **Emerging** | [xatlas](https://github.com/jpcy/xatlas) is algorithmic (not AI). Research exists (Neural UV Parameterization) but no production-ready API models. Blender's Smart UV Project is the practical choice. |
| 4 | **Paint** | ✅ | ✅ **Yes** | Hunyuan-Paint (RunPod), YVO3D (external API) for PBR texture generation. TRELLIS 2 also generates textured meshes. Already integrated. |
| 5 | **Skeleton** | ✅ | ✅ **Yes (not integrated)** | [RigNet](https://zhan-xu.github.io/rig-net/) — neural auto-rigging. [AccuRIG](https://actorcore.reallusion.com/auto-rig) by Reallusion. Mixamo (Adobe) has a free auto-rigger API. **Integration opportunity.** |
| 6 | **Motion** | ✅ | ✅ **Yes (not integrated)** | [MotionDiffuse](https://mingyuan-zhang.github.io/projects/MotionDiffuse.html), [MDM](https://guytevet.github.io/mdm-page/), [MoMask](https://ericguo5513.github.io/momask/) — text-to-motion generation. [Rokoko](https://www.rokoko.com/) offers motion capture APIs. **High-value integration opportunity.** |
| 7 | **Effects** | ✅ | ❌ **No** | Particle systems and physics sims are too interactive/Blender-specific. No viable external AI models for procedural VFX within Blender. Agent-only is the right approach. |
| 8 | **Lighting** | ✅ | ⚠️ **Indirect** | [PolyHaven HDRIs](https://polyhaven.com/) already integrated for IBL. AI lighting estimation from reference images (e.g., DiffusionLight) exists but no production APIs. Agent-based lighting is practical. |
| 9 | **Scene** | ✅ | ❌ **No** | Scene composition is subjective and context-dependent. The Blender agent + CRAG scripts handle this well. No external AI scene composition APIs exist. |
| 10 | **Render** | ✅ | ⚠️ **Indirect** | AI denoising (OIDN, OptiX) is built into Blender. Cloud render farms (SheepIt, RenderStreet) have APIs but aren't AI models. Agent-based config is the right approach. |
| 11 | **Export** | ✅ | ❌ **No** | Export is a deterministic pipeline operation. No AI needed — the agent handles format selection and settings via Blender Python. |

### Summary: Integration Priorities

**Already integrated (2/11):**
- Shape → Hunyuan3D, TRELLIS 2
- Paint → Hunyuan-Paint, YVO3D

**High-value integration opportunities (2/11):**
- **Skeleton** → Mixamo auto-rigger or RigNet would dramatically reduce manual rigging work
- **Motion** → Text-to-motion models (MotionDiffuse, MDM) would enable "make the character walk naturally" type prompts

**Emerging / research-only (3/11):**
- Cleanup → MeshAnything V2 (auto-retopology)
- Unwrap → No production-ready AI UV models
- Lighting → AI lighting estimation from reference photos

**Agent-only is correct (4/11):**
- Effects, Scene, Render, Export — these are Blender-specific or deterministic, no meaningful AI model exists
