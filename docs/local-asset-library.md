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
- A23D as a curated paid source for local-only ingestion, not as a library to mirror wholesale. Their public legal terms explicitly restrict circumvention/scraping and treat the assets as licensed, not sold. Public docs show Blender plugin/import workflows, but I did not find a public developer API spec strong enough to build against yet.  
  Sources: [Docs](https://www.a23d.co/docs), [Legal](https://www.a23d.co/legal)
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

## A23D Guidance

If you use A23D, treat it as a selective source for the local catalog only after checking that your license covers your exact use case:

- download only the assets you actually want the agent to reuse
- ingest them into your own curated local library one by one
- keep source/license metadata in the manifest
- do not try to bulk-mirror the service into ViperMesh

Important constraint:

- A23D's Fair Usage Policy dated **January 6, 2026** says downloading assets solely to build private libraries is prohibited, and downloading assets for creating, testing, benchmarking, improving, or operating AI/generative systems is also prohibited.
- Their Licenses page dated **January 6, 2026** says only the **Business Commercial** license allows storage on company servers and internal asset libraries, and **Enterprise** may allow custom AI/ML permissions.

For ViperMesh specifically, that means a one-month binge download just to seed the agent's private asset library is not a safe assumption under their standard public terms. If you want to use A23D for the agent-accessible local library, the safer route is to ask A23D for written confirmation or an Enterprise/custom license covering this AI/internal-library workflow.

## Do Poly Haven Assets Need To Be Local?

Not initially.

For Poly Haven:

- the agent can keep pulling many HDRIs, textures, and models on demand through the existing integration
- you do not need to pre-populate your local library with every Poly Haven asset
- you should only cache locally the assets you use repeatedly and want to keep instantly available or reproducible

So the practical split is:

- **Poly Haven**: mostly on-demand, optionally cached later
- **A23D / private / paid / user assets**: local curated library first

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
npm run assets:init -- --root "D:\\ViperMeshAssets"
npm run assets:catalog -- --root "D:\\ViperMeshAssets"
```

The first command creates the seed folder structure. The second scans it and generates the starter manifest.

You can still run the catalog script directly:

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

## Seed Shortlist

Use [first-20-local-assets.md](C:/Users/krist/Desktop/Cursor-Projects/Projects/modelforge/ModelForge/docs/first-20-local-assets.md) as the first intake list with exact staging paths and curated target filenames.
