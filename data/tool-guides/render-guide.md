---
title: "Render Settings & Output Guide"
category: "render"
tags: ["render", "EEVEE", "Cycles", "resolution", "samples", "denoising", "output", "PNG", "JPEG", "transparent", "set_render_settings", "render_image"]
triggered_by: ["set_render_settings", "render_image"]
description: "Domain knowledge for render engine selection, sample counts, resolution presets, output formats, and Blender 5.x EEVEE-Next changes."
blender_version: "4.0+"
---

# Render Settings & Output Guide

## RENDER ENGINE COMPARISON

| Feature | EEVEE (EEVEE-Next in 5.x) | Cycles |
|---|---|---|
| Speed | Very fast (real-time) | Slow (ray-traced) |
| Quality | Good for most use cases | Photorealistic |
| Shadows | Approximate | Physically accurate |
| Reflections | Screen-space | Full ray-traced |
| Use when | Speed matters, product previews, animations | Final quality renders, lighting-critical scenes |
| Engine enum | `BLENDER_EEVEE` | `CYCLES` |

## SAMPLE COUNT GUIDELINES

### EEVEE (Blender 5.x uses EEVEE-Next)
| Quality Level | Samples | Use Case |
|---|---|---|
| Preview | 16–32 | Quick checks, testing composition |
| Standard | 64 | Good quality, fast render |
| High | 128–256 | Final renders, smooth gradients |

> **Blender 5.x change:** Use `scene.eevee.taa_samples` — the old `scene.eevee.taa_render_samples` is REMOVED in 5.x.

### Cycles
| Quality Level | Samples | Use Case |
|---|---|---|
| Preview | 32–64 | Quick test renders |
| Standard | 128–256 | Good quality with denoising |
| High | 512–1024 | Noise-free, complex lighting |
| Extreme | 2048+ | Caustics, glass, very dark scenes |

**Rule:** Always enable denoising for Cycles renders under 512 samples — it dramatically reduces noise.

## RESOLUTION PRESETS

| Name | Width × Height | Aspect | Use Case |
|---|---|---|---|
| 720p | 1280 × 720 | 16:9 | Quick previews |
| **1080p** | **1920 × 1080** | **16:9** | **Standard HD (most common)** |
| 1440p | 2560 × 1440 | 16:9 | QHD, high quality |
| 4K | 3840 × 2160 | 16:9 | Ultra HD, print |
| Square | 1080 × 1080 | 1:1 | Social media, Instagram |
| Portrait | 1080 × 1920 | 9:16 | Mobile/stories |

**Use `resolution_percentage`** to scale output: 50 = half resolution (fast test), 100 = full.

## OUTPUT FORMAT SELECTION

| Format | Quality | File Size | Transparency | Best For |
|---|---|---|---|---|
| **PNG** | Lossless | Large | ✅ Alpha | Default, quality renders |
| JPEG | Lossy | Small | ❌ No | Quick sharing, web |
| EXR | HDR lossless | Very large | ✅ Alpha | Compositing, post-processing |
| TIFF | Lossless | Large | ✅ Alpha | Print, archival |

**Default recommendation:** PNG for most renders. Use JPEG only when file size matters and you don't need transparency.

## TRANSPARENT BACKGROUND (`film_transparent`)

**Default: `film_transparent: false`** — most scenes should NOT use transparency.

### When to USE `film_transparent: true`
- **Product/object shots** where the object will be composited onto a different background
- **Asset renders** for catalogs, UI thumbnails, or web overlays
- **Compositing workflows** where the 3D render is layered over a photo/video

### When NOT to use `film_transparent: true`
- **Interior scenes** (rooms, kitchens, hallways) — walls and floors ARE the background
- **Exterior scenes** (landscapes, cityscapes) — the sky/environment IS the background
- **Any scene with environment geometry** (ground planes, backdrops, skyboxes)

> **Rule:** If the scene has walls, floors, or any environmental geometry, `film_transparent` should be `false`. Enabling it will make the background geometry partially invisible or remove it entirely, producing broken-looking renders.

The output must be saved as PNG (or EXR) to preserve the alpha channel. JPEG does NOT support transparency.

## BLENDER 5.x EEVEE-NEXT CHANGES

> **CRITICAL — these properties are REMOVED in Blender 5.x:**

| Removed Property | Replacement |
|---|---|
| `scene.eevee.use_ssr` | Removed (reflections handled differently) |
| `scene.eevee.use_gtao` | Removed (AO handled differently) |
| `scene.eevee.use_bloom` | Use **Compositor Glare node** (FOG_GLOW type) |
| `scene.eevee.taa_render_samples` | Use `scene.eevee.taa_samples` |
| `scene.eevee.shadow_cascade_size` | Removed |

## OUTPUT PATH HANDLING

- Use **absolute paths** for output: `/tmp/render.png`, `C:/tmp/render.png`
- If no output_path is provided, `render_image` saves to the scene's default output path
- Name files descriptively: `/tmp/product_shot.png`, `/tmp/scene_render.png`
- The render overwrites existing files at the same path without warning

## COMMON MISTAKES TO AVOID

1. ❌ Using `scene.eevee.taa_render_samples` in Blender 5.x — use `taa_samples` instead
2. ❌ Using `use_bloom`, `use_ssr`, `use_gtao` — all removed in 5.x
3. ❌ Setting Cycles samples to 2048+ without denoising — wastes render time
4. ❌ Saving transparent renders as JPEG — alpha channel is lost, use PNG
5. ❌ Forgetting to set the engine — always explicitly set EEVEE or CYCLES
