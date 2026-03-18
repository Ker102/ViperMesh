---
title: "Scene Management & Organization Guide"
category: "scene-management"
tags: ["scene", "transform", "collection", "parent", "origin", "visibility", "duplicate", "join", "rename", "delete", "hierarchy", "organization", "set_object_transform", "rename_object", "duplicate_object", "join_objects", "parent_set", "parent_clear", "set_origin", "move_to_collection", "set_visibility", "delete_object"]
triggered_by: ["set_object_transform", "rename_object", "duplicate_object", "join_objects", "parent_set", "parent_clear", "set_origin", "move_to_collection", "set_visibility", "delete_object"]
description: "Domain knowledge for object transforms, hierarchy management, collection organization, origin placement, and scene cleanup in Blender."
blender_version: "4.0+"
---

# Scene Management & Organization Guide

## TRANSFORM REFERENCE

### Location (World Space)
- Blender uses meters by default
- Origin (0, 0, 0) is the world center
- Z-axis is UP in Blender (not Y like in some game engines)
- Objects at Z=0 sit on the "ground plane"

### Rotation (Euler XYZ, in degrees)
- The `set_object_transform` tool accepts degrees (auto-converts to radians internally)
- X rotation: tilts forward/backward (pitch)
- Y rotation: rolls left/right (roll)
- Z rotation: turns left/right (yaw)

### Scale
- Default scale is (1, 1, 1)
- Uniform scale: use same value for all axes, e.g. (2, 2, 2) = double size
- Non-uniform scale: different per axis, e.g. (1, 1, 2) = stretched vertically
- **Apply transforms** before export to bake scale into mesh data

## OBJECT PLACEMENT PATTERNS

### Grounding Objects
Place objects so their bottom face sits at Z=0:
- For a 2m cube with origin at center: location Z = 1.0 (half the height)
- For a table 0.75m tall: location Z = 0.375 (if origin at center)
- Better: set origin to bottom first, then Z = 0

### Grid Layout
For arranging multiple objects in a row:
- Use consistent spacing (e.g., 2.5m apart for 1m objects)
- Keep objects on the same Z plane
- Example: 3 objects at X = -2.5, 0, 2.5

### Circular Arrangement
For objects around a center point:
- Calculate positions using angle: X = radius × sin(angle), Y = radius × cos(angle)
- Common for turntable displays, architectural columns

## HIERARCHY (Parent-Child)

### When to Use Parenting
- **Group movement:** Parent multiple parts to an empty, move the empty to move everything
- **Mechanical assemblies:** Parent wheels to car body, arms to torso
- **Organization:** Group related objects under an empty controller

### Parent Types
| Type | Use Case |
|---|---|
| `OBJECT` (default) | Standard parent-child, child follows parent transforms |
| `ARMATURE` | Character rigging, deformable mesh |
| `BONE` | Attach to specific bone in armature |

### Rules
- Child transforms are relative to parent
- `parent_clear` with `keep_transform: true` preserves world position
- Deeply nested hierarchies (>3 levels) should be avoided for performance

## COLLECTIONS (Blender's "Folders")

### Organization Patterns
| Collection Name | Purpose |
|---|---|
| `Geometry` | Main scene objects |
| `Lights` | All light objects |
| `Cameras` | Camera objects |
| `Helpers` | Empties, constraints, controllers |
| `Export` | Objects ready for export |
| `Reference` | Hidden reference objects |

### Rules
- Use `create_new: true` to create collections on the fly
- An object can exist in multiple collections (but usually shouldn't)
- Hide collections with `set_visibility` to declutter the viewport

## ORIGIN PLACEMENT

| Origin Type | Enum | Effect | Use Case |
|---|---|---|---|
| Geometry to origin | `ORIGIN_GEOMETRY` | Moves origin to mesh center | Most common, after modeling |
| Origin to geometry | `GEOMETRY_ORIGIN` | Moves mesh so origin is at mesh center | Centering objects |
| Origin to cursor | `ORIGIN_CURSOR` | Origin snaps to 3D cursor position | Precise placement |
| Origin to volume center | `ORIGIN_CENTER_OF_VOLUME` | Origin at volumetric center | Even weight distribution |

### Common Patterns
- **Grounding:** Set origin to bottom of mesh, then location Z=0
- **Rotation pivot:** Set origin to the logical center of rotation
- **Export prep:** Origin at geometry center for consistent import

## DUPLICATE vs. LINKED DUPLICATE

| Parameter | Full Duplicate | Linked Duplicate (`linked: true`) |
|---|---|---|
| Mesh data | Independent copy | **Shared** (editing one edits all) |
| Materials | Independent | Independent |
| Memory | Uses more RAM | Very efficient |
| Use case | Independent objects | Instancing (trees, chairs, bolts) |

**Rule:** Use linked duplicates for identical objects (like array of pillars) to save memory. Use full duplicates when each copy will be modified independently.

## NAMING CONVENTIONS

| Pattern | Example | Purpose |
|---|---|---|
| Descriptive | `Table_Leg_Front_Left` | Clear identification |
| Numbered | `Column_001`, `Column_002` | Repeated elements |
| Prefixed | `GEO_Wall`, `LGT_Key`, `CAM_Main` | Type identification |

**Rules:**
- Avoid generic names like "Cube", "Cube.001" — always rename
- Use consistent naming within a scene
- `rename_object` also renames the underlying data block

## COMMON MISTAKES TO AVOID

1. ❌ Forgetting to apply transforms before boolean operations — causes misaligned cuts
2. ❌ Leaving objects named "Cube.001", "Cube.002" — always rename for clarity
3. ❌ Using deeply nested parent hierarchies (>3 levels) — causes transform calculation issues
4. ❌ Deleting objects that are boolean targets — breaks the boolean modifier on the source
5. ❌ Moving objects without considering origin placement — origin stays at old position
6. ❌ Joining objects with different materials without checking material slots — can lose materials
