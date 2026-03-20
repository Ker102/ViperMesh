---
title: "Aesthetic Quality & Stylistic Coherence Guide"
category: "scene-design"
tags: ["aesthetic", "quality", "style", "decorative", "detail", "execute_code", "procedural", "torch", "lantern", "ornament", "medieval", "modern", "furniture"]
triggered_by: ["execute_code"]
description: "Principles for creating visually convincing, aesthetically rich 3D scenes. Prevents minimalistic primitive-based shortcuts and teaches the agent to match object detail to scene context using execute_code for complex geometry."
blender_version: "5.0+"
---

# Aesthetic Quality & Stylistic Coherence Guide

## CORE PRINCIPLE: VISUAL CONVICTION OVER SPEED

When a user describes a scene, they expect objects that **look like the real thing**, not geometric approximations. A torch is not a cylinder with a sphere on top. A chair is not a cube with four sticks. Every object must be recognizable at first glance without needing the user to imagine what it's supposed to be.

**Rule:** If an object would not be recognizable in a photograph, it is not finished. Add more geometry until it reads correctly.

## ANTI-MINIMALISM RULES

### Never Substitute Primitives for Complex Objects
The following patterns are UNACCEPTABLE:

| Object | ❌ Wrong (Primitive) | ✅ Correct (Detailed) |
|---|---|---|
| Torch | Cylinder + sphere | Bracket + handle + irregular flame shape |
| Chair | Cube + 4 thin cubes | Seat + backrest + legs with slight taper |
| Tree | Cylinder + sphere/cone | Trunk with taper + branch structure + leaf volume |
| Lamp/Lantern | Cylinder + point light | Housing + glass panels + chain/mount + bulb |
| Sword | Thin cube | Blade (tapered) + crossguard + grip + pommel |
| Bookshelf | Cube with lines | Frame + individual shelves + books (varied sizes) |

### Minimum Geometry Budget Per Object
Every named object in the scene should have AT LEAST:
- **Decorative/props:** 3+ distinct mesh operations (not just a single primitive)
- **Furniture:** 4+ sub-components (e.g., legs, seat, back, armrests)
- **Architectural features:** Follow the Architectural Completeness Guide
- **Organic shapes:** Use subdivision + proportional editing, never raw primitives

### When to Use `execute_code` Instead of Basic Tools
Use `execute_code` with Python scripting for ANY object that:
1. Has **irregular or organic shapes** (flames, plants, terrain, fabric)
2. Requires **multi-part assembly** (torch = bracket + handle + flame)
3. Needs **vertex-level manipulation** (tapering, bending, sculpting)
4. Benefits from **loop cuts or edge detail** (beveled edges, chamfers)
5. Involves **array/curve modifiers** for repeated elements (chain links, bricks, spiral stairs)

**Rule:** If you catch yourself making a single `create_cube` or `create_cylinder` call for a decorative object, STOP and use `execute_code` to build it properly.

## STYLISTIC COHERENCE

### Match Object Style to Scene Context
Every object in a scene must visually belong to the same world. The prompt's keywords define the style vocabulary:

| Prompt Keywords | Style Vocabulary | Material Palette |
|---|---|---|
| "medieval", "dungeon", "castle" | Rough stone, iron brackets, wood planks, rivets | Dark metals, weathered wood, rough stone |
| "modern", "apartment", "office" | Clean lines, smooth surfaces, chrome/glass | Polished metal, white/gray matte, glass |
| "sci-fi", "spaceship", "futuristic" | Panel lines, glowing accents, hexagonal patterns | Emissive strips, brushed aluminum, dark composites |
| "rustic", "cabin", "farmhouse" | Rough-hewn wood, hand-forged iron, woven fabric | Warm browns, muted greens, worn textures |
| "fantasy", "magical", "enchanted" | Organic curves, carved details, crystal/gem shapes | Glowing emissive, deep jewel tones, gold accents |

**Rule:** Before building ANY sub-object, ask: "Does this shape and material belong in the world described by the prompt?" A smooth chrome cylinder does NOT belong in a medieval dungeon.

### Contextual Material Selection
Materials must match the era and setting:

```python
# MEDIEVAL TORCH BRACKET — rough forged iron
mat = bpy.data.materials.new("Iron_Bracket")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.15, 0.12, 0.10, 1.0)  # Dark iron
bsdf.inputs["Metallic"].default_value = 0.9
bsdf.inputs["Roughness"].default_value = 0.7  # Rough forged, not polished

# WRONG for medieval: smooth polished chrome
# bsdf.inputs["Roughness"].default_value = 0.05  # Too smooth for medieval
```

## PROCEDURAL OBJECT PATTERNS WITH `execute_code`

### Pattern: Medieval Wall Torch
A proper torch requires multiple components built via Python:

