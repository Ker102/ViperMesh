# Weight Painting Guide — Blender Agent Best Practices

> **Domain:** Weight Painting, Vertex Groups, Deformation Quality
> **Version:** Blender 4.x / 5.x (verified via NotebookLM research)
> **Purpose:** Research-backed guide for the agent. Use `execute_code` for all weight painting.

---

## CRITICAL: Weight Data Architecture

> **Source:** StackExchange "How to set Vertex Weights in Blender 4.0 with Python"

Weights are NOT stored in vertex groups — they are stored as **Vertex Group Elements**
bound to each individual vertex. Understanding this architecture is essential:

- `obj.vertex_groups` → list of vertex groups (by name/index)
- `obj.data.vertices[x].groups` → vertex group elements for vertex x
- Each element knows its `weight` and `group` index
- **Vertex groups don't know their vertices** — you must check each vertex's elements

---

## 1. Assigning Weights via Python

### Standard Method: `group.add()`
```python
import bpy

obj = bpy.data.objects['CharacterMesh']
# Get or create vertex group
vg = obj.vertex_groups.get('Bone_Name')
if not vg:
    vg = obj.vertex_groups.new(name='Bone_Name')

# Assign weight to specific vertices
# Syntax: group.add(vertex_indices, weight, mode)
# Modes: 'REPLACE', 'ADD', 'SUBTRACT'
vg.add([0, 1, 2, 3], 1.0, 'REPLACE')   # full weight
vg.add([4, 5, 6], 0.5, 'REPLACE')       # half weight
vg.add([7, 8, 9], 0.0, 'REPLACE')       # zero weight
```

### High-Performance Method: bmesh Deform Layer
> **Source:** Blender DevTalk "Manipulate vertex groups via bmesh"

For high-poly meshes, looping through vertex group elements is too slow.
Use bmesh's deform layer for direct dictionary-like access:

```python
import bpy, bmesh

obj = bpy.data.objects['CharacterMesh']
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode='EDIT')

bm = bmesh.from_edit_mesh(obj.data)
deform_layer = bm.verts.layers.deform.verify()

# Get the vertex group index
group_index = obj.vertex_groups['Bone_Name'].index

# Assign weights via deform layer (fast)
for vert in bm.verts:
    vert[deform_layer][group_index] = 1.0  # or calculated weight

bmesh.update_edit_mesh(obj.data)
bpy.ops.object.mode_set(mode='OBJECT')
```

---

## 2. Automatic Weights (Binding Mesh to Armature)

```python
import bpy

mesh = bpy.data.objects['CharacterMesh']
rig = bpy.data.objects['Character_Rig']

bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig

# Parent with automatic weights (bone heat weighting algorithm)
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
```

---

## 3. Post-Binding Weight Cleanup (MANDATORY)

> **Source:** Reddit "Mesh deforms differently in Unity than in Blender"

Raw auto-weights are never production-quality. Always run cleanup:

```python
import bpy

mesh = bpy.data.objects['CharacterMesh']
bpy.context.view_layer.objects.active = mesh
bpy.ops.object.mode_set(mode='WEIGHT_PAINT')

# Step 1: Limit max bone influences per vertex
# Game engine standard: 4 bones max (Unity uses 2-4 by default)
# Blender auto-weights may assign up to 8 bones per vertex
bpy.ops.object.vertex_group_limit_total(limit=4)

# Step 2: Smooth weights (reduces jagged deformations)
bpy.ops.object.vertex_group_smooth(
    group_select_mode='ALL',
    factor=0.5,
    repeat=3
)

# Step 3: Normalize (every vertex's weights sum to 1.0)
bpy.ops.object.vertex_group_normalize_all(
    group_select_mode='ALL',
    lock_active=False
)

# Step 4: Clean tiny weights below threshold
bpy.ops.object.vertex_group_clean(
    group_select_mode='ALL',
    limit=0.01,
    keep_single=False
)

bpy.ops.object.mode_set(mode='OBJECT')
```

---

## 4. Game Engine Export Rules

> **Source:** Reddit r/Unity3D "Mesh deforms differently in Unity than in Blender"

| Engine | Max Bones/Vertex | Notes |
|--------|-----------------|-------|
| Unity | 4 (default 2) | Change in Project Settings → Quality → Skin Weights |
| Unreal | 4-8 | 4 recommended for mobile, 8 for desktop |
| Godot | 4 | Standard limit |

**If you don't limit to 4 in Blender before export, the mesh WILL deform incorrectly in-engine.**

Unity-specific: In FBX import → Rig tab → change Skin Weights to "Standard (4 Bone)".

---

## 5. Smoothing Techniques

> **Source:** StackExchange "Simple methods to smooth out weight paints"

### Smooth Tool (Python)
```python
bpy.ops.object.vertex_group_smooth(
    group_select_mode='ALL',  # or 'BONE_SELECT', 'BONE_DEFORM'
    factor=0.5,
    repeat=3
)
```

### Smooth Tool (Manual — for agent instructions)
1. Enter Weight Paint mode
2. Activate vertex selection (cube icon with yellow vertex)
3. Select vertices to smooth
4. Click **Smooth** in tools panel
5. In operator options: select **'Selected Pose Bones'** subset

> **⚠️ WARNING:** Using 'All' subset causes weight leaking — a single blue vertex
> will expand to cover all selected vertices. Always use 'Selected Pose Bones'
> with 'only selected' source mode to prevent unintended weight spread.

### Blur Brush
Paint over rough transitions manually using the Blur brush in Weight Paint mode.

### Corrective Smooth Modifier
Non-destructive post-weighting smoothing:
```python
mod = mesh.modifiers.new(name='CorrSmooth', type='CORRECTIVE_SMOOTH')
mod.factor = 0.5
mod.iterations = 5
mod.smooth_type = 'SIMPLE'
```

---

## 6. Troubleshooting: "Bone Heat Weighting Failed"

> **Source:** Reddit r/blender "Is there a remedy for bone heat weighting"

| Fix | How | Why It Works |
|-----|-----|--------------|
| **Scale up 10-100x** | Select armature+mesh → scale → apply weights → scale back | Small meshes confuse the heat solver |
| **Merge by Distance** | Edit Mode → Select All → Mesh → Merge by Distance | Duplicate vertices cause ambiguity |
| **Decimate dense mesh** | Modifier → Decimate → apply | Vertex density overloads solver |
| **Data Transfer trick** | Remesh → bind clean copy → Data Transfer modifier to original | Bypasses bad topology entirely |
| **Fix symmetry** | Delete half armature → mirror | Asymmetric bones cause solver failure |
| **Separate loose parts** | Edit Mode → P → Separate by Loose Parts → parent individually | Intersecting meshes confuse heat map |

---

## 7. Common Pitfalls

| Problem | Cause | Fix (Research-backed) |
|---------|-------|----------------------|
| Mesh deforms wrong in Unity | >4 bone influences per vertex | `vertex_group_limit_total(limit=4)` before export |
| Weights leak to wrong areas | Smooth tool using 'All' subset | Use 'Selected Pose Bones' subset |
| Auto-weights fail | Mesh too small or non-manifold | Scale up 10x, merge by distance |
| Blocky deformation | No weight smoothing after auto-bind | Run smooth + normalize pipeline |
| Slow weight assignment | Looping vertex group elements on high-poly | Use bmesh deform layer |
