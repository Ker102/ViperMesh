"use client"

import React, { Suspense, useMemo } from "react"
import { Canvas, useLoader, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { FBXLoader } from "three/addons/loaders/FBXLoader.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js"
import { STLLoader } from "three/addons/loaders/STLLoader.js"
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js"
import type { AssetInspectionStats } from "./workflow-timeline"
import { isRenderablePreviewImage } from "./generated-assets"

function formatCompactCount(value?: number): string | null {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
        return null
    }

    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export function formatAssetFileSize(bytes?: number): string | null {
    if (typeof bytes !== "number" || Number.isNaN(bytes) || bytes <= 0) {
        return null
    }

    const units = ["B", "KB", "MB", "GB"]
    let value = bytes
    let index = 0
    while (value >= 1024 && index < units.length - 1) {
        value /= 1024
        index += 1
    }
    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

function StatPill({
    label,
    value,
}: {
    label: string
    value: string
}) {
    return (
        <span
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "hsl(var(--forge-surface-dim))",
                color: "hsl(var(--forge-text-muted))",
            }}
        >
            {label}: {value}
        </span>
    )
}

export function AssetStatsPills({
    stats,
    className,
}: {
    stats?: AssetInspectionStats | null
    className?: string
}) {
    if (!stats) return null

    const values = [
        { label: "Triangles", value: formatCompactCount(stats.triangleCount) },
        { label: "Materials", value: formatCompactCount(stats.materialCount) },
        { label: "Textures", value: formatCompactCount(stats.textureCount) },
        { label: "Size", value: formatAssetFileSize(stats.fileSizeBytes) },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value))

    if (values.length === 0) return null

    return (
        <div className={className ?? "flex flex-wrap gap-2"}>
            {values.map((item) => (
                <StatPill key={item.label} label={item.label} value={item.value} />
            ))}
        </div>
    )
}

function getPreviewInitials(stageLabel?: string, providerLabel?: string) {
    if (stageLabel) {
        return stageLabel.slice(0, 2).toUpperCase()
    }
    if (providerLabel) {
        return providerLabel.slice(0, 2).toUpperCase()
    }
    return "3D"
}

function getModelPreviewSource(modelUrl?: string | null): { url: string; extension: string } | null {
    if (!modelUrl) return null

    try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1"
        const url = new URL(modelUrl, baseUrl)
        const filename = url.searchParams.get("filename")
        const target = filename ?? url.pathname
        const extension = target.match(/\.(glb|gltf|fbx|obj|stl)$/i)?.[0]?.toLowerCase()
        return extension ? { url: url.toString(), extension } : null
    } catch {
        const extension = modelUrl.match(/\.(glb|gltf|fbx|obj|stl)(?:$|[?#])/i)?.[1]
        return extension ? { url: modelUrl, extension: `.${extension.toLowerCase()}` } : null
    }
}

function normalizePreviewObject(object: THREE.Object3D) {
    const source = SkeletonUtils.clone(object)
    source.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.castShadow = true
        mesh.receiveShadow = true
    })

    const box = new THREE.Box3().setFromObject(source)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    source.position.set(-center.x, -box.min.y, -center.z)

    const group = new THREE.Group()
    group.add(source)
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
    group.scale.setScalar(1.62 / maxDimension)
    group.rotation.set(0, 0.62, 0)
    return group
}

function NormalizedPreviewObject({ object }: { object: THREE.Object3D }) {
    const normalizedObject = useMemo(() => normalizePreviewObject(object), [object])
    return <primitive object={normalizedObject} />
}

function GltfPreviewObject({ url }: { url: string }) {
    const gltf = useLoader(GLTFLoader, url)
    return <NormalizedPreviewObject object={gltf.scene} />
}

function FbxPreviewObject({ url }: { url: string }) {
    const object = useLoader(FBXLoader, url)
    return <NormalizedPreviewObject object={object} />
}

function ObjPreviewObject({ url }: { url: string }) {
    const object = useLoader(OBJLoader, url)
    return <NormalizedPreviewObject object={object} />
}

function StlPreviewObject({ url }: { url: string }) {
    const geometry = useLoader(STLLoader, url)
    const object = useMemo(() => {
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: "#cbd5e1",
                roughness: 0.72,
                metalness: 0.02,
                side: THREE.DoubleSide,
            }),
        )
        return mesh
    }, [geometry])
    return <NormalizedPreviewObject object={object} />
}

function ModelPreviewObject({ source }: { source: { url: string; extension: string } }) {
    switch (source.extension) {
        case ".glb":
        case ".gltf":
            return <GltfPreviewObject url={source.url} />
        case ".fbx":
            return <FbxPreviewObject url={source.url} />
        case ".obj":
            return <ObjPreviewObject url={source.url} />
        case ".stl":
            return <StlPreviewObject url={source.url} />
        default:
            return null
    }
}

class ModelPreviewErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    override state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    override componentDidUpdate(previousProps: { children: React.ReactNode }) {
        if (previousProps.children !== this.props.children && this.state.hasError) {
            this.setState({ hasError: false })
        }
    }

    override render() {
        return this.state.hasError ? this.props.fallback : this.props.children
    }
}

function PreviewCameraController() {
    const { camera } = useThree()

    React.useEffect(() => {
        camera.lookAt(0, 0.68, 0)
        camera.updateProjectionMatrix()
    }, [camera])

    return null
}

