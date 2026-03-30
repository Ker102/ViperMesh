# ViperMesh Blender Agent — Stress Test Prompts

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

### Test 9: Full Production Scene (Stress Test)
**Tests:** `get_scene_info`, `execute_code`, `create_material`, `assign_material`, `add_modifier`, `shade_smooth`, `add_light`, `add_camera`, `set_camera_properties`, `set_render_settings`, `move_to_collection`, `set_visibility`, `rename_object`, `render_image`
```
Start by checking what's already in the scene. Then build a product showcase:

1. Create a circular pedestal (flattened cylinder, radius 1.5m, height 0.1m) and
   give it a glossy dark marble material (very dark gray, roughness 0.1).
2. Place three different primitive objects on TOP of the pedestal, evenly spaced
   in a triangle pattern: a UV sphere (radius 0.3), a cone (radius 0.25, height 0.5),
   and a torus (major radius 0.3, minor radius 0.1). Smooth-shade all three.
3. Give each object a distinct metallic material: gold sphere, copper cone,
   silver torus.
4. Add a subdivision surface modifier (level 2) to the sphere to make it
   perfectly round.
5. Add three-point lighting: a strong key light (warm white, 500W) from
   the front-right at 45°, a softer fill light (200W, cool blue tint) from
   the left, and a rim light (300W) from behind.
6. Set up a camera with a 50mm lens at a 30° downward angle, about 5 meters
   from the pedestal center. Enable DOF focused on the pedestal with f/2.8.
7. Organize: move all three showcase objects into a collection called "Products"
   and hide the default cube if it exists.
8. Set render to EEVEE at 1920x1080 and render the final image.
```
**What to verify:**
- Agent called `get_scene_info` first (scene awareness)
- Pedestal exists as cylinder with correct dimensions
- All 3 objects are ON the pedestal surface (z ≈ 0.1 + half their height), not floating
- Each object has a unique metallic material (gold, copper, silver)
- Sphere has subdivision modifier and is smooth-shaded
- Three-point lighting present (3 separate lights with different energies)
- Camera: 50mm lens, ~5m from origin, DOF at f/2.8
- "Products" collection exists with the 3 objects inside
- Default cube hidden or absent
- `render_image` called exactly **once** (dedup should prevent duplicates)
- **Timing target:** < 120 seconds, ≤ 15 tool calls

---

### Test 10: Spatial Reasoning & Aesthetic Judgement (No Exact Values)
**Tests:** Model's ability to infer correct positions, proportions, materials, and lighting without being told exact numbers
```
Build a simple outdoor park bench scene. There should be a wooden bench that
looks like a real park bench — proper proportions, sitting height, with a backrest.
Place a street lamp next to it that's taller than a person would be. Put a small
trash can on the other side of the bench. Everything should sit on a flat ground
plane. Light the scene as if it's a warm sunset — golden light coming from a low
angle. Set up a camera that frames the whole scene nicely and render it.
```
**What to verify (subjective — judge by eye):**
- Bench looks proportional (seat height ~0.45-0.5m, reasonable width ~1.5m, has a backrest)
- Street lamp is tall (>2m, ideally ~3-4m) — NOT the same height as the bench
- Trash can is small relative to the bench (~0.5-0.8m tall)
- Objects are positioned side by side, not overlapping or stacked
- Everything sits ON the ground plane (z ≈ 0 for bases), nothing floating
- Ground plane exists and is large enough to extend under all objects
- Lighting looks warm/golden, coming from a low angle (not overhead noon sun)
- Camera frames the entire scene — all objects visible, nothing cut off
- Materials make visual sense: wood-like for bench, metal for lamp, etc.
- **This test has NO right answer** — the goal is to see how close the model's spatial intuition is to what a human would expect

---

### Test 11: Stylized Interior Scene (Creative Spatial Reasoning)
**Tests:** Spatial layout of multiple furnishings, wall-relative placement, warm atmospheric lighting, material variety — all from a vague "vibes" prompt with no exact values
```
Create a cozy low-poly style coffee shop interior. I want a small room about
4 meters wide and 5 meters deep with walls and a floor. Put a service counter
along the back wall with a simple coffee machine on it. Place 3 bar stools
in front of the counter. Add a small round table with two chairs near the
front-left corner. There should be a large window on the left wall letting
in natural light. Make it feel warm — use wooden materials for furniture
and warm-toned lighting. Set up a nice camera angle and render it.
```
**What to verify (spatial + aesthetic checks):**
- Room exists with roughly correct proportions (~4×5m), has floor and at least 2-3 walls
- Counter is **against the back wall** (Y ≈ back wall position, not floating in middle)
- Coffee machine is **on top of** the counter (Z = counter height + half machine height)
- 3 bar stools are in front of the counter (between counter and camera), evenly spaced
- Table + 2 chairs are in the front-left area, chairs near the table
- Window exists on the left wall
- Materials are varied: wood for furniture, different material for walls/floor
- Lighting is warm-toned, not harsh or cold
- Objects are **grounded** — nothing floating
- Camera frames the room showing the interior nicely
- **Timing target:** < 180 seconds (complex scene)

