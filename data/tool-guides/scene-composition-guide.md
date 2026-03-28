---
title: "Scene Composition & Interior Design Principles"
category: "scene-design"
tags: ["composition", "interior", "camera", "framing", "layout", "furniture", "placement", "spatial", "depth", "lamp", "lighting", "pendant", "shade", "light fixture"]
description: "General 3D engineering principles for composing visually balanced interior and exterior scenes. Covers furniture placement, camera framing, visual hierarchy, and spatial organization."
blender_version: "5.0+"
---

# Scene Composition & Interior Design Principles

## VISUAL HIERARCHY IN SCENES

Every scene should have a clear visual hierarchy — the viewer's eye should be drawn to the most important elements first. Achieve this through:

1. **Size contrast** — Prominent objects should be appropriately sized relative to the room
2. **Material contrast** — Key objects should have distinct materials from their surroundings
3. **Lighting emphasis** — Use spotlights or directional lights to draw attention to focal points
4. **Position** — Place hero objects at optical center or along rule-of-thirds lines

## INTERIOR FURNITURE PLACEMENT RULES

### Against-Wall Items
Objects that go "against" a wall should be positioned with a small gap:
```python
# CORRECT: 5cm gap from wall for realism
# If back wall is at Y=2.5 and has 0.2m thickness, wall inner face is at Y=2.4
# A bookshelf 0.3m deep: center Y = 2.4 - 0.15 = 2.25
bookshelf_y = wall_inner_y - (shelf_depth / 2) - 0.05  # 5cm gap

# WRONG: Object embedded in or touching wall surface exactly
bookshelf_y = wall_inner_y  # Will clip into wall
```

### Furniture Spacing
- **Walking clearance** between furniture groups: 0.6–1.0m minimum
- **Chair push-back clearance** behind seated positions: 0.5m
- **Counter stool spacing**: 0.6m center-to-center minimum
- **Table-to-wall clearance**: 0.8m for comfortable seating

### Grounding — Nothing Should Float
Every object must touch a surface. Common Z-position calculations:
```python
# Object sitting on the floor (Z=0)
object_z = object_height / 2  # Center of mass at half height

# Object on a table (table top at Z=0.75)
cup_z = table_top_z + cup_height / 2

# Object mounted on wall (wall at X=2.0)
painting_x = wall_x - painting_depth / 2 - 0.01  # Slight offset from wall
```

## CAMERA FRAMING FOR INTERIORS

### Focal Length Guide
| Focal Length | Field of View | Best For |
|---|---|---|
| 18–24mm | Ultra-wide | Full room views, small spaces |
| 28–35mm | Wide | Standard interior shots, natural perspective |
| 50mm | Normal | Detail shots, furniture groups |
| 85mm+ | Telephoto | Close-up details, material showcase |

**Rule:** For interior scene overviews, use **24–35mm**. Ultra-wide (< 20mm) causes severe perspective distortion.

### Camera Placement (Interior Overview)
```python
# Standard interior overview: camera near one corner, looking diagonally
# For a 4m × 5m room:
camera_location = (1.5, -2.0, 1.6)  # Near front-right corner, eye height
look_at = (-0.5, 1.0, 1.0)           # Center-back of room, slightly below eye level

# Rule of thumb: camera height 1.4–1.7m simulates human eye level
# Lower angles (0.8–1.0m) create dramatic/imposing feel
# Higher angles (2.5m+) create overview/dollhouse feel
```

### Ensuring All Objects Are Visible
After placing the camera, verify that important objects are within the camera frustum:
- Wide enough lens to capture the full room width
- Camera positioned far enough back to see front objects
- No important objects clipped by the frame edges
- Consider rotating camera slightly to include off-center elements

## REFERENCE RECONSTRUCTION PRIORITIES

When matching an image reference, do not treat all objects as equally important.

1. **Block out scene anchors first** — floor, walls, major furniture, large framing elements
2. **Check composition before chasing detail** — use a viewport screenshot to confirm layout, scale, and camera angle
3. **Refine by camera prominence** — objects near the center, foreground, or strong light boundaries should get refinement before background accents
4. **Preserve recognizable silhouettes** — a visible prop needs enough sub-parts to read correctly from the active camera, even if the scene is otherwise simple
5. **Use focused follow-up passes** — if one visible prop reads poorly, refine that prop rather than rebuilding the entire scene

