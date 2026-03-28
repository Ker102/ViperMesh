---
title: "Spatial Positioning & Rotation-Aware Placement Guide"
category: "spatial-positioning"
tags: ["position", "rotation", "transform", "offset", "grounding", "alignment", "bounding box", "origin", "mathutils", "matrix", "execute_code", "set_object_transform", "get_object_info"]
triggered_by: ["set_object_transform", "get_object_info"]
description: "Domain knowledge for accurate object positioning in 3D space, including rotation-aware placement, relative offsets, grounding, alignment, and bounding-box math. Prevents floating objects, misaligned parts, and incorrect spatial relationships."
blender_version: "4.0+"
---

# Spatial Positioning & Rotation-Aware Placement Guide

## CRITICAL RULES

1. **NEVER assume an object's position — always query it first.** Before moving, stacking, or aligning any existing object, call `get_object_info` to read its current location, dimensions, and rotation. Hardcoded assumptions cause compounding errors.

2. **Rotation changes the effective bounding box.** A 1×1×2 m box rotated 45° on X is no longer 2 m tall in world space. Always compute the world-space bounding box after rotation.

3. **"Move up by 2" means RELATIVE to current position, not absolute Z=2.** For relative transforms, read current position first, then add the offset.

4. **Use the `@` operator for matrix multiplication (Blender 2.8+).** The `*` operator performs element-wise multiplication and will raise a `TypeError` with Matrix/Vector types.

## POSITIONING FUNDAMENTALS

### Origin-Aware Height Calculation
Every Blender primitive has its origin at its geometric center by default.

| Primitive | Origin Position | Bottom Z | Top Z |
|---|---|---|---|
| Cube (size=S) | Center | `loc.z - S/2` | `loc.z + S/2` |
| Cylinder (depth=D) | Center | `loc.z - D/2` | `loc.z + D/2` |
| Sphere (radius=R) | Center | `loc.z - R` | `loc.z + R` |
| Plane | Center (flat) | `loc.z` | `loc.z` |

**After scaling:** Actual dimension = `size × scale_factor`. A cube with `size=1, scale=(1,1,2)` has height `1 × 2 = 2m`.

**Formula — Ground an object (bottom at Z=0):**
```
location.z = height / 2
```
For a cylinder with `depth=0.8`: `location.z = 0.4`

**Formula — Stack object B on top of object A:**
```
B.location.z = A.location.z + (A_height / 2) + (B_height / 2)
```

### Relative vs. Absolute Positioning
| User says... | Correct interpretation |
|---|---|
| "Place at Z=2" | Absolute: `obj.location.z = 2.0` |
| "Move up by 2" | Relative: `obj.location.z = current_z + 2.0` |
| "Place 3m to the right" | Relative: `obj.location.x = ref.location.x + 3.0` |
| "Place next to X" | Query X dims: `obj.location.x = X.loc.x + X_width/2 + obj_width/2 + gap` |

**ALWAYS call `get_object_info` before applying relative transforms.**

## ROTATION-AWARE POSITIONING

### The Core Problem
When you rotate an object, its **local dimensions** stay the same but its **world-space bounding box** changes. A backrest panel rotated -15° on X has its bottom edge shift upward.

### World-Space Bounding Box Calculation
`obj.bound_box` returns coordinates in **local space only**. To get the actual world-space bounding box of a rotated/scaled/moved object:

```python
from mathutils import Vector

def get_world_bbox(obj):
    """Get all 8 bounding box corners in world space."""
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]

# Usage:
world_corners = get_world_bbox(obj)
min_z = min(c.z for c in world_corners)  # actual bottom
max_z = max(c.z for c in world_corners)  # actual top
actual_height = max_z - min_z
```

### Effective Height After X-Axis Rotation
For an object with dimensions `(W, D, H)` rotated by angle `θ` around X:

```
effective_height = abs(H × cos(θ)) + abs(D × sin(θ))
effective_depth  = abs(H × sin(θ)) + abs(D × cos(θ))
```