---

### Test 12: Modular Game Asset (Technical Precision)
**Tests:** Technical asset creation, emissive materials, dimensional precision, export pipeline
```
Build a stone dungeon corridor wall segment for a game. The wall should be exactly
3 meters wide, 3 meters tall, and 0.3 meters thick. Use a dark gray stone material
with some roughness. Add two wall-mounted torch holders (simple bracket shapes)
placed symmetrically at 2 meter height, one on each side. Give the torches a warm
orange emissive glow. The segment should be centered at the origin so it's easy
to tile. Export as GLB to /tmp/dungeon_wall.glb and also render a preview.
```
**What to verify:**
- Wall dimensions match: ~3m wide (X), ~3m tall (Z), ~0.3m thick (Y)
- Wall is centered at origin (position ≈ 0,0,1.5 for centered origin)
- Stone material applied: dark gray, roughness > 0.5
- 2 torch holders exist, symmetrically placed (±X offset, same Z height ~2m)
- Torches have emissive material (emission strength > 0, orange/warm color)
- GLB file exported to the specified path
- `render_image` called for preview
- Objects are properly named and organized
- **Timing target:** < 120 seconds

---

### Test 13: Basic Rigging with Rigify (Skeleton Tool)
**Tests:** `blender-agent-skeleton` — Rigify meta-rig generation, armature fitting, automatic weight painting
```
Create a simple humanoid figure using basic shapes — a cylinder for the torso,
a sphere for the head, cylinders for arms and legs. Join them into one mesh.
Then add a biped skeleton rig to the character using Rigify so it can be posed.
Make sure the bones are properly weighted to the mesh.
```
**What to verify:**
- Humanoid figure exists as a single joined mesh object
- An armature (skeleton) is visible in the scene outliner
- The armature has proper biped bone structure (spine, arms, legs, head)
- The mesh is parented to the armature with weight painting applied
- Posing a bone (e.g., moving an arm) deforms the mesh correctly
- Rigify controls are visible (if generate rig was used)
- **Timing target:** < 120 seconds

---

> ⚠️ **Tests 14-16 require neural AI models (UniRig, MoMask) that are NOT yet integrated.**  
> These are future tests — skip them during current testing sessions.

### Test 14: AI Auto-Rigging with UniRig (Neural Skeleton)
**Tests:** `unirig` — AI auto-rigging pipeline, GLB export with embedded armature
```
Create a simple four-legged creature — an elongated body with four legs, a
tail, and a head. Give it a green reptile-like material. Then use UniRig AI
to automatically generate a skeleton and skin weights for it. Export the
rigged model as GLB to /tmp/creature_rigged.glb.
```
**What to verify:**
- Creature mesh exists with 4 legs, body, head, tail-like shapes
- Green material applied
- **If UniRig is available:** UniRig API call is present in agent logs, armature is embedded in the model, and GLB contains bone data when re-imported
- **If UniRig is unavailable:** agent explicitly reports "unavailable" and proceeds without recursive retries (graceful degradation)
- GLB file exported to /tmp/creature_rigged.glb
- **Timing target:** < 180 seconds (includes AI processing time)

---

### Test 15: Keyframe Animation (Motion Tool — Procedural)
**Tests:** `blender-agent-motion` — keyframe insertion, timeline setup, animation rendering
```
Take the default cube and create a bouncing ball animation: the cube should
start at position Z=5, fall to the ground (Z=0.5) over 30 frames, then
bounce back up to Z=3 over the next 20 frames, repeating once more.
Set the animation length to 120 frames at 24fps. Add ease-in on the drops
and ease-out on the bounces for natural motion. Render frame 15 as a
preview to check the animation.
```
**What to verify:**
- Default cube has keyframes set on the Z location
- Timeline shows keyframes at appropriate frames (0, 30, 50, etc.)
- Animation length is 120 frames, FPS set to 24
- Playing the animation shows the cube bouncing (Z changes over time)
- Easing/interpolation is set (not linear — should have ease-in/out curves)
- A rendered preview frame exists
- **Timing target:** < 90 seconds

