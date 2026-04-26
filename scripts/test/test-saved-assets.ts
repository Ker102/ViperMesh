import assert from "node:assert/strict"

import {
    buildSavedAssetObjectKey,
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
    assert.equal(item.providerLabel, "Cloudflare R2")
    assert.equal(item.stageLabel, "Geometry")
    assert.equal(item.librarySource, "saved")
    assert.equal(item.isPinned, true)
    assert.equal(item.assetStats?.fileSizeBytes, 2048)
}

testObjectKeyUsesStableUserProjectAssetPath()
testSavedAssetMapsToGeneratedAssetItem()

console.log("saved asset helper tests passed")
