---
title: "Rigging & Rigify Workflow Guide"
category: "rigging"
tags: ["rigging", "rigify", "armature", "skeleton", "metarig", "IK", "bone", "rig", "auto-rig", "mesh preparation", "edge loops", "joint", "weight cleanup"]
triggered_by: ["execute_code"]
description: "Research-backed guide for Rigify rigging workflows including mesh preparation, per-bone metarig alignment, IK bend requirements, rig generation, and post-rigging weight cleanup. Based on NotebookLM research with 9 cited sources."
blender_version: "4.0+ / 5.x"
---

# Rigging Guide — Blender Agent Best Practices

> **Domain:** Rigging, Skeleton, Armature, Weight Painting
> **Version:** Blender 4.x / 5.x compatible
> **Purpose:** Guide the agent through correct rigging workflows. This is a RAG-injected tool guide — follow every step in order.

---

## Decision: Dedicated Tools vs execute_code

Rigging operations are **complex multi-step workflows** that require edit-mode bone manipulation,
pose-mode constraint setup, and weight-paint-mode cleanup. These do NOT map cleanly to single
MCP tool calls. **Use `execute_code` for all rigging operations**, guided by this document.

The `auto_rigify.py` RAG script provides utility functions you can call within `execute_code`.

---

## 1. Mesh Preparation (MANDATORY Before Rigging)

Before adding ANY armature to a mesh, the mesh MUST be prepared:

### 1.1 Geometry at Joints
Meshes need **sufficient vertex density at deformation zones** (knees, elbows, shoulders, neck, wrists, ankles).
Simple cylinders or low-poly primitives will deform terribly.

```python
# Add edge loops at joint positions for clean deformation
import bpy, bmesh

obj = bpy.data.objects['CharacterMesh']
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')

# Subdivide the mesh to add geometry, especially at joints
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.subdivide(number_cuts=2)  # 2 cuts minimum for joints

bpy.ops.object.mode_set(mode='OBJECT')
```

### 1.2 Clean Topology
Before rigging, ALWAYS run these cleanup steps:

```python
import bpy

obj = bpy.data.objects['CharacterMesh']
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')

# 1. Merge overlapping vertices (critical for auto-weights)
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.0001)

# 2. Fix normals
bpy.ops.mesh.normals_make_consistent(inside=False)

# 3. Apply all transforms BEFORE rigging
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
```

### 1.3 Scale Check
If the mesh is small (under ~0.5 Blender units tall), **scale up 10x** before auto-weighting,
then scale back down after. Small meshes cause "Bone Heat Weighting: Failed" errors.

---

## 2. Rigify Workflow (Correct Order)

### 2.1 Template Selection
| Template | Use When |
|----------|----------|
| `basic_human` | Simple characters, no face rig needed, game-ready rigs |
| `human` | Full characters with facial animation (has jaw, eyes, lips, breast bones) |
| `basic_quadruped` | Four-legged animals |
| Other templates | `bird`, `cat`, `horse`, `shark`, `wolf` — species-specific |

**Rule:** If unsure, use `basic_human`. The full `human` metarig has complex facial bones
that are unnecessary for most agent-generated characters and can complicate the rig.

### 2.2 Enable Rigify
```python
import addon_utils
loaded_default, loaded_state = addon_utils.check('rigify')
if not loaded_state:
    bpy.ops.preferences.addon_enable(module='rigify')
```

### 2.3 Create Metarig
```python
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.armature_basic_human_metarig_add()  # or armature_human_metarig_add()
metarig = bpy.context.active_object
metarig.name = 'Character_metarig'
```

### 2.4 Align Metarig to Mesh (CRITICAL — Per-Bone, Not Uniform Scale)

**WRONG approach** (causes rig to extend beyond mesh):
```python
# DON'T DO THIS — uniform bounding-box scale leaves bones outside limbs
scale_factor = mesh_height / meta_height
metarig.scale = (scale_factor, scale_factor, scale_factor)
```

**CORRECT approach** — per-bone alignment:
```python
import bpy
from mathutils import Vector

target = bpy.data.objects['CharacterMesh']
metarig = bpy.data.objects['Character_metarig']

# Get mesh dimensions
bbox = [target.matrix_world @ Vector(c) for c in target.bound_box]
min_z = min(v.z for v in bbox)
max_z = max(v.z for v in bbox)
center_x = (min(v.x for v in bbox) + max(v.x for v in bbox)) / 2
center_y = (min(v.y for v in bbox) + max(v.y for v in bbox)) / 2
height = max_z - min_z

# Step 1: Rough scale to match height
bpy.context.view_layer.objects.active = metarig
meta_bbox = [metarig.matrix_world @ Vector(c) for c in metarig.bound_box]
meta_h = max(v.z for v in meta_bbox) - min(v.z for v in meta_bbox)
if meta_h > 0:
    sf = height / meta_h
    metarig.scale = (sf, sf, sf)
metarig.location = (center_x, center_y, min_z)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Step 2: Enter edit mode and adjust key bones to fit inside the mesh
bpy.ops.object.mode_set(mode='EDIT')
edit_bones = metarig.data.edit_bones

# Adjust spine to center of mesh
# Adjust limb bones to be INSIDE the mesh volume
# The key principle: bones must be centered within their respective limb volumes

bpy.ops.object.mode_set(mode='OBJECT')
```