---

### Test 16: AI Motion Generation with MoMask (Text-to-Motion)
**Tests:** `momask` + `blender-agent-skeleton` — AI motion generation, BVH import, motion applied to rig
```
Create a simple humanoid stick figure and rig it with a biped skeleton.
Then generate a 3-second walking animation using AI motion generation.
Apply the generated motion to the character so it walks forward naturally.
Set up a side-view camera and render a preview frame at the midpoint
of the animation.
```
**What to verify:**
- Humanoid figure exists with a biped skeleton/armature
- **If MoMask is available:** MoMask API call is present in agent logs, BVH/motion data is generated and imported, armature has animation data, and playing animation shows walking motion
- **If MoMask is unavailable:** agent explicitly reports "unavailable" and proceeds/finalizes gracefully without recursive retries
- Camera is positioned from the side
- Rendered preview exists
- **Timing target:** < 180 seconds (includes AI processing time)

---


### Test 17: Multi-Object Scene with Complex Spatial Relationships & Lighting

**Tests:** Spatial reasoning across multiple grounded objects, relative positioning, height reasoning, lighting direction/color/shadow quality, material variety — all from a descriptive prompt with minimal exact values

```text
Build an outdoor fruit market stall scene:

1. Create a wooden market table (roughly 2m wide, 0.9m tall) in the center.
2. On the table, arrange 5 different fruits in a natural cluster:
   - A large watermelon (ellipsoid) on the left side
   - A bunch of 3 bananas (curved cylinders) leaning against the watermelon
   - Two oranges (small spheres) to the right of the bananas
3. Behind the table, place a tall canvas awning supported by two thin poles
   (poles should be taller than the table, awning stretched between them).
4. In front of the table, place a small wooden crate on the ground with
   a few apples (red spheres) inside it.
5. Add a directional "sun" light coming from the upper-left at roughly
   30 degrees, warm yellow tone, casting visible shadows to the right.
6. Add a subtle cool-blue fill light from the right side at low intensity
   to soften the shadows.
7. Give everything appropriate materials: brown wood for table/crate,
   green/red for watermelon, yellow for bananas, orange for oranges,
   red for apples, off-white canvas for the awning.
8. Set up a camera from a front-right angle (like a shopper approaching)
   at eye level, and render the scene.
```

**What to verify (spatial + lighting + materials):**
- Table is at realistic height (~0.9m), all fruits sitting ON the table (not floating)
- Watermelon is noticeably larger than oranges/apples
- Bananas are curved, not straight cylinders — leaning against watermelon means touching it
- Awning is BEHIND the table, stretching between poles that are taller than the table (~2-2.5m)
- Crate is IN FRONT of the table, on the ground (z ≈ 0), apples are inside/on top of it
- Sun light comes from upper-left → shadows should fall to the right side
- Fill light is visible as a subtle blue tint on shadow areas
- Each object type has a distinct material color
- Camera captures the full scene from a natural human perspective
- **Timing target:** < 180 seconds, ≤ 20 tool calls

---


### Test 18: Image Reference Recreation (Vision + Spatial)

**Tests:** Vision analysis of a reference image, translating visual understanding into Blender objects with correct spatial layout, proportions, and materials

**Reference image:** `docs/test18-reading-nook-reference.png`

**Before running this test:** attach `docs/test18-reading-nook-reference.png` to the chat input.

```text
Look at the attached reference image carefully. Recreate this scene in Blender as
accurately as you can using basic shapes:

- Match the overall layout and spatial arrangement of objects
- Use appropriate materials that match the colors/textures in the image
- Set up lighting that matches the mood and direction in the reference
- Position a camera to match approximately the same viewing angle
- Render a preview so we can compare

Don't worry about perfect detail — focus on getting the right objects,
their relative positions, proportions, and the overall atmosphere correct.
```

**What to verify (vision → spatial fidelity):**
- Agent should call `get_viewport_screenshot` or describe what it sees in the reference
- Scene should contain the major objects from the reference image (armchair, lamp, side table, mug, book, rug)
- Relative positions match: chair centered, lamp behind-left, table to the right
- Proportions are reasonable: chair is human-scale, lamp taller than chair, table is small
- Materials approximate the reference: brown/leather for chair, warm tones for lamp light, wood for table
- Lighting direction and warmth match the reference
- Camera angle approximates the reference viewpoint
- **This test evaluates the agent's ability to "see" and translate to 3D — partial credit for getting layout right even if details differ**
- **Timing target:** < 180 seconds

