---
title: "Local Asset Library Guide"
category: "assets"
tags: ["asset library", "catalog", "local assets", "curated assets", "import", "commodity props", "search_local_assets", "import_local_asset"]
triggered_by: ["get_local_asset_library_status", "search_local_assets", "import_local_asset"]
description: "Guidance for using the curated local ViperMesh asset library before procedural modeling or external downloads."
blender_version: "5.0+"
---

# Local Asset Library Guide

## WHEN TO USE LOCAL ASSETS FIRST

Prefer the local curated asset library when the request includes:
- commodity props with familiar silhouettes
- repeated production assets used across many scenes
- realism-oriented decor, furniture, foliage, accessories, or footwear
- user-provided private assets that should stay available across sessions

Examples of good local-asset candidates:
- shoes, bags, lamps, books, vases, baskets
- small furniture and decor pieces
- plant arrangements and common foliage props
- branded or user-owned assets that should not be regenerated

## DECISION RULE

Choose the local asset library before `execute_code` when:
1. the prop is recognizable and reusable across scenes
2. the task benefits from realistic silhouette more than from bespoke procedural control
3. the asset does not need scene-specific topology generation

Choose `execute_code` instead when:
- the object is unique to the scene
- the shape is simple and faster to model than to search
- the user explicitly asked for procedural generation
- no acceptable local asset match exists

Choose PolyHaven when:
- you need CC0-safe external textures, HDRIs, or models
- the local library does not contain a suitable match

Keep the workflow hybrid:
- use direct tools and `execute_code` for room structure, spatial layout, cameras, lights, and custom hero forms
- use local curated assets for commodity props that benefit from a prepared silhouette
- after import, always treat scale and orientation as suspect until checked in scene context

## SEARCH STRATEGY

When searching the local catalog:
- start with the object's plain-language noun phrase
- add category or style filters only after the first search
- prefer the highest-quality match that already fits the intended realism/style
- do not import multiple near-duplicate assets unless comparison is necessary

## IMPORT STRATEGY

After importing a local asset:
- inspect what objects or collections were added
- place and scale it deliberately in scene context
- if the asset is complex, adjust only the root-level transforms first
- confirm silhouette and proportion with `get_viewport_screenshot`
- do not assume two different local assets share consistent real-world scale; correct them relative to nearby objects

## QUALITY RULE

For camera-visible detail props, a strong local asset match is better than a crude procedural proxy.

Do not spend multiple refinement passes procedurally rebuilding a common prop if the local curated library already contains a better reusable asset.
