---
title: "Materials & PBR Configuration Guide"
category: "materials"
tags: ["material", "PBR", "Principled BSDF", "metallic", "roughness", "color", "glass", "metal", "wood", "plastic", "create_material", "assign_material"]
triggered_by: ["create_material", "assign_material"]
description: "Domain knowledge for Principled BSDF material setup, PBR parameter ranges, common surface presets, and Blender 5.x material API changes."
blender_version: "4.0+"
---

# Materials & PBR Configuration Guide

## PRINCIPLED BSDF PARAMETER REFERENCE

The `create_material` tool creates a Principled BSDF material. These are the key parameters:

| Parameter | Range | What It Controls |
|---|---|---|
| `color` (Base Color) | [R, G, B] 0–1 | Surface color |
| `metallic` | 0–1 | 0 = dielectric (plastic, wood), 1 = metal (steel, gold) |
| `roughness` | 0–1 | 0 = mirror/gloss, 1 = matte/diffuse |

**Rule:** Metallic is almost always either 0 or 1. Values between 0.0 and 1.0 are physically unrealistic — real surfaces are either metal or non-metal.

## COMMON SURFACE PRESETS

### Metals (metallic = 1.0)
| Surface | Color [R,G,B] | Roughness | Notes |
|---|---|---|---|
| Polished steel | [0.8, 0.8, 0.85] | 0.15–0.25 | |
| Brushed steel | [0.8, 0.8, 0.85] | 0.35–0.5 | |
| Gold | [1.0, 0.84, 0.0] | 0.2–0.35 | |
| Copper | [0.95, 0.64, 0.54] | 0.25–0.4 | |
| Bronze | [0.8, 0.5, 0.2] | 0.3–0.5 | |
| Iron/cast | [0.5, 0.5, 0.5] | 0.6–0.8 | |
| Aluminum | [0.91, 0.92, 0.93] | 0.2–0.4 | |
| Chrome | [0.55, 0.55, 0.55] | 0.05–0.1 | Very reflective |

### Non-Metals (metallic = 0.0)
| Surface | Color [R,G,B] | Roughness | Notes |
|---|---|---|---|
| White plastic | [0.9, 0.9, 0.9] | 0.3–0.5 | |
| Red plastic | [0.8, 0.1, 0.1] | 0.3–0.5 | |
| Rubber | [0.15, 0.15, 0.15] | 0.8–0.95 | Very matte |
| Wood (light) | [0.55, 0.35, 0.18] | 0.5–0.7 | |
| Wood (dark) | [0.25, 0.15, 0.08] | 0.5–0.7 | |
| Concrete | [0.5, 0.5, 0.48] | 0.85–0.95 | |
| Ceramic/porcelain | [0.95, 0.95, 0.92] | 0.1–0.2 | Very smooth |
| Fabric/cloth | [varies] | 0.85–0.95 | Very matte |

### Special Materials (require additional properties via execute_code)
| Surface | Key Properties | Notes |
|---|---|---|
| Glass | Transmission Weight = 0.9–1.0, IOR = 1.5, Roughness = 0.0 | Use execute_code for these |
| Water | Transmission Weight = 0.9, IOR = 1.33, Roughness = 0.02 | |
| Skin | Subsurface Weight = 0.3, Subsurface Radius = [0.1, 0.05, 0.02] | |
| Emissive | Emission Color + Emission Strength via node setup | |

## BLENDER 5.x SOCKET NAME CHANGES

> **CRITICAL:** These socket names changed in Blender 4.0+ and are the ONLY valid names in 5.x:

| Old Name (3.x) | New Name (4.0+ / 5.x) |
|---|---|
| `Clearcoat` | `Coat Weight` |
| `Clearcoat Roughness` | `Coat Roughness` |
| `Sheen` | `Sheen Weight` |
| `Transmission` | `Transmission Weight` |
| `Subsurface` | `Subsurface Weight` |

Always use the new names. The old names will cause errors in Blender 5.x.

## MATERIAL ASSIGNMENT RULES

1. **create_material** creates the material, **assign_material** applies it to an object
2. Default slot_index = 0 replaces the first material slot (most common)
3. Use slot_index = -1 to append as a new material slot (for multi-material objects)
4. An object can have multiple material slots, each applied to different faces

## COLOR VALUE REFERENCE

Common colors in [R, G, B] format (0–1 range):

| Color | RGB | | Color | RGB |
|---|---|---|---|---|
| Pure white | [1.0, 1.0, 1.0] | | Pure black | [0.0, 0.0, 0.0] |
| Red | [0.8, 0.1, 0.1] | | Blue | [0.1, 0.2, 0.8] |
| Green | [0.1, 0.6, 0.1] | | Yellow | [0.9, 0.8, 0.1] |
| Orange | [0.9, 0.4, 0.05] | | Purple | [0.5, 0.1, 0.7] |
| Teal | [0.05, 0.6, 0.55] | | Pink | [0.9, 0.3, 0.5] |
| Dark gray | [0.15, 0.15, 0.15] | | Light gray | [0.75, 0.75, 0.75] |

## COMMON MISTAKES TO AVOID

1. ❌ Setting metallic to 0.5 — it should be 0 or 1, not in between
2. ❌ Using old socket names (Clearcoat, Transmission) — use Coat Weight, Transmission Weight
3. ❌ Forgetting to assign the material after creating it — create_material + assign_material
4. ❌ Setting glass/water via create_material alone — transmission and IOR require execute_code for node access
