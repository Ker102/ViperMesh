---
title: "Aesthetic Quality & Stylistic Coherence Guide"
category: "scene-design"
tags: ["aesthetic", "quality", "style", "decorative", "detail", "execute_code", "procedural", "torch", "lantern", "ornament", "medieval", "modern", "furniture"]
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
Materials must match the era and setting. Derive roughness and color from the **scene context**, not from defaults:
- **Aged/rustic settings:** Higher roughness (0.6–0.8), muted warm tones, metallic only on iron/steel
- **Modern/clean settings:** Lower roughness (0.05–0.3), neutral or cool tones, polished metals
- **Fantasy/magical:** Emissive accents, jewel tones, gold/copper metallics

**Rule:** Never use default gray or smooth chrome for objects in non-modern settings. Always set roughness and base color intentionally to match the scene's era.

## MULTI-COMPONENT ASSEMBLY PATTERN (via `execute_code`)

### Generic Template
When building ANY complex object, follow this pattern in `execute_code`:

```python
import bpy

def create_complex_object(name_prefix, location):
    """Generic pattern for multi-component object assembly."""
    x, y, z = location

    # STEP 1: STRUCTURAL BASE — the main body/frame
    # Use the appropriate primitive, then apply transforms
    bpy.ops.mesh.primitive_cube_add(location=(x, y, z))
    base = bpy.context.active_object
    base.name = f"{name_prefix}_Base"
    base.scale = (...)  # Set realistic proportions
    bpy.ops.object.transform_apply(scale=True)

    # STEP 2: SUB-COMPONENTS — add detail parts
    # Use loops for repeated elements (legs, rungs, slats)
    for i, offset in enumerate(offsets):
        bpy.ops.mesh.primitive_cone_add(...)  # Tapered shapes > cylinders
        part = bpy.context.active_object
        part.name = f"{name_prefix}_Part_{i}"

    # STEP 3: DETAIL/ORNAMENT — bevels, bindings, accents
    # Add modifiers for edge detail
    bevel = base.modifiers.new("Bevel", 'BEVEL')
    bevel.width = 0.005
    bevel.segments = 2

    # STEP 4: MATERIAL — context-appropriate, never default gray
    mat = bpy.data.materials.new(f"{name_prefix}_Mat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (...)  # Match scene era
    bsdf.inputs["Roughness"].default_value = (...)    # Match surface type

    # STEP 5: EMISSIVE SOURCES (if light-emitting)
    # Add emissive material + matching point/spot light
```

### Key Techniques for Realistic Shapes
- **Tapered forms:** Use `primitive_cone_add(radius1, radius2)` instead of cylinders for legs, handles, pillars
- **Organic shapes:** Use `primitive_ico_sphere_add` + non-uniform scale for flames, foliage, clouds
- **Repeated elements:** Use `for` loops with offsets for legs, slats, rungs, chain links, bricks
- **Edge softening:** Add `BEVEL` modifier (width=0.003–0.01, segments=2) to avoid sharp CG edges
- **Surface detail:** Use `SUBDIVISION` modifier + displacement for weathered/organic surfaces

### Few-Shot: What "Multi-Part" Means in Practice
These are hints — adapt the decomposition to whatever object the prompt requires:
- **Light fixture** → mount/bracket + housing body + shade/glass + bulb/flame + point light
- **Seating** → legs (4, tapered) + seat surface (beveled) + back support + optional armrests
- **Weapon/tool** → blade/head (tapered) + guard/collar + grip (wrapped) + pommel/end cap
- **Container** → body (hollow or thick-walled) + rim/lip + handles + lid (if closed)

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
