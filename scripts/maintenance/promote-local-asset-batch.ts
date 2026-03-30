import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { z } from "zod"
import {
  LocalAssetCatalogSchema,
  LocalAssetImportFormatSchema,
  type LocalAssetCatalog,
  type LocalAssetEntry,
  loadLocalAssetCatalog,
  slugifyLocalAssetId,
} from "../../lib/assets/local-catalog"

const AssetImportSpecSchema = z.object({
  append_type: z.enum(["collection", "collections", "object", "objects"]).optional(),
  asset_names: z.array(z.string().min(1)).optional(),
})

const CuratedAssetBatchSchema = z.object({
  version: z.number().int().positive(),
  assets: z.array(
    z.object({
      source_path: z.string().min(1),
      curated_path: z.string().min(1),
      name: z.string().min(1),
      category: z.string().min(1),
      tags: z.array(z.string().min(1)).default([]),
      style: z.string().optional(),
      description: z.string().optional(),
      license: z.string().optional(),
      source: z.string().optional(),
      source_url: z.string().url().optional(),
      preview_path: z.string().optional(),
      quality_score: z.number().min(0).max(1).optional(),
      validated_blender_version: z.string().optional(),
      dimensions_m: z.array(z.number()).length(3).optional(),
      import_spec: AssetImportSpecSchema,
    })
  ),
})

type CuratedAssetBatch = z.infer<typeof CuratedAssetBatchSchema>

interface CliOptions {
  root: string
  plan: string
  out: string
}

function parseArgs(argv: string[]): CliOptions {
  let root = ""
  let plan = path.join(process.cwd(), "data", "local-assets", "initial-blenderkit-batch.json")
  let out = ""

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--root") {
      root = argv[index + 1] ?? ""
      index += 1
      continue
    }
    if (arg === "--plan") {
      plan = argv[index + 1] ?? plan
      index += 1
      continue
    }
    if (arg === "--out") {
      out = argv[index + 1] ?? ""
      index += 1
    }
  }

  if (!root) {
    throw new Error("Missing required --root <asset-library-folder> argument")
  }

  const resolvedRoot = path.resolve(root)
  const resolvedPlan = path.resolve(plan)
  const resolvedOut = out
    ? path.resolve(out)
    : path.join(resolvedRoot, "catalog", "assets.json")

  return {
    root: resolvedRoot,
    plan: resolvedPlan,
    out: resolvedOut,
  }
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/")
}

function normalizeCatalogPath(value: string): string {
  return toPosixPath(path.normalize(value)).replace(/^\.\//, "").toLowerCase()
}

function buildAssetId(relativePath: string): string {
  const extension = path.extname(relativePath)
  const withoutExtension = extension ? relativePath.slice(0, -extension.length) : relativePath
  return withoutExtension
    .split(/[\\/]+/)
    .map(slugifyLocalAssetId)
    .filter(Boolean)
    .join("/")
}

function loadBatch(planPath: string): CuratedAssetBatch {
  const raw = readFileSync(planPath, "utf-8")
  return CuratedAssetBatchSchema.parse(JSON.parse(raw) as unknown)
}

function loadExistingCatalog(catalogPath: string): LocalAssetCatalog {
  if (existsSync(catalogPath)) {
    return loadLocalAssetCatalog(catalogPath)
  }

  return LocalAssetCatalogSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    assets: [],
  })
}

function mergeEntries(existing: LocalAssetEntry[], promoted: LocalAssetEntry[]): LocalAssetEntry[] {
  const entryMap = new Map<string, LocalAssetEntry>()

  for (const entry of existing) {
    entryMap.set(normalizeCatalogPath(entry.import_spec.file_path), entry)
  }

  for (const entry of promoted) {
    entryMap.set(normalizeCatalogPath(entry.import_spec.file_path), entry)
  }

  return Array.from(entryMap.values()).sort((a, b) => a.id.localeCompare(b.id))
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const batch = loadBatch(options.plan)
  const existingCatalog = loadExistingCatalog(options.out)

  const promotedEntries: LocalAssetEntry[] = []

  for (const asset of batch.assets) {
    const sourcePath = path.join(options.root, asset.source_path)
    const curatedPath = path.join(options.root, asset.curated_path)
    const format = path.extname(curatedPath).toLowerCase().replace(/^\./, "")

    if (!existsSync(sourcePath)) {
      throw new Error(`Missing source asset: ${sourcePath}`)
    }

    mkdirSync(path.dirname(curatedPath), { recursive: true })
    copyFileSync(sourcePath, curatedPath)

    promotedEntries.push({
      id: buildAssetId(asset.curated_path),
      name: asset.name,
      category: slugifyLocalAssetId(asset.category) || "uncategorized",
      tags: Array.from(new Set(asset.tags.map(slugifyLocalAssetId).filter(Boolean))),
      style: asset.style,
      description: asset.description,
      license: asset.license,
      source: asset.source,
      source_url: asset.source_url,
      preview_path: asset.preview_path,
      quality_score: asset.quality_score,
      validated_blender_version: asset.validated_blender_version,
      dimensions_m: asset.dimensions_m,
      import_spec: {
        file_path: toPosixPath(asset.curated_path),
        format: LocalAssetImportFormatSchema.parse(format),
        append_type: asset.import_spec.append_type,
        asset_names: asset.import_spec.asset_names,
      },
    })
  }

  const nextCatalog = LocalAssetCatalogSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    library_root: options.root,
    assets: mergeEntries(existingCatalog.assets, promotedEntries),
  })

  mkdirSync(path.dirname(options.out), { recursive: true })
  writeFileSync(options.out, `${JSON.stringify(nextCatalog, null, 2)}\n`, "utf-8")

  console.log(
    `[LocalAssets] Promoted ${promotedEntries.length} curated assets from ${options.plan} into ${options.root}`
  )
  console.log(`[LocalAssets] Wrote merged catalog to ${options.out}`)
}

main()