### 2.5 Joint Bends (MANDATORY for IK)
Elbows and knees MUST have a **slight bend** — never leave them perfectly straight.
The IK solver cannot determine fold direction for straight chains.

```python
bpy.ops.object.mode_set(mode='EDIT')
edit_bones = metarig.data.edit_bones

# Elbows: pull slightly backward (-Y)
for name in ['forearm.L', 'forearm.R', 'upper_arm.L', 'upper_arm.R']:
    bone = edit_bones.get(name)
    if bone and name.startswith('forearm'):
        bone.head.y -= 0.02 * height  # slight backward bend

# Knees: push slightly forward (-Y)
for name in ['shin.L', 'shin.R']:
    bone = edit_bones.get(name)
    if bone:
        bone.head.y -= 0.02 * height  # slight forward bend

bpy.ops.object.mode_set(mode='OBJECT')
```

### 2.6 Generate Rig
```python
import rigify.generate

bpy.context.view_layer.objects.active = metarig
metarig.select_set(True)
bpy.ops.object.mode_set(mode='OBJECT')

# Generate the final control rig
bpy.ops.pose.rigify_generate()

rig = bpy.context.active_object
rig.name = 'Character_Rig'
```

### 2.7 Bind Mesh to Rig
```python
bpy.ops.object.select_all(action='DESELECT')
target.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
```

### 2.8 Hide Metarig
```python
metarig.hide_set(True)
```

---

## 3. Post-Rigging Weight Cleanup (MANDATORY)

After binding with auto-weights, ALWAYS run cleanup. Raw auto-weights are never good enough.

```python
import bpy

mesh_obj = bpy.data.objects['CharacterMesh']
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')

# 1. Limit max influences to 4 per vertex (game-engine standard)
bpy.ops.object.vertex_group_limit_total(limit=4)

# 2. Smooth weights to reduce jagged deformations (3 iterations)
for _ in range(3):
    bpy.ops.object.vertex_group_smooth(
        group_select_mode='ALL',
        factor=0.5,
        repeat=1
    )

# 3. Normalize all weights (ensures every vertex sums to 1.0)
bpy.ops.object.vertex_group_normalize_all(
    group_select_mode='ALL',
    lock_active=False
)

# 4. Clean tiny weights below threshold
bpy.ops.object.vertex_group_clean(
    group_select_mode='ALL',
    limit=0.01
)

bpy.ops.object.mode_set(mode='OBJECT')
```

---

## 4. Common Pitfalls & Troubleshooting

### "Bone Heat Weighting: Failed to find solution"
**Cause:** Bad mesh topology. Fix with:
1. `Merge by Distance` (remove duplicate vertices)
2. Fix non-manifold geometry (edges connecting 3+ faces)
3. Separate intersecting loose parts (`P → Separate by loose parts`)
4. Scale mesh + armature up 10x, apply weights, scale back down

### Rig Controls Extend Beyond Mesh
**Cause:** Uniform bounding-box scale on metarig, ignoring per-bone alignment.
**Fix:** Always do per-bone alignment (Section 2.4) after rough scale.

### Mesh Warps/Pinches at Joints
**Cause:** Insufficient geometry at deformation zones.
**Fix:** Add edge loops or subdivide mesh before rigging (Section 1.1).

### IK Limbs Bend Wrong Way
**Cause:** Perfectly straight joint chains — IK solver doesn't know which axis to fold.
**Fix:** Add slight bend to elbows (backward) and knees (forward) — Section 2.5.

---

## 5. Verification Checklist

After rigging, verify in Pose Mode:
- [ ] Select rig → enter Pose Mode (Ctrl+Tab)
- [ ] Rotate/move arm controls → mesh follows smoothly without pinching
- [ ] Rotate/move leg controls → knees bend correctly in one direction
- [ ] Move root control → entire character translates
- [ ] No mesh parts stay behind or warp unexpectedly
- [ ] Reset pose: Alt+R (rotation), Alt+G (location)
