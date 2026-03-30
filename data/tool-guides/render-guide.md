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

> **Blender 5.x sampling split:** `scene.eevee.taa_samples` controls viewport samples, while `scene.eevee.taa_render_samples` controls final render samples.

### Cycles
| Quality Level | Samples | Use Case |
|---|---|---|
| Preview | 32–64 | Quick test renders |
| Standard | 128–256 | Good quality with denoising |
| High | 512–1024 | Noise-free, complex lighting |
| Extreme | 2048+ | Caustics, glass, very dark scenes |

**Rule:** Always enable denoising for Cycles renders under 512 samples — it dramatically reduces noise.

## INTERACTIVE PREVIEW RULE

When the render is only for agent-side validation or user preview during an active build:
- Prefer **EEVEE** for fast preview renders
- If Cycles is required, keep it at **32-64 samples** with denoising
- Prefer lower preview resolution or `resolution_percentage < 100` unless the user explicitly asked for a final-quality frame
- Use higher sample counts only after the scene has already passed composition and silhouette review

**Rule:** Do not spend interactive tool budget on near-final Cycles settings unless the user explicitly asks for final render quality.

## CAMERA PRECONDITION

Before `render_image`:
- ensure the scene has an active camera
- if you created a camera this run, explicitly set it active before rendering
- do not assume a newly added camera becomes active automatically in every workflow

**Rule:** If no active camera is confirmed, do not call `render_image` yet.

## RENDER FAILURE POLICY

If a preview or final render fails once during the current run:
- do not keep retrying renders repeatedly in the same run
- fix obvious non-render issues only if they are cheap and certain
- otherwise stop at the failed render, explain the issue to the user, and ask whether to retry in a separate follow-up run

**Rule:** One failed render should not consume the rest of the interactive execution budget.

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

> **CRITICAL — legacy top-level EEVEE toggles changed in Blender 5.x:**

| Legacy Property | 5.x Guidance |
|---|---|
| `scene.eevee.use_ssr`, `scene.eevee.use_ssr_refraction`, `scene.eevee.use_screen_space_reflections` | Use current EEVEE ray-tracing / probe workflow instead of legacy SSR toggles |
| `scene.eevee.use_gtao`, `scene.eevee.gtao_distance`, `scene.eevee.gtao_quality` | Use current view-layer AO controls such as `view_layer.eevee.ambient_occlusion_distance` |
| `scene.eevee.use_bloom` | Use a compositor bloom/glare workflow |
| `scene.eevee.shadow_cascade_size` | Use current shadow controls such as `scene.eevee.shadow_resolution_scale`, `shadow_ray_count`, and `shadow_step_count` |

### Valid Sampling Properties in Blender 5.x

| Property | Purpose |
|---|---|
| `scene.eevee.taa_samples` | Viewport sampling |
| `scene.eevee.taa_render_samples` | Final render sampling |
| `view_layer.eevee.ambient_occlusion_distance` | Ambient occlusion distance control |

## OUTPUT PATH HANDLING

- Use **absolute paths** for output: `/tmp/render.png`, `C:/tmp/render.png`
- If no output_path is provided, `render_image` saves to the scene's default output path
- Name files descriptively: `/tmp/product_shot.png`, `/tmp/scene_render.png`
- The render overwrites existing files at the same path without warning

## COMMON MISTAKES TO AVOID

1. ❌ Confusing `scene.eevee.taa_samples` (viewport) with `scene.eevee.taa_render_samples` (final render)
2. ❌ Using legacy `use_bloom`, `use_ssr`, or `use_gtao` properties in Blender 5.x
3. ❌ Using `BLENDER_EEVEE_NEXT` instead of `BLENDER_EEVEE` in Blender 5.x
4. ❌ Setting Cycles samples to 2048+ without denoising — wastes render time
5. ❌ Saving transparent renders as JPEG — alpha channel is lost, use PNG
6. ❌ Forgetting to set the engine — always explicitly set EEVEE or CYCLES
7. ❌ Using near-final Cycles settings for an iterative preview render — use EEVEE or 32–64 sample Cycles first
