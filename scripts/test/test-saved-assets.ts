import assert from "node:assert/strict"

import {
    buildSavedAssetObjectKey,
    buildSavedAssetPreviewObjectKey,
    buildSavedAssetThumbnailUrl,
    buildSavedAssetViewerUrlForObjectKey,
    mapSavedAssetRecordToGeneratedAsset,
} from "../../lib/projects/saved-assets"

function testObjectKeyUsesStableUserProjectAssetPath() {
    const key = buildSavedAssetObjectKey({
        userId: "user-123",
        projectId: "project-456",
        assetId: "asset-789",
        extension: ".GLB",
    })

    assert.equal(
        key,
        "users/user-123/projects/project-456/assets/asset-789/original.glb",
    )

    const packageKey = buildSavedAssetObjectKey({
        userId: "user-123",
        projectId: "project-456",
        assetId: "asset-zip",
        extension: ".gltf",
        packagePath: "Folder With Spaces/scene file.gltf",
    })

    assert.equal(
        packageKey,
        "users/user-123/projects/project-456/assets/asset-zip/package/Folder%20With%20Spaces/scene%20file.gltf",
    )
    assert.equal(
        buildSavedAssetViewerUrlForObjectKey("asset-zip", packageKey),
        "/api/projects/assets/asset-zip/files/Folder%20With%20Spaces/scene%20file.gltf",
    )
    assert.equal(
        buildSavedAssetViewerUrlForObjectKey("asset-789", key),
        "/api/projects/assets/asset-789/file?filename=original.glb",
    )
    assert.equal(
        buildSavedAssetViewerUrlForObjectKey("asset-789", key, "dragon.glb"),
        "/api/projects/assets/asset-789/file?filename=dragon.glb",
    )
    assert.equal(
        buildSavedAssetPreviewObjectKey({
            userId: "user-123",
            projectId: "project-456",
            assetId: "asset-789",
        }),
        "users/user-123/projects/project-456/assets/asset-789/preview.png",
    )
    assert.equal(
        buildSavedAssetThumbnailUrl("asset-789"),
        "/api/projects/assets/asset-789/thumbnail",
    )
    assert.equal(
        buildSavedAssetThumbnailUrl("asset-789", "v123"),
        "/api/projects/assets/asset-789/thumbnail?v=v123",
    )
}

function testSavedAssetMapsToGeneratedAssetItem() {
    const item = mapSavedAssetRecordToGeneratedAsset(
        {
            id: "asset-789",
            projectId: "project-456",
            sourceStepId: "neural-step-1",
            label: "dragon.glb",
            objectKey: "users/user-123/projects/project-456/assets/asset-789/original.glb",
            viewerUrl: "/api/projects/assets/asset-789/file",
            previewObjectKey: "users/user-123/projects/project-456/assets/asset-789/preview.png",
            previewUrl: "/api/projects/assets/asset-789/thumbnail",
            fileSizeBytes: 2048,
            assetStats: {
                triangleCount: 1200,
                materialCount: 2,
                textureCount: 3,
                meshCount: 1,
                sourceToolId: "hunyuan-shape",
                sourceToolLabel: "Hunyuan3D Shape 2.1",
                sourceProvider: "Cloudflare R2",
                stageLabel: "Geometry",
            },
            librarySource: "generated",
            isPinned: true,
            createdAt: new Date("2026-04-25T00:00:00.000Z"),
            updatedAt: new Date("2026-04-25T00:00:00.000Z"),
        },
        { viewerUrl: "/api/projects/assets/asset-789/file?download=0" },
    )

    assert.equal(item.id, "saved:asset-789")
    assert.equal(item.stepId, "neural-step-1")
    assert.equal(item.title, "dragon.glb")
    assert.equal(item.toolName, "hunyuan-shape")
    assert.equal(item.toolLabel, "Hunyuan3D Shape 2.1")
    assert.equal(item.viewerUrl, "/api/projects/assets/asset-789/file?download=0")
    assert.equal(item.previewImageUrl, "/api/projects/assets/asset-789/thumbnail")
    assert.equal(item.providerLabel, "Cloudflare R2")
    assert.equal(item.stageLabel, "Geometry")
    assert.equal(item.librarySource, "saved")
    assert.equal(item.isPinned, true)
    assert.equal(item.assetStats?.fileSizeBytes, 2048)

    const versionedItem = mapSavedAssetRecordToGeneratedAsset(
        {
            id: "asset-versioned",
            projectId: "project-456",
            sourceStepId: null,
            label: "versioned.glb",
            objectKey: "users/user-123/projects/project-456/assets/asset-versioned/original.glb",
            viewerUrl: "/api/projects/assets/asset-versioned/file",
            previewObjectKey: "users/user-123/projects/project-456/assets/asset-versioned/preview.png",
            previewUrl: "/api/projects/assets/asset-versioned/thumbnail",
            fileSizeBytes: 2048,
            assetStats: {
                thumbnailVersion: "v123",
            },
            librarySource: "imported",
            isPinned: false,
            createdAt: new Date("2026-04-25T00:00:00.000Z"),
            updatedAt: new Date("2026-04-25T00:00:00.000Z"),
        },
    )

    assert.equal(
        versionedItem.previewImageUrl,
        "/api/projects/assets/asset-versioned/thumbnail?v=v123",
    )
    assert.equal(
        versionedItem.viewerUrl,
        "/api/projects/assets/asset-versioned/file?filename=versioned.glb",
    )

    const inferredViewerItem = mapSavedAssetRecordToGeneratedAsset(
        {
            id: "asset-inferred",
            projectId: "project-456",
            sourceStepId: null,
            label: "inferred.glb",
            objectKey: "users/user-123/projects/project-456/assets/asset-inferred/original.glb",
            viewerUrl: null,
            previewObjectKey: null,
            previewUrl: null,
            fileSizeBytes: 2048,
            assetStats: null,
            librarySource: "imported",
            isPinned: false,
            createdAt: new Date("2026-04-25T00:00:00.000Z"),
            updatedAt: new Date("2026-04-25T00:00:00.000Z"),
        },
    )

    assert.equal(
        inferredViewerItem.viewerUrl,
        "/api/projects/assets/asset-inferred/file?filename=inferred.glb",
    )
}

testObjectKeyUsesStableUserProjectAssetPath()
testSavedAssetMapsToGeneratedAssetItem()

console.log("saved asset helper tests passed")
