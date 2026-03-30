# Local Asset Library MVP

This project should treat the Blender Asset Library as the storage layer and ViperMesh's manifest as the retrieval layer.

## Recommended Library Shape

```text
C:\Users\krist\Documents\ViperMeshAssets\
  incoming\
    blenderkit\
    polyhaven\
    private\
    marketplace\
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

## Managed Defaults

The desktop app now bootstraps a managed local asset root automatically on startup.

Current default locations:

- managed library root: `Documents/ViperMeshAssets`
- managed catalog: `Documents/ViperMeshAssets/catalog/assets.json`
- reserved cache root: `Documents/ViperMeshAssets/cache`

The Blender addon now auto-discovers the same managed catalog and library root by default. That means:

- `Catalog JSON` no longer needs to be typed manually for the managed library
- `Library Root` can usually stay blank unless you want an explicit override
- users can still point the addon at a BYO catalog/root later

This is only a managed local baseline. The reserved cache path exists now so the production on-demand asset model has a stable home later, but the current runtime still imports from local files directly.

## Safe Places To Gather Models

Start with sources that are legally clean and operationally stable:

- Poly Haven for CC0-safe HDRIs, textures, and some models. Asset usage is free, but commercial API use has a separate permission path.  
  Sources: [License](https://polyhaven.com/license), [API](https://polyhaven.com/our-api)
- BlenderKit as a strong Blender-native discovery/download tool with a large integrated library and reasonable subscription pricing, but treat it cautiously for ViperMesh because its public user terms currently say the service may not be used to develop other products/services and assets may not be used in competing products/services.  
  Sources: [About](https://www.blenderkit.com/about-blenderkit), [Pricing](https://www.blenderkit.com/plans/pricing/), [Licenses](https://www.blenderkit.com/docs/licenses/), [User Terms](https://www.blenderkit.com/terms-and-conditions-2021/)
- A23D as a curated paid source for local-only ingestion, not as a library to mirror wholesale. Their public legal terms explicitly restrict circumvention/scraping and treat the assets as licensed, not sold. Public docs show Blender plugin/import workflows, but I did not find a public developer API spec strong enough to build against yet.  
  Sources: [Docs](https://www.a23d.co/docs), [Legal](https://www.a23d.co/legal)
- Adobe Substance 3D Assets as a high-quality source for materials/PBRs and some models, but public terms still need caution for an AI-agent-accessible internal library.  
  Sources: [Assets](https://www.adobe.com/products/substance3d/3d-assets.html), [Product Specific Terms](https://wwwimages2.adobe.com/content/dam/cc/en/legal/servicetou/Adobe-Substance-3D-Assets-Product-Specific-Terms-en_US-20240618.pdf)
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

## Intake Versus Curated Assets

Keep a hard separation between staging and reusable catalog entries:

- `incoming\...` is raw vendor intake only
- `props\...`, `furniture\...`, `materials\...`, and `hdris\...` are curated assets the agent may actually import
- the generated manifest should index only the curated side of the library

That means the workflow is:

1. Download or copy the source package into `incoming\...`
2. Inspect and clean the asset in Blender
3. Save the final reusable version into the curated folders as a stable `.blend`
4. Rebuild the catalog so it points at the curated file, not the raw vendor package

The catalog builder now skips `incoming\...` automatically and preserves existing enrichment such as tags, preview paths, quality scores, and exact `.blend` import names when you rebuild.

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

## BlenderKit Guidance

BlenderKit is attractive because:

- the library is very large
- the subscription is relatively inexpensive
- it is already deeply integrated into Blender through its addon
- it covers models, materials, HDRIs, scenes, brushes, and add-ons

But for ViperMesh there are two important caveats:

- I did not find a clearly documented public third-party developer API that I would treat as a stable integration target for the agent runtime
- BlenderKit's public user terms currently say the service may not be used in the development of other products/services, and BlenderKit assets may not be used in competing products/services

So the safe recommendation is:

- **good** for manual artist-side browsing and one-off scene work in Blender
- **possibly useful** for manual curation into a private internal library only after you are comfortable with the licensing interpretation
- **not** the first provider I would architect the ViperMesh agent runtime around

If you use BlenderKit, treat it first as a manual curation source:

1. download a chosen asset through the BlenderKit addon
2. clean it in Blender
3. save a curated `.blend`
4. index that curated file in the ViperMesh manifest

Do not start by building a custom automated backend against BlenderKit.

## Adobe Substance 3D Guidance

Adobe Substance 3D Assets are especially valuable for:

- PBR materials
- SBSAR-driven parametric materials
- polished production-grade surfaces

Technically, Adobe materials are more compelling for ViperMesh than Adobe models.

But the public Product Specific Terms for Substance 3D Assets still need caution for agent-accessible internal libraries, because Adobe's public terms restrict use tied to creating, training, testing, or improving AI/ML systems.

So the practical split is:

- **good** for manual artist-side look-dev and material work
- **excellent** as inspiration and manual authoring input
- **not automatically safe** as a default source for the reusable ViperMesh agent library without license clarity

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
npm run assets:init -- --root "C:\\Users\\krist\\Documents\\ViperMeshAssets"
npm run assets:promote -- --root "C:\\Users\\krist\\Documents\\ViperMeshAssets"
npm run assets:catalog -- --root "C:\\Users\\krist\\Documents\\ViperMeshAssets"
```

The first command creates the seed folder structure. The second promotes a curated batch from a repo-side plan into the external asset root and writes catalog entries. The third rescans the curated library and preserves metadata while refreshing the manifest.

The initial promotion plan for the current BlenderKit batch lives at:

- [initial-blenderkit-batch.json](C:/Users/krist/Desktop/Cursor-Projects/Projects/modelforge/ModelForge/data/local-assets/initial-blenderkit-batch.json)

You can still run the catalog script directly:

```bash
npx tsx scripts/maintenance/build-local-asset-catalog.ts --root "C:\\Users\\krist\\Documents\\ViperMeshAssets"
```

Then manually refine the generated `catalog/assets.json`:

- clean names
- add tags
- add quality scores
- add exact `.blend` `asset_names`
- add preview images

Rebuilding the catalog should be safe during curation:

- entries under `incoming\...` are ignored
- existing enriched metadata is preserved where the curated file path stays the same
- moved or renamed curated files will appear as new entries, which is usually the right behavior

## Runtime Model

The live Studio path should work like this:

1. Search local curated assets first for reusable commodity props.
2. If no match exists, fall back to Poly Haven for CC0-safe external assets.
3. Use Sketchfab only when explicitly enabled and license handling is acceptable.
4. Use procedural `execute_code` when the object is custom or no good asset exists.

## Seed Shortlist

Use [first-20-local-assets.md](C:/Users/krist/Desktop/Cursor-Projects/Projects/modelforge/ModelForge/docs/first-20-local-assets.md) as the first intake list with exact staging paths and curated target filenames.