```python
import bpy
import math

def create_wall_torch(name_prefix, location):
    """Create a medieval wall torch with bracket, handle, and flame."""
    x, y, z = location

    # 1. WALL BRACKET — bent iron rod shape
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.02, depth=0.25,
        location=(x, y - 0.12, z),
        rotation=(math.radians(90), 0, 0)
    )
    bracket_arm = bpy.context.active_object
    bracket_arm.name = f"{name_prefix}_Bracket_Arm"

    # Bracket wall plate (flat circle against wall)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.05, depth=0.01,
        location=(x, y, z),
        rotation=(math.radians(90), 0, 0)
    )
    plate = bpy.context.active_object
    plate.name = f"{name_prefix}_Bracket_Plate"

    # 2. TORCH HANDLE — tapered cylinder (wider at top)
    bpy.ops.mesh.primitive_cone_add(
        radius1=0.025, radius2=0.035, depth=0.4,
        location=(x, y - 0.25, z + 0.05),
        rotation=(0, 0, 0)
    )
    handle = bpy.context.active_object
    handle.name = f"{name_prefix}_Handle"

    # 3. WRAP/BINDING — torus rings around handle
    for i, offset in enumerate([0.08, 0.15]):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.04, minor_radius=0.008,
            location=(x, y - 0.25, z - 0.05 + offset)
        )
        wrap = bpy.context.active_object
        wrap.name = f"{name_prefix}_Wrap_{i}"

    # 4. FLAME — irregular shape using icosphere + displacement
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=0.06, subdivisions=2,
        location=(x, y - 0.25, z + 0.28)
    )
    flame = bpy.context.active_object
    flame.name = f"{name_prefix}_Flame"
    # Elongate vertically for flame shape
    flame.scale = (0.7, 0.7, 1.4)
    bpy.ops.object.transform_apply(scale=True)

    # 5. EMISSIVE FLAME MATERIAL
    mat = bpy.data.materials.new(f"{name_prefix}_Flame_Mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1.0, 0.45, 0.05, 1.0)
    bsdf.inputs["Emission Color"].default_value = (1.0, 0.5, 0.1, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 8.0
    flame.data.materials.append(mat)

    # 6. POINT LIGHT for actual illumination
    bpy.ops.object.light_add(
        type='POINT',
        location=(x, y - 0.25, z + 0.3)
    )
    light = bpy.context.active_object
    light.name = f"{name_prefix}_Light"
    light.data.energy = 50
    light.data.color = (1.0, 0.7, 0.3)  # Warm firelight
    light.data.shadow_soft_size = 0.3

create_wall_torch("Torch_L", (-1.5, -2.95, 1.8))
create_wall_torch("Torch_R", (1.5, -2.95, 1.8))
```

### Pattern: Detailed Chair
```python
import bpy

def create_chair(name, location):
    x, y, z = location
    seat_height = 0.45

    # Seat — slightly wider than deep, with edge bevel
    bpy.ops.mesh.primitive_cube_add(location=(x, y, z + seat_height))
    seat = bpy.context.active_object
    seat.name = f"{name}_Seat"
    seat.scale = (0.22, 0.22, 0.015)
    bpy.ops.object.transform_apply(scale=True)
    # Add bevel for softer edges
    bevel = seat.modifiers.new("Bevel", 'BEVEL')
    bevel.width = 0.005
    bevel.segments = 2

    # 4 Legs — slightly tapered (cone)
    leg_positions = [(-0.18, -0.18, 0), (0.18, -0.18, 0),
                     (-0.18, 0.18, 0), (0.18, 0.18, 0)]
    for i, (lx, ly, lz) in enumerate(leg_positions):
        bpy.ops.mesh.primitive_cone_add(
            radius1=0.02, radius2=0.015,
            depth=seat_height,
            location=(x + lx, y + ly, z + seat_height / 2)
        )
        leg = bpy.context.active_object
        leg.name = f"{name}_Leg_{i}"

    # Backrest — vertical board
    bpy.ops.mesh.primitive_cube_add(
        location=(x, y - 0.20, z + seat_height + 0.22)
    )
    back = bpy.context.active_object
    back.name = f"{name}_Back"
    back.scale = (0.20, 0.012, 0.22)
    bpy.ops.object.transform_apply(scale=True)
```

## QUALITY CHECKLIST

Before finishing any scene, verify:

1. **Silhouette test:** Would each object be identifiable from its silhouette alone?
2. **Style consistency:** Do all objects share the same era/aesthetic?
3. **Material variety:** Are there at least 3 distinct materials in the scene?
4. **No naked primitives:** Is every cube/cylinder/sphere part of a larger assembly?
5. **Light motivation:** Does every light source have a visible physical object (lamp, torch, window)?
6. **Scale plausibility:** Are objects proportioned correctly relative to each other?

## COMMON AESTHETIC FAILURES

1. ❌ Single cylinder as a "torch" — use multi-part assembly with bracket, handle, flame
2. ❌ Smooth metallic surface for medieval iron — use higher roughness (0.6-0.8)
3. ❌ Perfect geometric shapes for organic/rustic objects — add imperfection via displacement
4. ❌ Using only one material for everything — minimum 3 distinct materials per scene
5. ❌ Point lights with no visible source — every light needs a physical emitter object
6. ❌ Chrome/polished finishes in medieval/rustic scenes — match material to era
7. ❌ All furniture same height/size — vary proportions for visual interest
