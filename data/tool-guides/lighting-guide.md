---
title: "Lighting Setup & Configuration Guide"
category: "lighting"
tags: ["lighting", "light", "energy", "color temperature", "three-point", "studio", "sun", "spot", "area", "point", "HDRI", "add_light", "set_light_properties"]
triggered_by: ["add_light", "set_light_properties"]
description: "Domain knowledge for light type selection, energy scaling, color temperature, shadow configuration, and professional lighting setups in Blender."
blender_version: "4.0+"
---

# Lighting Setup & Configuration Guide

## LIGHT TYPE SELECTION

| Type | Behavior | Best For | Key Properties |
|---|---|---|---|
| **POINT** | Emits light in all directions from a point | Lamps, candles, fill lights | `energy`, `shadow_soft_size` |
| **SUN** | Parallel rays, position doesn't matter (only rotation) | Outdoor scenes, directional key light | `energy` (1–5 for EEVEE), `shadow_soft_size` |
| **SPOT** | Cone of light from a point | Stage lighting, focused highlights, dramatic | `energy`, `spot_size` (degrees), `spot_blend` |
| **AREA** | Emits from a rectangular/square surface | Soft studio lighting, product photography | `energy`, `size` (larger = softer shadows) |

## ENERGY SCALE BY ENGINE

Energy values differ dramatically between EEVEE and Cycles:

| Light Type | EEVEE Energy | Cycles Energy | Note |
|---|---|---|---|
| POINT | 100–1000 W | 100–1000 W | Similar scale |
| SUN | 1–5 | 1–5 | Low values, very powerful |
| SPOT | 200–1500 W | 200–1500 W | Similar scale |
| AREA | 200–800 W | 200–800 W | Size affects perceived brightness |

**Rule:** Start with these ranges and adjust. If the scene is too dark, multiply energy by 2–3×. If too bright, halve it.

## COLOR TEMPERATURE REFERENCE

Use these RGB values (0–1 range) to simulate real-world color temperatures:

| Temperature | Name | RGB Value | Use Case |
|---|---|---|---|
| 1800K | Candle | (1.0, 0.58, 0.16) | Warm intimate scenes |
| 2700K | Warm tungsten | (1.0, 0.76, 0.46) | Indoor residential lighting |
| 3500K | Warm white | (1.0, 0.84, 0.66) | Office/commercial lighting |
| 4500K | Neutral | (1.0, 0.92, 0.82) | Neutral fill light |
| 5500K | Daylight | (1.0, 0.96, 0.92) | Outdoor daylight, key light |
| 6500K | Overcast | (0.87, 0.91, 1.0) | Cloudy sky, cool fill |
| 8000K | Blue sky | (0.75, 0.83, 1.0) | Shade/sky fill, cool rim |

## PROFESSIONAL LIGHTING SETUPS

### Three-Point Lighting (Most Common)
- **Key light** (AREA, right side, 45° above): Energy 600–800, warm daylight color, size 2.0
- **Fill light** (AREA, left side, lower): Energy 200–400 (30–50% of key), cool blue tint, size 4.0
- **Rim/back light** (SPOT, behind subject): Energy 400–600, white, creates edge separation

Positioning relative to target at origin:
- Key: (5, -5, 5) — 45° right, 45° above
- Fill: (-4, -3, 2) — opposite side, lower
- Rim: (1, 6, 4) — behind, slightly off-center

### Studio Product Lighting
- 4-light setup: Key (top-right), Fill (top-left), Ground bounce (below), Background (behind)
- All AREA lights with large sizes (5–8m) for extremely soft shadows
- Key energy 600, Fill 250, Bounce 100, Background 200

### Outdoor Sunlight
- SUN light: Energy 3–5, warm color (1.0, 0.95, 0.85), small angle (0.5°) for sharp shadows
- Sky fill: Large AREA light from above, energy 80–100, cool blue (0.3, 0.55, 0.9)

### Dramatic/Cinematic
- Single strong SPOT as key (one side), energy 1000–1200
- Colored rim SPOT from opposite side, energy 600–800, blue tint (0.3, 0.5, 1.0)
- Minimal or no fill light for high contrast

## SHADOW GUIDELINES

| Parameter | Effect | Recommendation |
|---|---|---|
| `shadow_soft_size` | Larger = softer/blurrier shadows | 0.5–1.0 for hard, 2.0–4.0 for soft |
| AREA `size` | Larger area = naturally softer shadows | 2.0 sharp, 5.0+ soft studio |
| SUN `angle` | Controls sun shadow softness | 0.5° sharp, 2–5° soft |

## COMMON MISTAKES TO AVOID

1. ❌ Using POINT lights for all lighting — AREA is better for soft, realistic shadows
2. ❌ Setting SUN energy to 100+ — SUN uses much lower values (1–5 for EEVEE)
3. ❌ Forgetting light color — default white (1,1,1) feels flat; warm key + cool fill adds depth
4. ❌ Only using one light — even simple scenes benefit from key + fill at minimum
5. ❌ Not aiming lights at the target — use Track To constraint or calculate rotation toward subject
