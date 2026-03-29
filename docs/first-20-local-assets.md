# First 20 Local Asset Targets

This is the first intake shortlist for the ViperMesh local asset library.

## Format Rules

- **Download staging**: keep raw vendor downloads in `D:\ViperMeshAssets\incoming\...`
- **Final curated format**: prefer `.blend` for reusable local assets
- **Preview image**: save a `.png` preview in `D:\ViperMeshAssets\previews\...`
- **Manifest entry**: point the catalog to the final curated `.blend`, not the raw vendor package

Why `.blend` as the final format:
- best control over import names and collections
- easiest way to clean topology/materials once and reuse many times
- works well with the current `import_local_asset` tool

## Intake Process Per Asset

1. Download the source package into the staging path.
2. Import/clean it in Blender.
3. Save the curated asset as a single named collection in the final `.blend`.
4. Save one preview `.png`.
5. Add or refresh the manifest entry.

## First 20

| # | Target Asset | Preferred Source | Download To (Raw) | Curate To (Final) | Final Format |
|---|---|---|---|---|---|
| 1 | Dark leather ankle boots | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\footwear\ankle-boots-dark\` | `D:\ViperMeshAssets\props\footwear\ankle-boots\ankle_boots_dark_a.blend` | `.blend` |
| 2 | Brown suede ankle boots | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\footwear\ankle-boots-suede\` | `D:\ViperMeshAssets\props\footwear\ankle-boots\ankle_boots_suede_brown_a.blend` | `.blend` |
| 3 | White minimalist sneakers | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\footwear\sneakers-white\` | `D:\ViperMeshAssets\props\footwear\sneakers\sneakers_white_minimal_a.blend` | `.blend` |
| 4 | Black leather loafers | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\footwear\loafers-black\` | `D:\ViperMeshAssets\props\footwear\loafers_black_a.blend` | `.blend` |
| 5 | Olive branch vase arrangement | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\plants\olive-vase\` | `D:\ViperMeshAssets\props\plants\olive-branches\olive_branch_vase_a.blend` | `.blend` |
| 6 | Small potted olive tree | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\plants\olive-tree-small\` | `D:\ViperMeshAssets\props\plants\indoor-potted\olive_tree_small_a.blend` | `.blend` |
| 7 | Eucalyptus vase arrangement | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\plants\eucalyptus-vase\` | `D:\ViperMeshAssets\props\plants\eucalyptus_vase_a.blend` | `.blend` |
| 8 | Monstera in pot | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\plants\monstera-pot\` | `D:\ViperMeshAssets\props\plants\indoor-potted\monstera_pot_a.blend` | `.blend` |
| 9 | Round woven basket with handles | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\baskets\round-handled\` | `D:\ViperMeshAssets\props\baskets\woven\basket_round_handles_a.blend` | `.blend` |
| 10 | Tall woven hamper basket | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\baskets\tall-hamper\` | `D:\ViperMeshAssets\props\baskets\woven\basket_tall_hamper_a.blend` | `.blend` |
| 11 | Small tray basket | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\baskets\tray-small\` | `D:\ViperMeshAssets\props\baskets\woven\basket_tray_small_a.blend` | `.blend` |
| 12 | Lidded storage basket | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\baskets\lidded-storage\` | `D:\ViperMeshAssets\props\baskets\woven\basket_lidded_storage_a.blend` | `.blend` |
| 13 | Ceramic table lamp with linen shade | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\lamps\ceramic-linen\` | `D:\ViperMeshAssets\props\lamps\table-lamps\lamp_ceramic_linen_a.blend` | `.blend` |
| 14 | Stone table lamp | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\lamps\stone-table\` | `D:\ViperMeshAssets\props\lamps\table-lamps\lamp_stone_table_a.blend` | `.blend` |
| 15 | Brass desk lamp | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\lamps\brass-desk\` | `D:\ViperMeshAssets\props\lamps\table-lamps\lamp_brass_desk_a.blend` | `.blend` |
| 16 | Mushroom table lamp | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\lamps\mushroom\` | `D:\ViperMeshAssets\props\lamps\table-lamps\lamp_mushroom_a.blend` | `.blend` |
| 17 | Neutral hardcover book stack | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\books\stack-neutral\` | `D:\ViperMeshAssets\props\books\stacks\books_stack_neutral_a.blend` | `.blend` |
| 18 | Blue-gray art book stack | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\books\stack-blue-gray\` | `D:\ViperMeshAssets\props\books\stacks\books_stack_blue_gray_a.blend` | `.blend` |
| 19 | Single coffee-table book | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\books\coffee-table-single\` | `D:\ViperMeshAssets\props\books\stacks\book_coffee_table_single_a.blend` | `.blend` |
| 20 | Muted novel stack | Private / marketplace / A23D if license approved | `D:\ViperMeshAssets\incoming\a23d\books\novel-stack-muted\` | `D:\ViperMeshAssets\props\books\stacks\books_stack_novel_muted_a.blend` | `.blend` |

## What To Use A23D For

A23D is most valuable here for:
- footwear
- plants
- baskets
- lamps
- decor-grade books

Those are the exact categories where procedural generation tends to fail on recognizable silhouette and material fidelity.

## What To Keep On-Demand Instead

Do **not** prioritize localizing these first:
- Poly Haven HDRIs
- Poly Haven PBR materials
- one-off environment textures

Those can stay external through the current Poly Haven integration unless they become repeat-use favorites.