### Practical Example: Angled Backrest
A backrest `(3.0 × 0.1 × 0.8)` rotated -15° on X:
```python
import math
H, D = 0.8, 0.1
theta = math.radians(15)
effective_h = abs(H * math.cos(theta)) + abs(D * math.sin(theta))  # ≈ 0.799m
bottom_shift = (H / 2) * (1 - math.cos(theta)) - (D / 2) * math.sin(theta)
# ≈ 0.0007m upward (nearly zero — the two effects almost cancel)
# For thin objects (D << H), the shift is tiny; for thick objects it matters more
```

**Rule: When placing a rotated object flush against a surface, account for the bottom-edge shift.**

### Using mathutils.Matrix for Precise Placement
```python
import mathutils, math

# Build a transformation: first rotate, then translate
rot = mathutils.Matrix.Rotation(math.radians(-15), 4, 'X')
loc = mathutils.Matrix.Translation((0, 0.25, 0.75))
obj.matrix_world = loc @ rot

# Order: Translation @ Rotation @ Scale
# Applied right-to-left: scale first, rotate second, translate last
```

## ALIGNMENT PATTERNS

### Center-to-Center (Stack Vertically)
```
B.location.x = A.location.x
B.location.y = A.location.y
B.location.z = A.location.z + (A_height/2) + (B_height/2)
```

### Edge-to-Edge (Flush Surfaces)
Place B so its left face touches A's right face:
```
B.location.x = A.location.x + (A_width/2) + (B_width/2)
```

### Place Object on a Surface with Gap
```
B.location.z = surface_top_z + (B_height/2) + gap
```

### Symmetric Placement
Place objects symmetrically around a center point:
```python
for i, offset in enumerate([-1.5, 0, 1.5]):
    obj_copy.location.x = center_x + offset
```

## PROXIMITY & CONTACT RELATIONSHIPS

These patterns handle natural language like "leaning against", "beside", "resting on", "inside a container". The core principle: **always compute the actual surface boundary of BOTH objects before positioning.**

### CRITICAL: Scaled Dimensions

```python
actual_extent_x = R × sx    (NOT just R)
actual_extent_y = R × sy
actual_extent_z = R × sz
```



```python
half_x = (S / 2) × sx
half_y = (S / 2) × sy  
half_z = (S / 2) × sz
```


**ALWAYS multiply dimensions by scale factors before computing offsets.**

### "Leaning Against" / "Beside" (Surface Contact)
Object B should touch but NOT penetrate object A:
```python
# Compute A's rightmost surface
A_right_edge = A.location.x + A_actual_half_width
# Compute B's leftmost surface offset from B's center
B_left_offset = B_actual_half_width
# Place B so its left surface touches A's right surface
B.location.x = A_right_edge + B_left_offset + margin  # margin ≥ 0.01
```

**Example — bananas leaning against a watermelon:**
```python
# Watermelon: radius=0.2, scale=(1.3, 1.0, 1.0) at X=-0.5
wm_right_x = -0.5 + (0.2 * 1.3)  # = -0.24

# Banana: radius=0.03 at whatever position
banana_x = wm_right_x + 0.03 + 0.01  # = -0.20 (just outside)
```

