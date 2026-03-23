# ViperMesh — 3D Pipeline Technique Research

> **Generated:** 2026-02-17  
> **Sources:** NotebookLM Deep Research (61 web sources + 90 existing notebook sources)

---

## 1. Automated Retopology (Blender Python API)

### Voxel Remesh
The fastest automated retopology method. Creates a unified, watertight mesh from complex geometry.

```python
import bpy

obj = bpy.context.active_object
if obj.type == 'MESH':
    # Smaller value = more detail (0.003 for characters, 0.03 for environments)
    obj.data.remesh_voxel_size = 0.03
    bpy.ops.object.mode_set(mode='SCULPT')
    bpy.ops.object.voxel_remesh()
    bpy.ops.object.mode_set(mode='OBJECT')
```

### Quadriflow Remesh
Clean quad-based topology — essential for animation deformation.

```python
bpy.ops.object.quadriflow_remesh(
    target_faces=5000,        # Desired face count
    use_mesh_symmetry=True,   # Enable X-axis symmetry
    preserve_sharp=True       # Keep sharp edges
)
```

### Full Retopology Pipeline
1. **Cleanup & Merge**: `bpy.ops.object.join()` to combine parts
2. **Voxel Remesh**: Unify geometry, remove internal faces
3. **Decimate** (optional): `bpy.ops.object.modifier_add(type='DECIMATE')` to reduce vertex count before expensive retopo
4. **Quadriflow**: Generate final clean quad topology

> **Key Principle**: Prefer `bpy.data` over `bpy.context` for robust automation. Operators (`bpy.ops`) require correct context (active object).

---

## 2. Auto-Rigging with Rigify (Deep Research — 61 Sources)

### Core Architecture
Rigify operates on a **metarig → generate → skin** pipeline:
- **Metarig**: Structural template with bone metadata (`rigify_type` attributes)
- **Generation**: Recursive traversal creates MCH- (mechanism), ORG- (original), DEF- (deformation) bones
- **Skinning**: Mesh binding via automatic weights to DEF- bones only

### Programmatic Rig Generation

```python
import rigify
import bpy

# Step 1: Create metarig
bpy.ops.object.armature_add()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.armature.metarig_sample_add()

# Step 2: Align metarig bones to mesh (vertex group centers)
# Calculate joint positions from mesh vertex data
# joint_pos = mean(vertex_positions_in_group)

# Step 3: Generate the rig
metarig = bpy.data.objects['metarig']
rigify.generate.generate_rig(bpy.context, metarig)

# Step 4: Bind mesh to rig
# Select mesh first, then rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
```

### Available Templates

| Template | Use Case |
|----------|----------|
| `Human` | Full facial rig, 5 fingers, complex spine |
| `Basic Human` | Biped limbs + spine only (no face/fingers) |
| `Basic Quadruped` | Animals (4 legs, tail, spine) |
| `Cat`, `Wolf`, `Horse`, `Bird`, `Shark` | Archetype-specific features |

### Custom Rig Types
- Assign via: `pose_bone.rigify_type = 'spines.basic_tail'`
- Configure via: `pose_bone.rigify_parameters`
- Custom Feature Sets: Inherit from `rigify.base_rig.BaseRig`

### Blender 4.x/5.0 Migration Notes
- **Bone Layers → Bone Collections**: Use `rigify_ui_row` and `rigify_ui_title` properties
- **Bone Visibility**: `pose.bones.hide` (not `bones.hide`) for Object/Pose mode
- **Bone Selection**: Now stored on `pose_bones.select`
- **Action API**: Legacy `action.fcurves` removed → use `channelbag.fcurves`

### Automated Weight Painting
```python
# For deforming meshes (organic characters)
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# For rigid parts (robots, accessories)
bpy.ops.object.parent_set(type='ARMATURE_NAME')  # Empty groups
# Then assign 100% weight to specific bones:
v_group = mesh_obj.vertex_groups.get(bone_name)
v_group.add([vertex_index], 1.0, 'REPLACE')
```

### Common Pitfalls
1. **Disjoint bones**: Tail of bone N must match head of bone N+1
2. **Auto Run Python Scripts**: Must be enabled for `rig_ui.py`
3. **Non-manifold geometry**: Causes auto-weights to fail
4. **Scale**: Rigify expects 1 unit = 1 meter (apply transforms first)

---

## 3. PBR Texture Generation

### Current State of AI Texturing (2025-2026)

| Tool | Approach | Status |
|------|----------|--------|
| **TEXTure** | Text-guided texture synthesis with depth-conditioned diffusion | Open-source |
| **Text2Tex** | Text-to-texture using depth maps + iterative inpainting | Open-source |
| **ControlNet Depth** | SD + depth map conditioning for UV-aware texture gen | Open-source |
| **Meshy AI** | Commercial text-to-texture API | Paid API |
| **Yvo3D** | Experimental AI texturing | Research |
| **Stable Diffusion + UV Projection** | Generate 2D textures → project onto UV maps | DIY |

