---
title: "Multi-Part Object Assembly Guide"
category: "object-assembly"
tags: ["assembly", "compound", "multi-part", "parent", "attach", "connect", "hierarchy", "empty", "pole", "arm", "joint", "furniture", "vehicle", "building", "execute_code", "parent_set", "set_object_transform"]
triggered_by: ["execute_code", "parent_set", "set_object_transform"]
description: "Domain knowledge for building compound objects from primitives. Covers connection point calculation, parent-child assembly, flush attachment, and common archetypes like furniture, street infrastructure, and architectural elements."
blender_version: "4.0+"
---

# Multi-Part Object Assembly Guide

## CRITICAL RULES

1. **Build bottom-up.** Start with the base/foundation piece and calculate each subsequent piece's position relative to the piece it connects to. Never guess attachment points.

2. **Calculate connection points, don't hardcode.** Use `base_z + base_height/2` to find the top of a base, then place the next piece starting there. This works regardless of where the base was placed.

3. **Use parenting for compound objects that move together.** Parent all parts to a root Empty so the entire assembly can be moved/rotated as one unit.

## ASSEMBLY STRATEGY

### Step-by-Step Assembly Process
When building any compound object from primitives:

1. **Identify the structural hierarchy** — Which part is the base? What attaches to what?
2. **Create the base part first** — Position it at the intended world location
3. **Calculate each attachment point** — Use the base part's position + half its dimensions
4. **Create child parts at calculated positions** — Each child's position derives from its parent geometry
5. **Optionally parent all parts** — Group under an Empty for unified control

### Connection Point Formulas

**Top of a vertical piece (pole, leg, column):**
```
top_z = pole.location.z + (pole_height / 2)
```

**Bottom attachment (seat on legs, shelf on brackets):**
```
seat_z = leg_top_z + (seat_thickness / 2)
```

**Side attachment (arm from pole, sign from post):**
```
arm_x = pole.location.x + (pole_radius) + (arm_length / 2)
arm_z = pole_top_z  # or a specific fraction of pole height
```

**End of a horizontal arm:**
```
end_x = arm.location.x + (arm_length / 2)
end_z = arm.location.z
```

## COMMON ARCHETYPES

### Archetype 1: Street Lamp (Pole + Arm + Head + Base)

```
Structure:   Base ← Pole ← Arm ← Head
              │        │       │       └── Light source location
              │        │       └── Horizontal, attached at pole top
              │        └── Vertical, standing on base
              └── Wide flat disc on ground
```

**Position calculations:**
```python
pole_height = 3.5
pole_radius = 0.05
arm_length = 0.5
arm_radius = 0.03
base_loc = (-1.5, 0, 0)

# Base: flat disc on ground
base_z = base_loc[2] + 0.025  # half of base depth

# Pole: centered on base, extends upward
pole_z = base_loc[2] + pole_height / 2

# Arm: horizontal, attached at pole top
arm_x = base_loc[0] + arm_length / 2  # extends from pole center
arm_z = base_loc[2] + pole_height      # at pole top

# Head: at END of arm, not offset from pole
head_x = base_loc[0] + arm_length      # at arm tip
head_z = arm_z                          # same height as arm
```

**Common mistake:** Placing the head offset from the *pole*, not from the *arm tip*. The head connects to the arm's end, not the pole.

### Archetype 2: Park Bench (Seat + Backrest + Legs)

```
Structure:   Legs ← Seat ← Backrest
              │        │       └── Angled panel, FLUSH against seat back edge
              │        └── Flat board, sits on top of legs
              └── 4 vertical posts, bottom at Z=0
```

**Position calculations:**
```python
seat_height = 0.45   # real-world bench seat height
seat_width = 1.5
seat_depth = 0.5
seat_thickness = 0.05
backrest_height = 0.4
backrest_thickness = 0.05
backrest_angle = -15  # degrees, tilted back
leg_thickness = 0.05

# Legs: bottom at Z=0, top at seat bottom
leg_height = seat_height - seat_thickness / 2
leg_z = leg_height / 2  # center origin

# Seat: sits on top of legs
seat_z = seat_height  # center of seat thickness at seat_height

# Backrest: FLUSH AGAINST the seat's back edge
# The backrest bottom should touch the seat top
import math
theta = math.radians(abs(backrest_angle))

# When rotated, the bottom edge shifts. Compensate:
backrest_center_z = seat_z + (seat_thickness / 2) + (backrest_height / 2) * math.cos(theta)
backrest_y = (seat_depth / 2) - (backrest_thickness / 2)  # at back edge of seat

# The backrest's location.y needs to account for rotation shifting it
backrest_y_shift = (backrest_height / 2) * math.sin(theta)
backrest_y_final = backrest_y + backrest_y_shift
```