❌ **WRONG:** `banana_x = watermelon_x + 0.25`  (ignores watermelon's actual width)  
✅ **RIGHT:** `banana_x = watermelon_x + wm_radius * wm_scale_x + banana_radius + margin`

### "Resting On" / "Sitting On" (Vertical Contact)
Object B sits on top of object A's surface:
```python
A_top_z = A.location.z + A_actual_half_height
B.location.z = A_top_z + B_actual_half_height + margin
```

For spheres on flat surfaces:
```python
# Sphere rests on table top
sphere.location.z = table_top_z + sphere_radius * sphere_scale_z
```

### "Inside a Container" (Contained Within)
Object B should be within the bounds of object A:
```python
# B center must satisfy:
# A.loc.x - (A_half_w - B_half_w) < B.loc.x < A.loc.x + (A_half_w - B_half_w)
# Same for Y and Z

# Example: apples inside a crate
crate_interior_half_w = (crate_width / 2) - wall_thickness - apple_radius
apple.location.x = crate.location.x + random_offset  # |offset| < crate_interior_half_w
apple.location.z = crate_floor_z + apple_radius  # resting on crate floor
```

### "Clustered Together" / "Grouped"
Spread objects with minimum separation to avoid overlap:
```python
min_separation = obj_radius_A + obj_radius_B + 0.02  # 2cm gap
# For each new object, check distance to all existing objects
from mathutils import Vector
for existing in placed_objects:
    dist = (Vector(new_loc) - Vector(existing.location)).length
    if dist < min_separation:
        # push new_loc outward
```

### Safety Margin Reference
| Relationship | Minimum margin |
|---|---|
| Touching / leaning | 0.005–0.02 m |
| "Close but not touching" | 0.05–0.10 m |
| "Nearby" / "beside" | 0.10–0.30 m |
| "Well separated" | 0.50+ m |

## REAL-WORLD DIMENSION REFERENCE

Use these to validate proportions when the user doesn't provide exact sizes.

### Furniture
| Object | Width | Depth | Height | Notes |
|---|---|---|---|---|
| Park bench (2-person) | 1.0–1.3 m | 0.45–0.50 m | Seat: 0.45 m | Backrest adds ~0.40 m |
| Park bench (3-person) | 1.35–1.80 m | 0.45–0.60 m | Seat: 0.45 m | |
| Dining chair | 0.45 m | 0.45 m | Seat: 0.45 m, Total: 0.90 m | |
| Office desk | 1.2–1.8 m | 0.60–0.75 m | 0.73–0.76 m | |
| Coffee table | 0.75–1.2 m | 0.50–0.75 m | 0.40–0.50 m | |
| Sofa (3-seat) | 2.0–2.5 m | 0.80–1.0 m | Back: 0.85 m | |
| Bed (queen) | 1.52 m | 2.03 m | Frame: 0.30–0.50 m | |

### Street Furniture
| Object | Dimensions | Notes |
|---|---|---|
| Streetlamp (residential) | Height: 3–6 m, pole Ø: 0.08–0.12 m | Base Ø: 0.25–0.35 m |
| Streetlamp (urban) | Height: 4.5–9 m | |
| Trash can (outdoor) | Ø: 0.35–0.50 m, H: 0.75–0.95 m | |
| Fire hydrant | H: 0.60–0.75 m, Ø: ~0.20 m | |
| Bollard | H: 0.75–1.0 m, Ø: 0.10–0.15 m | |

### Architecture
| Element | Dimensions | Notes |
|---|---|---|
| Door (standard) | 0.90 × 2.10 m | |
| Window | 1.0–1.5 m × 1.2–1.5 m | Sill at ~0.90 m |
| Ceiling height | 2.4–3.0 m | Residential |
| Wall thickness | Interior: 0.10–0.15 m | Exterior: 0.20–0.30 m |
| Stair step | Rise: 0.17 m, Run: 0.28 m | |

### Human Reference
| Measurement | Value |
|---|---|
| Standing height | 1.70–1.80 m |
| Eye height (camera eye-level) | 1.55–1.70 m |
| Shoulder width | 0.40–0.50 m |
| Seated height | 0.80–0.90 m |

## OBJECT FUNCTIONAL DIRECTION & CLEARANCE

In professional 3D modeling, many objects have a **functional direction** — they are designed to be used, viewed, or accessed from a specific side. Understanding functional direction is critical for realistic scene composition.

### Functional Direction Principle
Every object that serves a user or interacts with another object has an **intended usage axis**:

| Object Type | Forward/Open Side | Back/Closed Side |
|---|---|---|
| Seating (chairs, sofas, benches) | Open seat side (where user sits from) | Backrest / back panel |
| Displays (monitors, TVs, paintings) | Screen / visible face | Back housing / wall mount |
| Storage (shelves, cabinets, fridges) | Door / access opening | Back panel against wall |
| Vehicles | Hood / front grille | Trunk / tailgate |
| Appliances (ovens, microwaves) | Door / control panel | Back venting |
| Speakers / audio equipment | Driver cone / front grille | Wiring / port panel |

### Placement Rule: Face the Companion Object
When an object is described as being "at", "facing", or "pushed in" to another object, its **open/functional side faces the companion object**, and its **closed/back side faces away**.

This means the back geometry extends **away** from the companion, never into it.

### Algorithmic Placement for Directional Objects

```python
# General formula: place object B facing object A
# 1. Determine A's near edge (the surface closest to where B should be)
A_near_edge = A_center - A_half_depth  # or + depending on direction

# 2. Place B so its FUNCTIONAL side (front) faces A,
#    with its center offset by B's half-depth + clearance gap
B_center = A_near_edge - B_half_depth - clearance_gap

# 3. The back of B extends AWAY from A:
B_back = B_center - B_back_extent  # always farther from A, never closer

# 4. Verify: B's closest point to A should not overlap A
B_closest_to_A = B_center + B_half_depth
assert B_closest_to_A < A_near_edge  # must be outside A's bounding box
```

### Anti-Pattern: Reversed Functional Direction
If the back geometry is placed on the companion-object side:
- The back panel/structure **clips through** the companion
- The object appears oriented away from its companion (visually nonsensical)
- The user-facing side points at empty space instead of the interaction surface

### AABB Clearance Validation
After placing **any** object near another, validate no intersection using axis-aligned bounding box (AABB) overlap detection:

```python
def check_clearance(obj_a, obj_b):
    """Return True if objects do NOT overlap (AABB test in world space)."""
    from mathutils import Vector
    a_corners = [obj_a.matrix_world @ Vector(c) for c in obj_a.bound_box]
    b_corners = [obj_b.matrix_world @ Vector(c) for c in obj_b.bound_box]

    a_min = Vector((min(c.x for c in a_corners), min(c.y for c in a_corners), min(c.z for c in a_corners)))
    a_max = Vector((max(c.x for c in a_corners), max(c.y for c in a_corners), max(c.z for c in a_corners)))
    b_min = Vector((min(c.x for c in b_corners), min(c.y for c in b_corners), min(c.z for c in b_corners)))
    b_max = Vector((max(c.x for c in b_corners), max(c.y for c in b_corners), max(c.z for c in b_corners)))

    overlap = (a_min.x < b_max.x and a_max.x > b_min.x and
               a_min.y < b_max.y and a_max.y > b_min.y and
               a_min.z < b_max.z and a_max.z > b_min.z)
    return not overlap
```

This is a standard technique from real-time collision detection — use it whenever two objects must be close but not interpenetrating.

## COMMON MISTAKES TO AVOID

1. ❌ **Moving to Z=2 when user said "move up by 2"** — Read current position first
2. ❌ **Placing a rotated part at the unrotated height** — Rotation shifts the effective edges
3. ❌ **Assuming object size from creation params after scaling** — Actual size = param × scale
4. ❌ **Stacking without querying the lower object** — Never assume; always `get_object_info`
5. ❌ **Forgetting center-origin offset** — Bottom of a size=2 cube at origin is at Z=-1
6. ❌ **Using `*` for matrix math** — Use `@` in Blender 2.8+ (PEP 465)
7. ❌ **Using absolute coords for relative instructions** — "3m right of table" ≠ x=3
8. ❌ **Ignoring scale when computing proximity offsets** — A sphere(r=0.2, scale_x=1.3) extends 0.26m, NOT 0.2m. Always multiply: `actual_extent = radius × scale`
9. ❌ **Placing "beside" objects at a fixed offset from center instead of from surface** — "Beside" means surface-to-surface contact, not center-to-center distance
10. ❌ **Objects inside each other when meant to be touching** — Always compute both surfaces: `A_surface + B_half_width + margin`, never just `A_center + arbitrary_offset`
11. ❌ **Reversing an object's functional direction** — When placing an object "at" or "facing" a companion, the open/functional side must face the companion. Back geometry extends AWAY, never into the companion object.
12. ❌ **Skipping clearance validation after close placement** — After positioning any object near another, run an AABB overlap check to catch interpenetration before the user sees it