### Blender Integration Pattern
```python
# Load PBR texture maps from AI generation
import bpy

def apply_pbr_textures(obj, albedo_path, roughness_path, metallic_path, normal_path):
    mat = bpy.data.materials.new(name="AI_PBR_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    bsdf = nodes.get("Principled BSDF")
    
    # Albedo
    albedo_tex = nodes.new('ShaderNodeTexImage')
    albedo_tex.image = bpy.data.images.load(albedo_path)
    links.new(albedo_tex.outputs['Color'], bsdf.inputs['Base Color'])
    
    # Roughness
    rough_tex = nodes.new('ShaderNodeTexImage')
    rough_tex.image = bpy.data.images.load(roughness_path)
    rough_tex.image.colorspace_settings.name = 'Non-Color'
    links.new(rough_tex.outputs['Color'], bsdf.inputs['Roughness'])
    
    # Normal Map
    normal_tex = nodes.new('ShaderNodeTexImage')
    normal_tex.image = bpy.data.images.load(normal_path)
    normal_tex.image.colorspace_settings.name = 'Non-Color'
    normal_map = nodes.new('ShaderNodeNormalMap')
    links.new(normal_tex.outputs['Color'], normal_map.inputs['Color'])
    links.new(normal_map.outputs['Normal'], bsdf.inputs['Normal'])
    
    obj.data.materials.append(mat)
```

### Smart UV Unwrap Automation
```python
# Auto-UV unwrap before texture application
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(
    angle_limit=66.0,
    island_margin=0.02,
    area_weight=0.0
)
bpy.ops.object.mode_set(mode='OBJECT')
```

---

## 4. Procedural Keyframe Animation (Blender Python API)

### Basic Keyframe Insertion
```python
import bpy

# Animate object location
obj = bpy.context.active_object
obj.location.y = 0
obj.keyframe_insert("location", frame=1)
obj.location.y = 5.0
obj.keyframe_insert("location", frame=60)
```

### Procedural Math-Driven Animation
```python
import math

obj = bpy.data.objects['Cube']
for frame in range(1, 101):
    bpy.context.scene.frame_set(frame)
    # Sine wave bobbing
    obj.location.z = math.sin(frame * 0.1) * 0.5
    obj.keyframe_insert(data_path="location", index=2, frame=frame)
    
    # Rotation
    obj.rotation_euler.z = frame * 0.05
    obj.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)
```

### Constraints for Physics-Like Animation
```python
# Track To constraint (camera follows target)
constraint = camera.constraints.new(type='TRACK_TO')
constraint.target = target_object
constraint.track_axis = 'TRACK_NEGATIVE_Z'
constraint.up_axis = 'UP_Y'
```

### F-Curve Manipulation (Blender 5.0+)
```python
import bpy_extras

# Modern API: F-curves stored in Channelbags
action = obj.animation_data.action
slot = action.slots[0]
channelbag = bpy_extras.anim_utils.action_ensure_channelbag_for_slot(action, slot)

# Create F-curve in channelbag
fcurve = channelbag.fcurves.new(
    data_path="location",
    index=0,
    group_name="Object Transforms"
)
```

### NLA Strip Composition
```python
# Push action to NLA stack for layering
anim_data = obj.animation_data
track = anim_data.nla_tracks.new()
track.name = "Base Walk Cycle"
strip = track.strips.new("walk", start=1, action=action)

# Add noise layer on top
noise_track = anim_data.nla_tracks.new()
noise_track.name = "Procedural Noise"
noise_strip = noise_track.strips.new("noise", start=1, action=noise_action)
noise_strip.blend_type = 'ADD'  # Layer on top
```

---

## Key Takeaways for ViperMesh Implementation

### What We Can Build NOW
1. **Retopology Pipeline**: Voxel Remesh + Quadriflow are both single-line API calls — add to MCP
2. **Auto-Rigging**: Rigify `generate_rig()` is well-documented. Add human/quadruped templates
3. **Smart UV Unwrap**: `bpy.ops.uv.smart_project()` — trivial to add
4. **Procedural Animation**: Keyframe insertion + math-driven motion — extend our code-gen prompts

### What Needs More Research
1. **AI Texture Generation**: No single dominant solution yet. Best bet: SD + ControlNet depth-guided
2. **Mesh-to-Rig Alignment**: Automated bone placement needs vertex group analysis
3. **Motion Library**: Pre-built animation patterns (walk, run, idle) as RAG scripts

### Recommended RAG Scripts to Create
1. `auto_retopology.py` — Voxel remesh + Quadriflow pipeline
2. `auto_rigify.py` — Rigify metarig generation + skinning 
3. `auto_uv_unwrap.py` — Smart UV projection automation
4. `procedural_animation.py` — Math-driven keyframe patterns
5. `pbr_texture_loader.py` — Load and apply PBR texture maps
