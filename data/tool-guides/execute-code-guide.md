---
title: "Execute Code Scene-Building Guide"
category: "execute-code"
tags: ["execute_code", "scene building", "reference image", "blockout", "refinement", "silhouette", "assembly", "blender python", "staging"]
triggered_by: ["execute_code"]
description: "General-purpose guidance for Blender Python scene construction in Blender 5.x+. Teaches staged reference reconstruction, focused refinement passes, and expert-level prop decomposition without collapsing an entire scene into one coarse script."
blender_version: "5.0+"
---

# Execute Code Scene-Building Guide

## CORE PRINCIPLE: STAGE THE SCENE, THEN REFINE WHAT THE CAMERA WILL REVEAL

`execute_code` is the strongest geometry tool, but it should NOT be used as one giant "do everything at once" script for a whole reference image.

An expert workflow is:
1. Build the **scene anchors** and overall layout
2. Verify proportions and placement visually
3. Refine the **camera-visible props** that still read incorrectly
4. Leave camera, lighting, render settings, and simple materials to direct tools when possible

**Rule:** Use `execute_code` in focused passes. Each pass should create or improve one logical cluster, not the entire final scene in one shot.

## WHEN `execute_code` IS THE RIGHT TOOL

Use `execute_code` for:
- Complex geometry creation
- Multi-part assemblies
- Organic or irregular forms
- Rebuilds that need vertex-level or modifier-level control
- Focused refinement of visible props after screenshot review

Do NOT use `execute_code` for:
- Simple light setup that direct light tools can handle
- Camera creation or basic lens changes
- Straightforward render settings
- Simple Principled material creation when `create_material` + `assign_material` is enough

## REFERENCE-DRIVEN RECONSTRUCTION WORKFLOW

### Pass 1: Structural Blockout
Create only the large spatial anchors:
- Room envelope or backdrop surfaces
- Ground plane / floor
- Main furniture or architectural masses
- Large hero objects that define composition

At this stage:
- Prioritize correct scale, spacing, alignment, and silhouette
- Use simple but intentional materials
- Do NOT spend time on delicate secondary props yet

### Pass 2: Visual Checkpoint
After the blockout, inspect a viewport screenshot and ask:
- Is the composition correct?
- Are the main masses aligned to the reference?
- Are the relative sizes plausible?
- Which objects still fail silhouette recognition?

If the answer is "mostly correct but some visible props read poorly", do NOT rebuild the whole scene. Run a focused refinement pass.

### Pass 3: Focused Refinement
Refine high-value props in separate `execute_code` calls.

A prop deserves its own refinement pass when it is:
- Near the camera
- High contrast against the background
- Positioned near the visual center
- Semantically distinctive enough that a crude proxy will be obvious

**Rule:** Small does not mean unimportant. If the viewer can clearly read the object, it needs a recognizable silhouette.

### Pass 4: Finalization
Once geometry is stable:
- Use direct tools for camera, lighting, render settings, and simple materials
- Use another focused `execute_code` pass only when a direct tool cannot produce the required result

## PROMINENCE-BASED DETAIL ALLOCATION

Not every object needs the same detail level. Allocate effort by **screen prominence**, not by object count.

### High-Prominence Objects
These need strong silhouette fidelity and secondary shape breakup:
- Large objects near frame center
- Foreground props
- Objects crossing strong light/shadow boundaries
- Objects with a very recognizable profile

### Medium-Prominence Objects
These need correct proportions and 2-4 meaningful sub-parts, but not micro-detail.

### Low-Prominence Objects
These may stay simplified, but must still avoid obviously nonsensical primitive stacks.

## MINIMUM-PART DECOMPOSITION RULE

For any camera-visible prop, preserve the silhouette with a minimum-part decomposition rather than a single primitive or disconnected rough stack.

General patterns:
- **Structural hard-surface prop:** primary mass + support/attachment element + edge treatment
- **Organic sprig/foliage prop:** stem or branch structure + leaf-bearing surfaces or clustered leaf volume
- **Contained or hollow prop:** body volume + opening/rim + support or handle logic
- **Wearable or contact-based prop:** upper body mass + contact/base mass + toe/heel/end-shape logic where applicable

**Rule:** If the object is represented only by thin lines, raw primitives, or unrelated blocks, it is still in blockout, not finished.

## ASSEMBLY AND POSITIONING RULES INSIDE `execute_code`

When constructing multi-part geometry:
- Build from the base outward
- Derive attachment points from dimensions, radii, and thicknesses
- Compute contact surfaces instead of eyeballing offsets
- Use `mathutils.Vector` and `matrix_world @ Vector(...)` when rotation affects placement

For close-contact placement:
- Determine the supporting surface of the existing object
- Determine the actual half-extent of the incoming object
- Place by surface-to-surface contact plus a small margin

Do not hardcode arbitrary offsets when you can calculate attachment or support positions from geometry.

## VISUAL QUALITY RULES

- Add bevels or softened edges to avoid overly sharp CG primitives
- Prefer tapered and non-uniform forms over perfect cylinders and cubes when realism requires it
- Use repeated sub-elements or clustered forms instead of bare placeholders for organic detail
- Keep naming explicit so follow-up refinement passes can target the right object cleanly

## COMMON FAILURES TO AVOID

1. ❌ Building the entire reference scene in one monolithic `execute_code` pass
2. ❌ Treating screenshot review as optional instead of as the trigger for focused refinement
3. ❌ Leaving prominent props in raw blockout state because the overall layout is "good enough"
4. ❌ Using line-like proxies for foliage or other volume-bearing organic forms
5. ❌ Using disconnected primitive stacks for camera-visible props that need a clear unified silhouette
6. ❌ Rebuilding stable scene anchors when only one prop actually needs refinement
7. ❌ Using `execute_code` for lights, camera, or render settings when direct tools already cover the task
