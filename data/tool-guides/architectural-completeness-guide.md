---
title: "Architectural Completeness & Scene Construction Guide"
category: "scene-design"
tags: ["architecture", "room", "walls", "floor", "ceiling", "window", "door", "boolean", "interior", "exterior", "glass", "opening"]
description: "General 3D engineering principles for constructing architecturally complete scenes. Covers room construction, wall openings (windows/doors), component completeness, and structural integrity."
blender_version: "5.0+"
---

# Architectural Completeness & Scene Construction Guide

## CORE PRINCIPLE: COMPONENT COMPLETENESS

Every real-world architectural element is composed of multiple sub-components. When creating any architectural feature, always model ALL sub-components that make it physically complete.

| Element | Required Sub-Components | Often Forgotten |
|---|---|---|
| Window | Boolean opening + frame + **glass pane** + sill | Glass pane, sill |
| Door | Boolean opening + frame + door panel + handle | Handle, threshold |
| Wall | Geometry with **real thickness** (not single plane) | Thickness for EEVEE |
| Staircase | Treads + risers + stringers + railing | Risers, railing |
| Shelf/Counter | Top surface + front face + supporting structure | Side panels |

**Rule:** After creating an opening (window/door), ALWAYS add the fill component (glass pane, door panel). A hole in a wall is not a window — it needs glass.

## ROOM CONSTRUCTION RULES

### Wall Construction
1. **Continuous walls:** Build walls as a single continuous object by extruding the next wall from the corner of the previous one. This prevents texture clipping at corners.
2. **Real thickness:** ALL walls, floors, and ceilings MUST have thickness (use 0.15–0.3m). Single-plane geometry causes severe **light bleed** in EEVEE where outdoor light leaks through edges.
3. **Apply transforms:** Always `bpy.ops.object.transform_apply(scale=True)` after setting scale.

### Wall Thickness Pattern (Blender 5.x)
```python
# CORRECT: Wall with real thickness
wall = create_cube("Wall", 1, (0, 2.5, 1.4), (4, 0.2, 2.8))
# 0.2m thick — prevents EEVEE light bleed

# WRONG: Paper-thin wall (causes light bleed)
wall = create_cube("Wall", 1, (0, 2.5, 1.4), (4, 0.01, 2.8))
```

### Floor as Distinct Surface
The floor MUST have a different material from furniture. In real interiors, floors are:
- Harder, more worn (higher roughness)
- Different color/texture from furniture
- Often darker (absorbs dirt/wear)

## WINDOW CREATION PATTERN

### Step 1: Cut Opening with Boolean
```python
# Create cutter object
cutter = create_cube("Window_Cutter", 1, (-2.0, 0, 1.4), (0.5, 2.0, 1.2))
bool_mod = wall.modifiers.new(name="WindowCut", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = cutter
bool_mod.solver = 'EXACT'  # REQUIRED in Blender 5.x
bpy.context.view_layer.objects.active = wall
bpy.ops.object.modifier_apply(modifier="WindowCut")
bpy.data.objects.remove(cutter)
```

### Step 2: Add Glass Pane (CRITICAL — don't skip!)
```python
# Glass pane fills the window opening
glass = create_cube("Window_Glass", 1, (-2.0, 0, 1.4), (0.02, 1.9, 1.1))

# EEVEE glass material via execute_code
mat = bpy.data.materials.new("Glass_Mat")
mat.use_nodes = True
mat.blend_method = 'BLEND'  # Required for transparency in 5.x
nodes = mat.node_tree.nodes
bsdf = nodes["Principled BSDF"]
bsdf.inputs["Transmission Weight"].default_value = 0.95
bsdf.inputs["IOR"].default_value = 1.5
bsdf.inputs["Roughness"].default_value = 0.0
bsdf.inputs["Base Color"].default_value = (0.9, 0.95, 1.0, 1.0)
glass.data.materials.append(mat)
```

**EEVEE Note:** For interior scenes, using a Transparent shader instead of Glass may prevent light bleed artifacts if exact refraction isn't needed.

### Step 3: Add Window Frame (Optional but recommended)
```python
# Simple frame around the opening
frame = create_cube("Window_Frame", 1, (-2.0, 0, 1.4), (0.08, 2.1, 1.3))
# Cut out center to make frame shape
```

## BOOLEAN OPERATION BEST PRACTICES

1. **Use EXACT solver** — the only reliable solver in Blender 5.x (`FAST` is removed)
2. **Watertight meshes only** — cutter and target must be closed manifold meshes
3. **No flipped normals** — check with `bpy.ops.mesh.normals_make_consistent(inside=False)`
4. **Apply transforms first** — `bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)`
5. **Cutter must overlap** — the cutter object must extend slightly beyond both sides of the wall
6. **Clean up cutters** — remove cutter objects after applying the modifier

## SURFACE CATEGORY CHECKLIST

When building any interior scene, ensure each of these surface categories has a DISTINCT material:

| Category | Examples | Material Character |
|---|---|---|
| **Structural surfaces** | Walls, ceiling | High roughness (0.8+), muted colors, no metallic |
| **Walking surfaces** | Floor, stairs | Distinguished from walls — different color AND roughness |
| **Furniture** | Tables, chairs, counters | Wood/upholstery materials, medium roughness |
| **Fixtures/hardware** | Faucets, handles, machines | Metallic = 1.0, low roughness, distinct from all else |
| **Transparent surfaces** | Windows, glass doors | Transmission Weight > 0, IOR set correctly |

**Rule:** No two categories should share the exact same material. If the floor and furniture are both "wood," use different wood tones (light oak floor vs. dark walnut furniture).

## COMMON MISTAKES TO AVOID

1. ❌ Cutting a window hole without adding glass — always add a glass pane after boolean
2. ❌ Paper-thin walls — use 0.15–0.3m thickness to prevent EEVEE light bleed
3. ❌ Same material on floor and furniture — always differentiate functional surfaces
4. ❌ Using `FAST` boolean solver — removed in Blender 5.x, use `EXACT`
5. ❌ Not applying transforms before booleans — causes geometry artifacts
6. ❌ Leaving boolean cutter objects visible — remove them after applying
