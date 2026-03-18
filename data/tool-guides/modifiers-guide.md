---
title: "Modifier Usage & Configuration Guide"
category: "modifiers"
tags: ["modifier", "subdivision", "SubSurf", "bevel", "mirror", "boolean", "array", "smooth", "shade_smooth", "auto-smooth", "add_modifier", "apply_modifier", "apply_transforms", "shade_smooth"]
triggered_by: ["add_modifier", "apply_modifier", "apply_transforms", "shade_smooth"]
description: "Domain knowledge for mesh modifier selection, configuration, stack ordering, and shading setup in Blender. Covers SubSurf, bevel, boolean, mirror, array, and auto-smooth."
blender_version: "4.0+"
---

# Modifier Usage & Configuration Guide

## MODIFIER SELECTION REFERENCE

| Modifier | Type Enum | Purpose | Key Properties |
|---|---|---|---|
| **SUBSURF** | `SUBSURF` | Smooth mesh, add detail | `levels` (viewport), `render_levels` |
| **BEVEL** | `BEVEL` | Rounded edges | `width`, `segments`, `limit_method` |
| **MIRROR** | `MIRROR` | Symmetry | `use_axis` [X,Y,Z], `use_clip`, `merge_threshold` |
| **BOOLEAN** | `BOOLEAN` | Cut/join meshes | `operation`, `object`, `solver` |
| **ARRAY** | `ARRAY` | Repeat pattern | `count`, `relative_offset_displace` |
| **SOLIDIFY** | `SOLIDIFY` | Add thickness | `thickness`, `offset` |
| **DECIMATE** | `DECIMATE` | Reduce polygons | `ratio`, `decimate_type` |
| **SMOOTH** | `SMOOTH` | Smooth vertices | `factor`, `iterations` |
| **WIREFRAME** | `WIREFRAME` | Wire mesh | `thickness` |

## SUBDIVISION SURFACE GUIDELINES

| Level | Polygon Multiplier | Use Case |
|---|---|---|
| 0 | 1× | No smoothing (flat surfaces) |
| 1 | 4× | Light smoothing, preview |
| 2 | 16× | Standard quality for renders |
| 3 | 64× | High-quality close-ups |
| 4+ | 256×+ | Extreme detail — USE SPARINGLY (very slow) |

**Rules:**
- Keep viewport levels ≤ 2 for performance
- Set render_levels 1 higher than viewport if needed
- Always apply SubSurf before export if target needs clean geometry

## BEVEL GUIDELINES

| Parameter | Purpose | Typical Values |
|---|---|---|
| `width` | Bevel size | 0.01–0.05 for subtle edge rounding, 0.1–0.5 for visible bevels |
| `segments` | Smoothness | 1 = chamfer, 3 = smooth, 6+ = very round |
| `limit_method` | Which edges to bevel | `ANGLE` (most common), `WEIGHT`, `NONE` |
| `angle_limit` | Angle threshold (if ANGLE) | 30° typical for hard-surface models |

**Scale matters:** Bevel width is in world units. A 0.02m bevel on a 2m cube is subtle; on a 0.1m object it's huge. Always consider object scale.

## BOOLEAN OPERATIONS

| Operation | Result |
|---|---|
| `DIFFERENCE` | Cut the target shape out of the object |
| `UNION` | Merge two shapes together |
| `INTERSECT` | Keep only the overlapping volume |

### Blender 5.x Boolean Solver
- **Use `EXACT` solver** — most reliable, handles complex geometry
- **`FAST` solver is REMOVED** in Blender 5.x — do NOT use it
- Available solvers: `EXACT`, `FLOAT`, `MANIFOLD`
- Always use `EXACT` unless you have specific performance concerns

## SHADE SMOOTH & AUTO-SMOOTH

### shade_smooth Tool
- `smooth: true` → Smooth shading (interpolated normals)
- `smooth: false` → Flat shading (faceted look)
- `angle` → Auto-smooth angle in degrees

### Auto-Smooth Angle Guidelines
| Angle | Effect | Best For |
|---|---|---|
| 15–20° | Only very gentle curves smooth | Mechanical parts, hard-surface |
| **30°** | **Standard** — sharp edges stay sharp, curves smooth | **Most objects** |
| 45° | More aggressive smoothing | Organic shapes |
| 60–80° | Almost everything smoothed | Characters, soft objects |
| 180° | Everything smooth (equivalent to full smooth) | Spheres, fluid |

## MODIFIER STACK ORDER

Order matters! Modifiers are applied top to bottom:

**Recommended order:**
1. Mirror (if using symmetry)
2. Array (if repeating)
3. Boolean (if cutting)
4. Subdivision Surface (smoothing)
5. Bevel (edge detail) — usually AFTER SubSurf or on its own

**Bad patterns:**
- ❌ SubSurf before Boolean — can cause artifacts at cut edges
- ❌ Bevel before Mirror — creates asymmetric bevels at mirror seam

## APPLY TRANSFORMS

**When to apply transforms:**
- ✅ Before export (GLB/FBX/OBJ) — prevents scale/rotation issues
- ✅ Before Boolean operations — ensures correct intersection
- ✅ Before adding physics simulations
- ✅ When object scale is not (1, 1, 1)

**What it does:** Resets location/rotation/scale to identity (0/0/1) while baking the current transform into the mesh data. Visual appearance stays the same.

## COMMON MISTAKES TO AVOID

1. ❌ Using `FAST` boolean solver — removed in Blender 5.x, use `EXACT`
2. ❌ SubSurf level 4+ in viewport — causes extreme lag, keep viewport ≤ 2
3. ❌ Forgetting to apply transforms before export — causes scaled/rotated models
4. ❌ Bevel width too large for small objects — always consider object scale
5. ❌ Not applying modifiers before joining objects — can lose modifier effects