## LIGHTING BALANCE PRINCIPLES

### Interior Lighting Hierarchy
1. **Key light** — Main illumination source, establishes mood and shadow direction
2. **Fill light** — Fills shadowed areas, prevents pure black shadows (30-50% of key brightness)
3. **Accent/rim light** — Highlights edges and creates depth separation

### Energy Balance to Prevent Overexposure
When using multiple lights in EEVEE:
- Total combined energy should not exceed what feels natural
- If key light is AREA at 600W, fill should be 200-300W max
- Avoid stacking multiple high-energy lights pointing at the same area
- **Start low, increase gradually** — it's easier to brighten than to diagnose overexposure

### Warm vs. Cool Light Assignment
| Light Role | Warm Scenes | Cool/Professional Scenes |
|---|---|---|
| Key light | (1.0, 0.85, 0.7) warm amber | (0.95, 0.95, 1.0) neutral |
| Fill light | (1.0, 0.9, 0.8) soft warm | (0.85, 0.9, 1.0) cool blue |
| Accent | (1.0, 0.95, 0.85) | (0.9, 0.9, 1.0) |

**Rule:** In warm scenes (cafés, homes), ALL lights should lean warm. Don't mix pure white lights with warm-colored lights — it creates an unnatural feel.

## LIGHT PLACEMENT IN FIXTURES — CRITICAL

When creating lamp, pendant, chandelier, or any light-emitting object:

### The Cardinal Rule: Light Must Be BELOW or OUTSIDE the Shade

A light source placed INSIDE a closed shade (cylinder, sphere, cone) is **trapped** and casts no useful illumination. The Blender light object must be positioned so rays can actually reach the scene.

```python
# CORRECT: Light below the open bottom of a pendant/lamp shade
shade_bottom_z = lamp_z  # Bottom of shade geometry
light_z = shade_bottom_z - 0.05  # 5cm below opening

# WRONG: Light at center of shade (rays blocked by shade mesh)
light_z = shade_bottom_z + shade_height / 2  # Trapped inside!
```

### Fixture Light Placement Rules
| Fixture Type | Light Position | Light Type |
|---|---|---|
| **Pendant lamp** | 5–10cm BELOW shade opening | SPOT (cone down) or POINT |
| **Floor lamp** | At shade opening, facing upward or downward | SPOT or POINT |
| **Table lamp** | At the OPEN END of the shade, not the closed top | POINT |
| **Chandelier** | Below the fixture body, never inside arms/structure | POINT or AREA |
| **Wall sconce** | In front of the sconce plate, facing outward | POINT or SPOT |

### Open Geometry for Shades
If you create a cylindrical or conical shade, **delete the bottom face** so it's open:
```python
# After creating cylinder for shade:
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')
shade.data.polygons[0].select = True  # Bottom face
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.delete(type='FACE')
bpy.ops.object.mode_set(mode='OBJECT')
# Then place light BELOW this opening, not inside the now-hollow cylinder
```

## OBJECT NAMING CONVENTIONS

Use descriptive, hierarchical names that make the scene tree readable:
```
Room_Floor
Room_Wall_Back
Room_Wall_Left
Room_Wall_Right
Counter_Top
Counter_Base
CoffeeMachine_Body
CoffeeMachine_Spout
Stool_01
Stool_02
Table_Round_Top
Table_Round_Leg
Chair_01_Seat
Chair_01_Back
Light_Key_Area
Light_Fill_Spot
Camera_Main
```

## COMMON MISTAKES TO AVOID

1. ❌ Furniture floating above floor — always calculate Z position from surface height
2. ❌ Objects clipping into walls — leave small gaps (2-5cm) from surfaces
3. ❌ Camera too close with wide lens — causes extreme distortion
4. ❌ All lights same energy — creates flat, shadowless scene
5. ❌ Mixing warm and cool lights randomly — stick to a consistent temperature palette
6. ❌ Forgetting to include fill light — single-light scenes have harsh, unrealistic shadows
7. ❌ Camera at ceiling height — use eye-level (1.4–1.7m) for natural perspective
8. ❌ **Placing light INSIDE a shade/fixture** — light must be BELOW/OUTSIDE the shade opening, not trapped inside closed geometry. This is the #1 cause of dark, non-functional lamps in scenes.