function StaticModelPreviewTile({
    source,
    alt,
    className,
}: {
    source: { url: string; extension: string }
    alt: string
    className?: string
}) {
    return (
        <div
            className={className ?? "h-full w-full"}
            style={{
                background:
                    "radial-gradient(circle at 50% 38%, rgba(102,112,125,0.45), rgba(28,33,41,0.96) 58%, #11141a 100%)",
            }}
        >
            <Canvas
                frameloop="demand"
                dpr={[1, 1.5]}
                camera={{ position: [2.25, 1.45, 2.7], fov: 27 }}
                shadows
                gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0)
                    gl.outputColorSpace = THREE.SRGBColorSpace
                    gl.toneMapping = THREE.ACESFilmicToneMapping
                    gl.toneMappingExposure = 1.08
                }}
            >
                <PreviewCameraController />
                <ambientLight intensity={0.5} />
                <hemisphereLight args={["#f8fafc", "#202734", 1.05]} />
                <directionalLight
                    position={[3.5, 5.5, 4.5]}
                    intensity={1.55}
                    castShadow
                    shadow-mapSize-width={512}
                    shadow-mapSize-height={512}
                />
                <directionalLight position={[-3, 2.6, -4]} intensity={0.42} color="#dbeafe" />
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
                    <circleGeometry args={[1.18, 64]} />
                    <shadowMaterial opacity={0.34} transparent />
                </mesh>
                <Suspense fallback={null}>
                    <ModelPreviewObject source={source} />
                </Suspense>
            </Canvas>
            <span className="sr-only">{alt}</span>
        </div>
    )
}

function FallbackAssetPreviewTile({
    stageLabel,
    providerLabel,
    className,
}: {
    stageLabel?: string
    providerLabel?: string
    className?: string
}) {
    return (
        <div
            className={className ?? "flex h-full w-full flex-col justify-between p-3"}
            style={{
                background:
                    "radial-gradient(circle at top, rgba(45,212,191,0.28), rgba(15,23,42,0.94) 65%)",
            }}
        >
            <span
                className="inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
                {stageLabel ?? "Asset"}
            </span>
            <div className="flex flex-1 items-center justify-center">
                <span className="text-2xl font-semibold tracking-[0.12em] text-white/90">
                    {getPreviewInitials(stageLabel, providerLabel)}
                </span>
            </div>
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-white/65">
                {providerLabel ?? "Project asset"}
            </span>
        </div>
    )
}

export function AssetPreviewTile({
    imageUrl,
    modelUrl,
    alt,
    stageLabel,
    providerLabel,
    className,
}: {
    imageUrl?: string | null
    modelUrl?: string | null
    alt: string
    stageLabel?: string
    providerLabel?: string
    className?: string
}) {
    if (isRenderablePreviewImage(imageUrl)) {
        // Uploaded or remote previews are already browser-safe at this point.
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={imageUrl} alt={alt} className={className ?? "h-full w-full object-cover"} />
    }

    const modelPreviewSource = getModelPreviewSource(modelUrl)
    if (modelPreviewSource) {
        const fallback = (
            <FallbackAssetPreviewTile
                stageLabel={stageLabel}
                providerLabel={providerLabel}
                className={className}
            />
        )
        return (
            <ModelPreviewErrorBoundary fallback={fallback}>
                <StaticModelPreviewTile
                    source={modelPreviewSource}
                    alt={alt}
                    className={className}
                />
            </ModelPreviewErrorBoundary>
        )
    }

    return (
        <FallbackAssetPreviewTile
            stageLabel={stageLabel}
            providerLabel={providerLabel}
            className={className}
        />
    )
}

function StatsRow({
    label,
    value,
}: {
    label: string
    value?: string | null
}) {
    if (!value) return null

    return (
        <div
            className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-b-0"
            style={{ borderColor: "hsl(var(--forge-border))" }}
        >
            <span style={{ color: "hsl(var(--forge-text-muted))" }}>{label}</span>
            <span className="font-medium text-right" style={{ color: "hsl(var(--forge-text))" }}>
                {value}
            </span>
        </div>
    )
}

export function AssetStatsPanel({
    stats,
}: {
    stats?: AssetInspectionStats | null
}) {
    if (!stats) {
        return (
            <div
                className="rounded-2xl border p-4 text-sm"
                style={{
                    borderColor: "hsl(var(--forge-border))",
                    backgroundColor: "rgba(255,255,255,0.82)",
                    color: "hsl(var(--forge-text-muted))",
                }}
            >
                Metadata will appear here once this asset has been inspected.
            </div>
        )
    }

    return (
        <div
            className="rounded-[24px] border p-4 shadow-xl backdrop-blur"
            style={{
                borderColor: "hsl(var(--forge-border))",
                backgroundColor: "rgba(255,255,255,0.88)",
            }}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--forge-text-subtle))" }}>
                Asset stats
            </p>
            <div className="mt-3">
                <StatsRow label="Stage" value={stats.stageLabel} />
                <StatsRow label="Source tool" value={stats.sourceToolLabel} />
                <StatsRow label="Provider" value={stats.sourceProvider} />
                <StatsRow label="Triangles" value={formatCompactCount(stats.triangleCount)} />
                <StatsRow label="Materials" value={formatCompactCount(stats.materialCount)} />
                <StatsRow label="Textures" value={formatCompactCount(stats.textureCount)} />
                <StatsRow label="Meshes" value={formatCompactCount(stats.meshCount)} />
                <StatsRow label="File size" value={formatAssetFileSize(stats.fileSizeBytes)} />
            </div>
        </div>
    )
}
