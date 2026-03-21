---
title: "Material Realism & Surface Differentiation Guide"
category: "materials"
tags: ["material", "realism", "PBR", "glass", "transparent", "IOR", "surface", "differentiation", "floor", "wall", "furniture", "category"]
triggered_by: ["create_material", "execute_code"]
description: "Higher-level material engineering principles for creating visually distinct and physically plausible materials across different functional surfaces. Covers material differentiation strategy, transparency setup, and surface category guidelines."
blender_version: "5.0+"
---

# Material Realism & Surface Differentiation Guide

## CORE PRINCIPLE: FUNCTIONAL SURFACE DIFFERENTIATION

In any scene, objects serve different functional roles. Each functional category MUST have a visually distinct material. Viewers subconsciously expect:
- **Floors** to look different from **walls**
- **Furniture** to look different from **structural surfaces**
- **Metal fixtures** to stand out from **wood furniture**
- **Transparent surfaces** (glass) to be clearly distinguishable

**Rule:** Before assigning materials, categorize every object into a functional group. Then ensure NO two groups share identical material parameters.

## MATERIAL DIFFERENTIATION STRATEGY

### Category-Based Material Planning
When building a scene with many objects, plan materials by category FIRST:

```
Scene: Coffee Shop
├── STRUCTURAL (walls, ceiling)     → Wall_Mat: cream, roughness 0.85
├── WALKING SURFACE (floor)         → Floor_Mat: dark wood, roughness 0.65
├── FURNITURE (tables, chairs, counter) → Furniture_Mat: medium wood, roughness 0.55
├── FIXTURES (coffee machine, taps)  → Metal_Mat: metallic 1.0, roughness 0.25
├── TRANSPARENT (windows)           → Glass_Mat: transmission 0.95, IOR 1.5
└── DECORATIVE (cushions, plants)   → Varied materials per item
```

### Same-Material-Type Differentiation
When multiple surfaces use the same base type (e.g., "wood"), differentiate with:

| Differentiator | Floor Wood | Furniture Wood | 
|---|---|---|
| Color tone | Darker/grayer | Warmer/richer |
| Roughness | 0.6–0.7 (worn) | 0.45–0.55 (polished) |
| Example RGB | [0.35, 0.22, 0.12] | [0.55, 0.35, 0.18] |

## TRANSPARENT MATERIAL SETUP (Blender 5.x)

### EEVEE Glass — Correct Pattern
Glass in EEVEE requires special setup. The `create_material` tool only sets basic Principled BSDF properties. For glass, you MUST use `execute_code`:

```python
import bpy

mat = bpy.data.materials.new("Glass_Mat")
mat.use_nodes = True

# Blender 5.x: use blend_method = 'BLEND' for transparency
mat.blend_method = 'BLEND'

nodes = mat.node_tree.nodes
bsdf = nodes["Principled BSDF"]

# Key properties for glass (use NEW socket names for 5.x)
bsdf.inputs["Transmission Weight"].default_value = 0.95  # NOT "Transmission"
bsdf.inputs["IOR"].default_value = 1.5
bsdf.inputs["Roughness"].default_value = 0.0
bsdf.inputs["Base Color"].default_value = (0.95, 0.97, 1.0, 1.0)  # Slight blue tint
```

### Common IOR Values
| Material | IOR | Notes |
|---|---|---|
| Air | 1.000 | Reference baseline |
| Water | 1.333 | Clear liquid |
| Ice | 1.309 | Frozen water |
| Glass (window) | 1.500 | Standard architectural glass |
| Glass (Pyrex) | 1.474 | Heat-resistant |
| Crystal | 2.000 | Decorative items |
| Plastic (clear) | 1.460 | Containers, packaging |
| Diamond | 2.418 | Gemstones |

### EEVEE Transparency Alternatives
For interior windows where refraction isn't critical:
- **Transparent shader** is often better than Glass shader in EEVEE — prevents light bleed artifacts
- If reflections aren't needed, simply removing glass geometry is acceptable
- For scenes prioritizing visual quality, consider using Cycles for final render

## PBR REALISM RULES

### Metal vs. Non-Metal (Strict Binary)
| Property | Metal | Non-Metal |
|---|---|---|
| Metallic | **1.0** | **0.0** |
| Specular | Has no effect (driven by Base Color) | Leave at default 0.5 (= 4% reflectance) |
| Base Color | Bright values (HSV value ≥ 0.7) | Avoid pure black or pure white |

**Rule:** Metallic is ALWAYS 0 or 1. Intermediate values (0.3, 0.5) create materials that don't exist in reality.

### Surface Category Material Properties
| Surface | Roughness | Metallic | Character |
|---|---|---|---|
| Walls (plaster/paint) | 0.8–0.95 | 0.0 | Matte, light-absorbing backdrop |
| Floor (hardwood) | 0.5–0.7 | 0.0 | Semi-glossy, shows reflections |
| Floor (tile/stone) | 0.6–0.8 | 0.0 | Harder surface, slight sheen |
| Furniture (wood) | 0.4–0.6 | 0.0 | Polished, warmer color |
| Fabric/upholstery | 0.85–0.95 | 0.0 | Very matte, use Sheen for cloth |
| Metal fixtures | 0.15–0.35 | 1.0 | Highly reflective, contrasts room |
| Ceramic | 0.1–0.2 | 0.0 | Very smooth, near-mirror finish |

### Cloth/Fabric Simulation
For fabric surfaces (cushions, upholstery), use the Sheen input:
```python
bsdf.inputs["Sheen Weight"].default_value = 0.5  # Blender 5.x name
bsdf.inputs["Roughness"].default_value = 0.9
```

## MATERIAL ORGANIZATION BEST PRACTICES

1. **Name materials descriptively**: `Wood_Oak_Light`, `Metal_Chrome`, `Glass_Window` — not `Material.001`
2. **One material per functional purpose**: Don't reuse `Wood_Mat` for both floor AND furniture
3. **Create materials before assigning**: Plan all materials, create them, THEN assign in a single pass
4. **Avoid duplicate material creation**: Check if a material with the same name already exists before creating

## COMMON MISTAKES TO AVOID

1. ❌ Same material on floor and furniture — always differentiate by color AND roughness
2. ❌ Setting metallic to 0.5 — use exactly 0 (non-metal) or 1 (metal)
3. ❌ Using "Transmission" instead of "Transmission Weight" — old 3.x socket name fails in 5.x
4. ❌ Creating glass with `create_material` alone — glass needs `execute_code` for IOR/Transmission
5. ❌ Forgetting `mat.blend_method = 'BLEND'` for transparent materials in EEVEE
6. ❌ Walls with same roughness as furniture — walls should be 0.8+ (matte), furniture 0.4–0.6
7. ❌ Pure white/black base colors for non-metals — stay within 10–95% brightness range
