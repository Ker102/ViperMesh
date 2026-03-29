import { mkdirSync, existsSync, writeFileSync } from "fs"
import path from "path"

interface CliOptions {
  root: string
}

const SEED_DIRECTORIES = [
  "catalog",
  "incoming/a23d",
  "incoming/polyhaven",
  "incoming/private",
  "incoming/marketplace",
  "previews",
  "props/footwear/ankle-boots",
  "props/footwear/sneakers",
  "props/plants/olive-branches",
  "props/plants/indoor-potted",
  "props/baskets/woven",
  "props/lamps/table-lamps",
  "props/books/stacks",
  "props/decor/vases",
  "props/decor/mirrors",
  "furniture/console-tables",
  "furniture/chairs",
  "furniture/stools",
  "materials/wood",
  "materials/fabric",
  "materials/ceramic",
  "hdris/interior",
  "hdris/studio",
]

const README_CONTENT = `# ViperMesh Local Asset Library

This folder is the local curated asset source for the Blender agent.

Recommended workflow:
1. Place approved assets inside the category folders.
2. Keep preview images under \`previews/\` or next to the asset file when convenient.
3. Run \`npm run assets:catalog -- --root "<this-folder>"\` to generate or refresh \`catalog/assets.json\`.
4. Manually enrich the generated manifest with better tags, styles, quality scores, and exact .blend asset names.

Do not dump large uncontrolled asset packs into this library. Curate only the assets you actually want the agent to use.
`

const TAXONOMY_CONTENT = {
  version: 1,
  focus: [
    {
      category: "props/footwear",
      priority: 1,
      why: "Commodity prop with high silhouette sensitivity. Procedural generation often underperforms here.",
      starter_tags: ["boots", "sneakers", "heels", "casual", "formal", "leather", "fabric", "realistic"],
    },
    {
      category: "props/plants",
      priority: 1,
      why: "Foliage and branch structure are time-consuming procedurally and benefit strongly from curated assets.",
      starter_tags: ["olive", "indoor", "vase", "potted", "foliage", "greenery", "realistic"],
    },
    {
      category: "props/baskets",
      priority: 1,
      why: "Common scene filler prop with woven detail that is better reused than rebuilt.",
      starter_tags: ["woven", "rattan", "storage", "round", "natural"],
    },
    {
      category: "props/lamps",
      priority: 1,
      why: "Frequent prop in interior scenes with recognizable silhouette and material expectations.",
      starter_tags: ["table-lamp", "fabric-shade", "ceramic", "modern", "minimal"],
    },
    {
      category: "props/books",
      priority: 1,
      why: "Low-risk stackable decor prop useful across many scenes.",
      starter_tags: ["book", "stack", "hardcover", "decor", "minimal"],
    },
    {
      category: "furniture/console-tables",
      priority: 2,
      why: "Recurring interior anchor object that benefits from curated proportions and joinery.",
      starter_tags: ["console", "wood", "minimal", "scandinavian", "entryway"],
    },
    {
      category: "materials",
      priority: 2,
      why: "Reusable calibrated materials reduce setup time and improve consistency.",
      starter_tags: ["wood", "fabric", "ceramic", "neutral", "pbr"],
    },
    {
      category: "hdris",
      priority: 3,
      why: "Can often stay external via Poly Haven, but common favorites can be cached locally later.",
      starter_tags: ["interior", "studio", "soft-light", "window-light"],
    },
  ],
}

function parseArgs(argv: string[]): CliOptions {
  let root = ""

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--root") {
      root = argv[index + 1] ?? ""
      index += 1
    }
  }

  if (!root) {
    throw new Error("Missing required --root <asset-library-folder> argument")
  }

  return { root: path.resolve(root) }
}

function ensureFile(filePath: string, content: string) {
  if (existsSync(filePath)) return
  writeFileSync(filePath, content, "utf-8")
}

function main() {
  const { root } = parseArgs(process.argv.slice(2))
  mkdirSync(root, { recursive: true })

  for (const relativeDir of SEED_DIRECTORIES) {
    mkdirSync(path.join(root, relativeDir), { recursive: true })
  }

  ensureFile(path.join(root, "README.md"), README_CONTENT)
  ensureFile(path.join(root, "catalog", "taxonomy.json"), `${JSON.stringify(TAXONOMY_CONTENT, null, 2)}\n`)

  console.log(`[LocalAssets] Seeded library structure at ${root}`)
  console.log(`[LocalAssets] Next step: add assets, then run npm run assets:catalog -- --root "${root}"`)
}

main()
