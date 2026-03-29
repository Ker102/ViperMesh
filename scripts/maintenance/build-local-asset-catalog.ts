import { mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from "fs"
import path from "path"
import {
  LocalAssetCatalogSchema,
  type LocalAssetCatalog,
  type LocalAssetEntry,
  loadLocalAssetCatalog,
  slugifyLocalAssetId,
  titleCaseFromSlug,
} from "../../lib/assets/local-catalog"

const SUPPORTED_ASSET_EXTENSIONS = new Set([".blend", ".glb", ".gltf", ".fbx", ".obj"])
const SUPPORTED_PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"]
const EXCLUDED_ROOT_DIRECTORIES = new Set(["catalog", "incoming", "previews"])

interface CliOptions {
  root: string
  out: string
}

function parseArgs(argv: string[]): CliOptions {
  let root = ""
  let out = ""

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--root") {
      root = argv[index + 1] ?? ""
      index += 1
    } else if (arg === "--out") {
      out = argv[index + 1] ?? ""
      index += 1
    }
  }

  if (!root) {
    throw new Error("Missing required --root <asset-library-folder> argument")
  }

  const resolvedRoot = path.resolve(root)
  const resolvedOut = out
    ? path.resolve(out)
    : path.join(resolvedRoot, "catalog", "assets.json")

  return { root: resolvedRoot, out: resolvedOut }
}

function walkFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || EXCLUDED_ROOT_DIRECTORIES.has(entry.name.toLowerCase())) {
        continue
      }
      files.push(...walkFiles(fullPath))
      continue
    }

    if (!entry.isFile()) continue
    const extension = path.extname(entry.name).toLowerCase()
    if (SUPPORTED_ASSET_EXTENSIONS.has(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/")
}

function normalizeCatalogPath(value: string): string {
  return toPosixPath(path.normalize(value)).replace(/^\.\//, "").toLowerCase()
}

function dedupeStrings(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && value.length > 1))
    )
  )
}

function buildGeneratedTags(directoryParts: string[], basename: string): string[] {
  const tags = [...directoryParts, ...basename.split(/[-_ ]+/)]
    .map(slugifyLocalAssetId)
    .filter((tag) => tag.length > 1)

  return Array.from(new Set(tags))
}

function deriveCategory(directoryParts: string[]): string {
  const normalizedParts = directoryParts.map(slugifyLocalAssetId).filter(Boolean)
  if (normalizedParts.length === 0) {
    return "uncategorized"
  }

  const [rootGroup, nextGroup, lastGroup] = normalizedParts
  if (rootGroup === "props") {
    return nextGroup || lastGroup || "uncategorized"
  }

  return lastGroup || "uncategorized"
}

function findPreviewPath(assetPath: string): string | undefined {
  const baseWithoutExtension = assetPath.slice(0, assetPath.length - path.extname(assetPath).length)
  for (const extension of SUPPORTED_PREVIEW_EXTENSIONS) {
    const previewPath = `${baseWithoutExtension}${extension}`
    if (existsSync(previewPath)) {
      return previewPath
    }
  }
  return undefined
}

function buildExistingAssetIndex(catalogPath: string): Map<string, LocalAssetEntry> {
  if (!existsSync(catalogPath)) {
    return new Map()
  }

  const existingCatalog = loadLocalAssetCatalog(catalogPath)
  return new Map(
    existingCatalog.assets.map((asset) => [
      normalizeCatalogPath(asset.import_spec.file_path),
      asset,
    ])
  )
}