**Common mistake:** Setting backrest location without accounting for rotation. A -15° tilt on X shifts the bottom edge upward and forward.

### Archetype 3: Table (Top + Legs)

```
Structure:   Legs ← Table Top
              └── 4 vertical posts at corners
```

**Position calculations:**
```python
table_height = 0.75  # standard dining table
top_thickness = 0.04
top_width = 1.2
top_depth = 0.75

# Table top
top_z = table_height  # center of thickness

# Legs: inset from corners
leg_height = table_height - top_thickness / 2
leg_z = leg_height / 2
inset = 0.05  # legs slightly inside table edge

corners = [
    (-top_width/2 + inset, -top_depth/2 + inset),
    ( top_width/2 - inset, -top_depth/2 + inset),
    (-top_width/2 + inset,  top_depth/2 - inset),
    ( top_width/2 - inset,  top_depth/2 - inset),
]
```

### Archetype 4: Bookshelf / Shelving Unit

```
Structure:   Side Panels ← Shelves ← Back Panel (optional)
```

**Evenly spaced shelves:**
```python
shelf_count = 4
unit_height = 1.8
shelf_thickness = 0.02
usable_height = unit_height - shelf_thickness  # subtract top/bottom

spacing = usable_height / (shelf_count - 1)
for i in range(shelf_count):
    shelf_z = shelf_thickness / 2 + i * spacing
```

### Archetype 5: Vehicle (Body + Wheels)

```
Structure:   Body ← Wheels (4)
```

**Wheel placement:**
```python
body_width = 1.8
body_length = 4.0
wheelbase = body_length * 0.7  # 70% of body length
track = body_width  # wheels at body edges
wheel_radius = 0.3

# Wheels sit on ground, center at wheel_radius height
wheel_z = wheel_radius
wheel_positions = [
    (-wheelbase/2, -track/2, wheel_z),  # front-left
    (-wheelbase/2,  track/2, wheel_z),  # front-right
    ( wheelbase/2, -track/2, wheel_z),  # rear-left
    ( wheelbase/2,  track/2, wheel_z),  # rear-right
]
```

## PARENTING FOR ASSEMBLIES

### When to Parent
- **Always parent** when the object should move/rotate as one unit
- **Use an Empty as root** for easy manipulation of the whole assembly
- **Parent in Python** using `parent_set` tool or `execute_code`

### Parenting in execute_code
```python
import bpy

# Create root empty
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = "Lamp_Root"

# Parent all parts to root (keep visual position)
for part_name in ["Lamp_Pole", "Lamp_Arm", "Lamp_Head", "Lamp_Base"]:
    part = bpy.data.objects.get(part_name)
    if part:
        part.parent = root
        part.matrix_parent_inverse = root.matrix_world.inverted()
```

**Key:** Setting `matrix_parent_inverse` to the parent's inverted world matrix prevents the child from "jumping" to a new position when parented.

### Using parent_set MCP Tool
```
parent_set(parent="Lamp_Root", child="Lamp_Pole", keep_transform=true)
```

## VERIFICATION CHECKLIST

After assembling a compound object, verify:

1. ☐ **No floating parts** — Every part touches or connects to its neighbor
2. ☐ **Bottom at Z=0** — The base of the assembly sits on the ground plane
3. ☐ **Proportions match reality** — Compare dimensions to reference table
4. ☐ **Rotated parts are compensated** — Angled pieces have position offsets applied
5. ☐ **Use `get_viewport_screenshot`** — Visual check catches issues formulas might miss

## COMMON MISTAKES TO AVOID

1. ❌ **Placing child parts relative to world origin instead of parent geometry** — Arm position must derive from pole top, not from (0,0,0)
2. ❌ **Connecting to the wrong point of a rotated piece** — A rotated arm's endpoint is NOT at `arm.location.x + arm_length/2` — use `matrix_world @ Vector(local_point)` to find the real endpoint
3. ❌ **Forgetting that cylinder depth is FULL height, not half** — A `depth=3.5` cylinder extends 1.75m above and below its origin
4. ❌ **Not accounting for object radius in side attachments** — An arm touching a pole must offset by `pole_radius + arm_radius`, not just `arm_length/2`
5. ❌ **Hardcoding heights instead of calculating from connected parts** — If you change the pole height later, all attachment points break
6. ❌ **Parenting without setting `matrix_parent_inverse`** — Child objects will visually jump to unexpected positions
7. ❌ **Building top-down** — Always start from the ground up to prevent accumulated positioning errors
