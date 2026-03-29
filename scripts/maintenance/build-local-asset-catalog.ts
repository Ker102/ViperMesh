import { mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from "fs"
import path from "path"
import {
  LocalAssetCatalogSchema,
  type LocalAssetCatalog,
  slugifyLocalAssetId,
  titleCaseFromSlug,
} from "../../lib/assets/local-catalog"

const SUPPORTED_ASSET_EXTENSIONS = new Set([".blend", ".glb", ".gltf", ".fbx", ".obj"])
const SUPPORTED_PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"]

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
      if (entry.name.startsWith(".") || entry.name === "catalog" || entry.name === "previews") {
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

function buildCatalog(root: string): LocalAssetCatalog {
  const assetFiles = walkFiles(root)
  const assets = assetFiles.map((filePath) => {
    const relativePath = path.relative(root, filePath)
    const directoryParts = path.dirname(relativePath) === "."
      ? []
      : path.dirname(relativePath).split(path.sep).filter(Boolean)
    const extension = path.extname(filePath).toLowerCase()
    const format = extension.slice(1) as "blend" | "glb" | "gltf" | "fbx" | "obj"
    const basename = path.basename(relativePath, extension)
    const idParts = [...directoryParts, basename].map(slugifyLocalAssetId).filter(Boolean)
    const tags = [...directoryParts, ...basename.split(/[-_ ]+/)].map(slugifyLocalAssetId).filter(Boolean)
    const category = directoryParts[directoryParts.length - 1] ?? "uncategorized"
    const previewPath = findPreviewPath(filePath)

    return {
      id: idParts.join("/"),
      name: titleCaseFromSlug(slugifyLocalAssetId(basename)),
      category: slugifyLocalAssetId(category) || "uncategorized",
      tags: Array.from(new Set(tags)),
      style: "",
      description: "",
      license: "",
      source: "user-curated",
      quality_score: 0.5,
      validated_blender_version: "5.x",
      preview_path: previewPath ? toPosixPath(path.relative(root, previewPath)) : undefined,
      import_spec: {
        file_path: toPosixPath(relativePath),
        format,
        ...(format === "blend"
          ? { append_type: "collections" as const, asset_names: [] }
          : {}),
      },
    }
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

  const catalog = buildCatalog(options.root)
  mkdirSync(path.dirname(options.out), { recursive: true })
  writeFileSync(options.out, `${JSON.stringify(catalog, null, 2)}\n`, "utf-8")

  const blendAssetsNeedingNames = catalog.assets.filter(
    (asset) => asset.import_spec.format === "blend" && (asset.import_spec.asset_names?.length ?? 0) === 0
  ).length

  console.log(`[LocalAssets] Wrote catalog with ${catalog.assets.length} assets to ${options.out}`)
  if (blendAssetsNeedingNames > 0) {
    console.log(
      `[LocalAssets] ${blendAssetsNeedingNames} .blend entries use the default first-collection import fallback; add import_spec.asset_names for precise imports.`
    )
  }
}

main()