function mergeWithExistingAsset(
  generatedAsset: LocalAssetEntry,
  existingAsset?: LocalAssetEntry
): LocalAssetEntry {
  if (!existingAsset) {
    return generatedAsset
  }

  const existingTags = Array.isArray(existingAsset.tags) ? existingAsset.tags : []
  const generatedTags = Array.isArray(generatedAsset.tags) ? generatedAsset.tags : []

  return {
    ...generatedAsset,
    name: existingAsset.name?.trim() || generatedAsset.name,
    tags: dedupeStrings([...existingTags, ...generatedTags]),
    style: existingAsset.style ?? generatedAsset.style,
    description: existingAsset.description ?? generatedAsset.description,
    license: existingAsset.license ?? generatedAsset.license,
    source: existingAsset.source ?? generatedAsset.source,
    source_url: existingAsset.source_url ?? generatedAsset.source_url,
    preview_path: existingAsset.preview_path ?? generatedAsset.preview_path,
    quality_score: existingAsset.quality_score ?? generatedAsset.quality_score,
    validated_blender_version:
      existingAsset.validated_blender_version ?? generatedAsset.validated_blender_version,
    dimensions_m: existingAsset.dimensions_m ?? generatedAsset.dimensions_m,
    import_spec: {
      ...generatedAsset.import_spec,
      append_type: existingAsset.import_spec.append_type ?? generatedAsset.import_spec.append_type,
      asset_names: existingAsset.import_spec.asset_names ?? generatedAsset.import_spec.asset_names,
    },
  }
}

function buildCatalog(root: string, outPath: string): LocalAssetCatalog {
  const assetFiles = walkFiles(root)
  const existingAssets = buildExistingAssetIndex(outPath)
  const assets = assetFiles.map((filePath) => {
    const relativePath = path.relative(root, filePath)
    const directoryParts = path.dirname(relativePath) === "."
      ? []
      : path.dirname(relativePath).split(path.sep).filter(Boolean)
    const extension = path.extname(filePath).toLowerCase()
    const format = extension.slice(1) as "blend" | "glb" | "gltf" | "fbx" | "obj"
    const basename = path.basename(relativePath, extension)
    const idParts = [...directoryParts, basename].map(slugifyLocalAssetId).filter(Boolean)
    const tags = buildGeneratedTags(directoryParts, basename)
    const category = deriveCategory(directoryParts)
    const previewPath = findPreviewPath(filePath)
    const catalogFilePath = toPosixPath(relativePath)
    const existingAsset = existingAssets.get(normalizeCatalogPath(catalogFilePath))

    const generatedAsset: LocalAssetEntry = {
      id: idParts.join("/"),
      name: titleCaseFromSlug(slugifyLocalAssetId(basename)),
      category: slugifyLocalAssetId(category) || "uncategorized",
      tags,
      style: "",
      description: "",
      license: "",
      source: "user-curated",
      quality_score: 0.5,
      validated_blender_version: "5.x",
      preview_path: previewPath ? toPosixPath(path.relative(root, previewPath)) : undefined,
      import_spec: {
        file_path: catalogFilePath,
        format,
        ...(format === "blend"
          ? { append_type: "collections" as const, asset_names: [] }
          : {}),
      },
    }

    return mergeWithExistingAsset(generatedAsset, existingAsset)
  })

  return LocalAssetCatalogSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    library_root: root,
    assets: assets.sort((a, b) => a.id.localeCompare(b.id)),
  })
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const rootStats = statSync(options.root)
  if (!rootStats.isDirectory()) {
    throw new Error(`Asset root is not a directory: ${options.root}`)
  }

  const catalog = buildCatalog(options.root, options.out)
  mkdirSync(path.dirname(options.out), { recursive: true })
  writeFileSync(options.out, `${JSON.stringify(catalog, null, 2)}\n`, "utf-8")

  const blendAssetsNeedingNames = catalog.assets.filter(
    (asset) => asset.import_spec.format === "blend" && (asset.import_spec.asset_names?.length ?? 0) === 0
  ).length

  console.log(`[LocalAssets] Wrote catalog with ${catalog.assets.length} assets to ${options.out}`)
  console.log("[LocalAssets] Indexed curated assets only; raw intake folders under incoming/ are skipped.")
  if (blendAssetsNeedingNames > 0) {
    console.log(
      `[LocalAssets] ${blendAssetsNeedingNames} .blend entries still use the default first-collection import fallback; add import_spec.asset_names for precise imports.`
    )
  }
}

main()
