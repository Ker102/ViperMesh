# Local Asset Library MVP

This project should treat the Blender Asset Library as the storage layer and ViperMesh's manifest as the retrieval layer.

## Recommended Library Shape

```text
D:\ViperMeshAssets\
  props\
    footwear\
    plants\
    decor\
  furniture\
  materials\
  hdris\
  previews\
  catalog\
    assets.json
```

## Safe Places To Gather Models

Start with sources that are legally clean and operationally stable:

- Poly Haven for CC0-safe HDRIs, textures, and some models. Asset usage is free, but commercial API use has a separate permission path.  
  Sources: [License](https://polyhaven.com/license), [API](https://polyhaven.com/our-api)
- Your own expert-made assets for props that matter repeatedly in tests and demos.
- User-supplied private assets, which fit the local-library model especially well.
- Internal photogrammetry / scans or commissioned assets that you fully control.
- Purchased marketplace assets only if their license allows internal use in your pipeline. Do not assume redistribution rights.
- Selective Sketchfab downloads only when the specific model license is acceptable and the download/auth flow is handled correctly.  
  Sources: [Download API](https://sketchfab.com/developers/download-api), [Download Flow](https://sketchfab.com/developers/download-api/downloading-models), [Guidelines](https://sketchfab.com/developers/download-api/guidelines)

## What To Curate First

Do not try to build a huge library immediately. Start with the props that repeatedly fail procedural generation:

- footwear
- baskets and bags
- lamps
- books and small decor
- plants and foliage arrangements
- chairs and stools

The first useful library is small and opinionated, not large and messy.

## Manifest Rules

Each asset should have:

- stable `id`
- human-readable `name`
- `category`
- `tags`
- `style`
- `license`
- `source`
- `quality_score`
- `import_spec.file_path`
- `import_spec.format`

For `.blend` assets, also add:

- `import_spec.append_type`
- `import_spec.asset_names`

That avoids ambiguous imports.

## Bootstrapping

Use the bootstrap script to scan a library folder and generate a starter manifest:

```bash
npx tsx scripts/maintenance/build-local-asset-catalog.ts --root "D:\\ViperMeshAssets"
```

Then manually refine the generated `catalog/assets.json`:

- clean names
- fix categories
- add tags
- add quality scores
- add exact `.blend` `asset_names`
- add preview images

## Runtime Model

The live Studio path should work like this:

1. Search local curated assets first for reusable commodity props.
2. If no match exists, fall back to Poly Haven for CC0-safe external assets.
3. Use Sketchfab only when explicitly enabled and license handling is acceptable.
4. Use procedural `execute_code` when the object is custom or no good asset exists.
