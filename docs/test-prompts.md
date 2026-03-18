# ModelForge Blender Agent — Stress Test Prompts

## How to Use

Run each prompt one at a time in Studio mode. After each prompt completes,
verify the result visually in Blender and note any issues before moving on.

**Reset scene between tests** (type in Studio): `Delete everything and start with a default cube`

---

### Test 1: Materials + Lighting Basics
**Tests:** `create_material`, `assign_material`, `add_light`, `set_light_properties`
```
Make the default cube a glossy red metallic material (like a sports car),
then add a large soft area light above it and a blue-tinted fill light
from the lower right.
```
**What to verify:**
- Cube should have a red metallic material (not matte, should reflect light)
- Two new lights visible in scene outliner
- Agent should use `create_material` + `assign_material`, NOT `execute_code` for the material
- Agent should use `add_light` for each light, NOT `execute_code`

---

### Test 2: Multi-Object Scene with Transforms
**Tests:** `execute_code`, `duplicate_object`, `rename_object`, `set_object_transform`, `create_material`, `assign_material`
```
Create a display podium scene: make a flat cylinder as a pedestal in the center,
place three different colored spheres on top of it spaced evenly apart (red, green, blue),
and name them Ball_Red, Ball_Green, and Ball_Blue.
```
**What to verify:**
- Pedestal cylinder should be flat and centered
- Three named spheres sitting ON the pedestal (not floating)
- Each sphere should have its own colored material
- Scene outliner shows all named objects

---

### Test 3: Modifier Chain + Smooth Shading
**Tests:** `add_modifier`, `shade_smooth`, `create_material`, `assign_material`
```
Take the default cube and turn it into a smooth organic shape: add a subdivision
surface modifier (level 3), apply smooth shading, and give it a jade-green
semi-translucent material with slight subsurface scattering.
```
**What to verify:**
- Cube should look like a smooth rounded shape (SubSurf level 3)
- Smooth shaded (no facets visible)
- Green material with some translucency
- Modifier visible in properties panel

---

### Test 4: Camera Setup + Render
**Tests:** `add_camera`, `set_camera_properties`, `set_render_settings`, `render_image`
```
Set up a camera for a product shot: place it at a 45-degree angle looking down
at the scene center, use a 85mm portrait lens, enable depth of field focused
at 5 meters with f/2.8 aperture, then render the scene at 1920x1080 using EEVEE.
```
**What to verify:**
- Camera appears in scene at correct angle (~45°)
- Camera distance from origin is **8–12m** (location like `(6, -6, 5)` = ~9.8m ✓)
- Switch to camera view (Numpad 0) — subject should occupy 30–70% of the frame
- `execute_code` is acceptable for Track To constraint setup (no direct tool for constraints)
- Render settings panel shows 1920×1080, EEVEE
- A rendered image should be produced
- **Timing target:** < 60 seconds, ≤ 5 tool calls

---

### Test 4b: Multi-Camera Cinematic Rig
**Tests:** Camera placement at different focal lengths, scene composition, multiple cameras
```
Create a cinematic scene with three cameras:
1. A wide establishing shot using a 24mm lens from position (3, -2, 1.7) aimed at the center
2. A dramatic low-angle hero shot with a 35mm lens from below looking up
3. A tight product close-up with a 135mm telephoto lens from far away
Set each camera with appropriate names. Make camera 3 the active render camera
and render the scene at 2K resolution (2560x1440) using EEVEE.
```
**What to verify:**
- Scene has 3 cameras with distinct names
- Camera 1: near `(3, -2, 1.7)`, lens=24mm — wide shot
- Camera 2: low position (z < 1m), lens=35mm — dramatic angle, ~5-7m distance
- Camera 3: far away (**12-20m** for 135mm telephoto), active render camera
- Render output at 2560×1440
- Agent should use Track To constraints or equivalent for aiming
- **Timing target:** < 120 seconds

---

### Test 4c: Architectural Interior Setup
**Tests:** Wide-angle camera in tight space, proper framing without distortion
```
Set up the scene as if we're photographing an interior room. Place a camera at
eye level (1.7m height) using a 24mm wide-angle lens. The camera should be at
position (3, -1, 1.7) looking into the room toward (0, 5, 1.5). Enable depth
of field with focus at 4 meters and f/5.6 for mostly-sharp results. Set render
to Cycles with 128 samples and denoising enabled, output at 1920x1080.
```
**What to verify:**
- Camera at eye level (z ≈ 1.7m), lens=24mm
- Camera distance from target is 3-5m (correct for 24mm wide angle)
- DOF: focus_distance=4m, f_stop=5.6
- Render engine is Cycles, samples=128, denoising on
- Agent should NOT place camera far away (it's 24mm, not telephoto)
- **Timing target:** < 60 seconds, ≤ 5 tool calls

---

### Test 5: Organization + Export Pipeline
**Tests:** `duplicate_object`, `move_to_collection`, `rename_object`, `export_object`, `set_visibility`
```
Duplicate the cube, move the original into a collection called "Archive" and hide it
in the viewport. Rename the duplicate to "HeroCube". Then export only HeroCube
as a GLB file.
```
**What to verify:**
- "Archive" collection should exist in outliner
- Original cube should be hidden (eye icon off)
- "HeroCube" should be visible
- GLB file should exist on disk
- Agent should use `move_to_collection`, `set_visibility`, `export_object` directly

---

### Test 6: Complex Scene from Scratch (Full Pipeline)
**Tests:** `execute_code`, `create_material`, `assign_material`, `add_light`, `add_camera`, `set_render_settings`, `shade_smooth`, `add_modifier`
```
Build a desktop scene: create a wooden table (flat box, 2m x 1m x 0.05m, raised
to 0.75m height), place a metallic silver laptop on it (simplified box shape),
and add a coffee mug next to it (cylinder with handle). Give each object
appropriate materials. Add warm overhead lighting and render the scene.
```
**What to verify:**
- Table at correct height (0.75m)
- Laptop and mug ON the table surface (not floating, not clipping through)
- Each object has a distinct material
- Scene is properly lit (not too dark, not blown out)
- Rendered image produced

---

### Test 7: PolyHaven HDRI + Material
**Tests:** `search_polyhaven_assets`, `download_polyhaven_asset`, `create_material`, `assign_material`
```
Search PolyHaven for a studio HDRI and apply it as the scene background.
Then make the default cube a mirror-like chrome material so it reflects
the HDRI environment.
```
**What to verify:**
- Background should show a studio environment (not pink, not black)
- Cube should be highly reflective (chrome look)
- HDRI reflections visible on the cube surface
- In rendered mode, the environment should be visible

---

### Test 8: Edit Existing Scene (Non-Destructive)
**Tests:** `get_scene_info`, `get_object_info`, `set_object_transform`, `set_light_properties`, `create_material`, `assign_material`
```
Look at the current scene and tell me what objects are in it, then make these
changes without deleting anything: move the cube 2 units up, change any existing
light to have double its current energy, and make the cube bright orange.
```
**What to verify:**
- Agent should call `get_scene_info` first to discover the scene
- Cube should move up (Z increased by 2) but not be recreated
- Light energy should be doubled from whatever it was
- Cube color changes to orange
- No objects deleted — everything else preserved

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