---


### Test 19: Image Reference — Desk Workspace with Pendant Lamp (Vision + Lighting Geometry)

**Tests:** Vision analysis, spatial layout, AND correct lighting geometry (open shade / downward-facing pendant). This test specifically validates the agent's understanding of light-emitting geometry: the pendant lamp shade must be **open at the bottom** so light shines downward onto the desk.

**Reference image:** `docs/test19-desk-workspace-reference.png`

**Before running this test:** attach `docs/test19-desk-workspace-reference.png` to the chat input.

```text
Look at the attached reference image carefully. Recreate this desk workspace scene
in Blender as accurately as you can using basic shapes:

- A wooden desk against a wall
- A modern pendant lamp hanging above the desk, casting warm light downward
- On the desk: a closed laptop, a coffee mug, a small potted succulent, and stacked books
- A modern office chair pushed in at the desk
- Match the warm lighting mood from the pendant lamp
- Position a camera to match approximately the same viewing angle
- Take a viewport screenshot to verify your work before rendering
```

**What to verify (vision + lighting geometry):**
- Agent should analyze the reference and identify all major objects
- Pendant lamp shade is **open at the bottom** (not a closed sphere/cylinder trapping light)
- Point light is placed **inside the shade** and light visibly illuminates the desk surface
- Desk, chair, laptop, mug, plant, and books are all present and roughly positioned correctly
- Materials approximate the reference: wood for desk, dark for laptop, green for plant
- Agent calls `get_viewport_screenshot` at least once to visually verify the scene
- **Lighting is the primary pass/fail criterion**: if the lamp doesn't illuminate the desk, the test fails
- **Timing target:** < 180 seconds

---

### Test 20: Image Reference — Entryway Console with Round Mirror (Wall Alignment + Surface Reasoning)

**Tests:** Vision analysis, wall-relative placement, centering/alignment, object-on-surface reasoning, and under-table clearance. This is a **Studio-mode-only** image-context test intended for manual Electron app validation.

**Reference image:** generate one using the prompt below, then attach it to the Studio chat input before running the Blender agent prompt.

**Image generation prompt:**

```text
Create a clean, realistic interior reference image for a 3D scene recreation test.

Scene:
- A Scandinavian-style entryway against a plain light beige wall
- A slim wooden console table centered against the wall
- A large round mirror centered on the wall above the console table
- On top of the table: a small table lamp on the left, a ceramic vase with olive branches near the center-right, and two stacked books
- Under the console table: a woven basket slightly to the right and a pair of ankle boots slightly to the left
- A narrow runner rug on the floor extending toward the camera
- Warm natural daylight from the left side, with soft shadows

Composition:
- Straight-on front view with a slight rightward camera offset, about eye level
- Entire console table, mirror, and floor styling visible
- Clear object separation and readable silhouettes
- Minimal clutter, no people, no text, no wall art besides the round mirror

Style:
- Realistic interior photography
- Clean, calm, high-end home decor aesthetic
- Simple shapes and readable forms that can be approximated in Blender with basic geometry
```

**Before running this test:** attach the generated image to the Studio chat input.

**Studio Blender agent prompt:**

```text
Look at the attached reference image carefully and recreate this entryway scene in Blender as accurately as you can using simple geometry and clean materials.

Focus on:
- Matching the overall layout and proportions of the scene
- Centering the console table against the wall
- Positioning the round mirror correctly above the console table
- Recreating the major objects on top of the table and underneath it
- Matching the warm natural lighting mood from the left side
- Positioning a camera to roughly match the same viewing angle

Use basic shapes where appropriate. Do not chase tiny decorative detail.
The main goal is to get the spatial relationships, alignment, scale, and lighting direction correct.

Before rendering, take a viewport screenshot so you can visually check whether the composition matches the reference.
Then render a preview image.
```

**What to verify (vision + spatial fidelity):**
- Console table is centered against the wall and reads as a narrow entryway table, not a desk or dining table
- Round mirror is centered above the table and vertically separated from it with realistic spacing
- Lamp, vase/branches, and books are placed ON the table surface, not floating or intersecting
- Basket and boots are UNDER the table with believable clearance and spacing
- Runner rug sits on the floor and extends toward the camera
- Lighting direction reads from the left side with soft warm shadows
- Agent calls `get_viewport_screenshot` at least once before final render
- **Primary pass/fail criterion:** the mirror/table alignment and under-table object placement must read correctly at a glance
- **Timing target:** < 180 seconds

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
