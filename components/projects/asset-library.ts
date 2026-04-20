"use client"

import type { GeneratedAssetItem } from "./generated-assets"

export type AssetLibraryCategoryId =
    | "all"
    | "textured"
    | "geometry"
    | "high-poly"
    | "low-poly"
    | "images"

export interface AssetLibraryCategory {
    id: AssetLibraryCategoryId
    label: string
    description: string
    count: number
}

export interface AssetLibraryItem extends GeneratedAssetItem {
    librarySource: "generated"
    assetKind: "model" | "image"
    densityBucket: "high-poly" | "low-poly" | "unknown"
    libraryCategoryIds: AssetLibraryCategoryId[]
}

export interface ProjectAssetLibrary {
    items: AssetLibraryItem[]
    categories: AssetLibraryCategory[]
}

const CATEGORY_META: Record<AssetLibraryCategoryId, Pick<AssetLibraryCategory, "label" | "description">> = {
    all: {
        label: "All",
        description: "Everything available in this project library shell.",
    },
    textured: {
        label: "Textured",
        description: "Painted or material-carrying 3D assets ready for look-dev review.",
    },
    geometry: {
        label: "Geometry",
        description: "Shape or cleanup outputs before texturing or final export.",
    },
    "high-poly": {
        label: "High Poly",
        description: "Heavier meshes kept for hero detail, texturing, or bake sources.",
    },
    "low-poly": {
        label: "Low Poly",
        description: "Lighter meshes better suited for runtime, export, or game workflows.",
    },
    images: {
        label: "Images",
        description: "Reference or image outputs that can feed later stages.",
    },
}

const HIGH_POLY_TRIANGLE_THRESHOLD = 20000

function normalizeStageLabel(stageLabel?: string | null) {
    return stageLabel?.trim().toLowerCase() ?? ""
}

function classifyDensity(asset: GeneratedAssetItem): AssetLibraryItem["densityBucket"] {
    const triangleCount = asset.assetStats?.triangleCount
    if (!triangleCount || triangleCount <= 0) {
        return "unknown"
    }
    return triangleCount > HIGH_POLY_TRIANGLE_THRESHOLD ? "high-poly" : "low-poly"
}

function classifyKind(asset: GeneratedAssetItem): AssetLibraryItem["assetKind"] {
    const stage = normalizeStageLabel(asset.stageLabel)
    if (stage.includes("image")) {
        return "image"
    }
    return "model"
}

function classifyCategoryIds(asset: GeneratedAssetItem): AssetLibraryCategoryId[] {
    const stage = normalizeStageLabel(asset.stageLabel)
    const densityBucket = classifyDensity(asset)
    const kind = classifyKind(asset)

    const categories = new Set<AssetLibraryCategoryId>(["all"])

    if (kind === "image") {
        categories.add("images")
        return [...categories]
    }

    if (stage.includes("textur")) {
        categories.add("textured")
    } else {
        categories.add("geometry")
    }

    if (densityBucket === "high-poly") {
        categories.add("high-poly")
    }

    if (densityBucket === "low-poly") {
        categories.add("low-poly")
    }

    return [...categories]
}

export function buildProjectAssetLibrary(generatedAssets: GeneratedAssetItem[]): ProjectAssetLibrary {
    const items: AssetLibraryItem[] = generatedAssets.map((asset) => {
        const densityBucket = classifyDensity(asset)
        const assetKind = classifyKind(asset)
        return {
            ...asset,
            librarySource: "generated",
            assetKind,
            densityBucket,
            libraryCategoryIds: classifyCategoryIds(asset),
        }
    })

    const categories = (Object.keys(CATEGORY_META) as AssetLibraryCategoryId[])
        .map((id) => ({
            id,
            label: CATEGORY_META[id].label,
            description: CATEGORY_META[id].description,
            count: items.filter((item) => item.libraryCategoryIds.includes(id)).length,
        }))
        .filter((category) => category.id === "all" || category.count > 0)

    return {
        items,
        categories,
    }
}

export function filterProjectAssetLibraryItems(
    library: ProjectAssetLibrary,
    categoryId: AssetLibraryCategoryId,
): AssetLibraryItem[] {
    if (categoryId === "all") {
        return library.items
    }

    return library.items.filter((item) => item.libraryCategoryIds.includes(categoryId))
}
