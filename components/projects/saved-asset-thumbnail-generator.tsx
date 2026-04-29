"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

import {
    getModelPreviewSource,
    ModelPreviewObject,
    PreviewCameraController,
} from "./asset-inspection"
import type { GeneratedAssetItem } from "./generated-assets"

const THUMBNAIL_SIZE = 320

function getSavedAssetId(asset: GeneratedAssetItem): string | null {
    return asset.id.startsWith("saved:") ? asset.id.slice("saved:".length) : null
}

function CaptureAfterFrames({
    onCapture,
    onError,
}: {
    onCapture: (imageDataUrl: string) => void
    onError: (error: unknown) => void
}) {
    const { gl, invalidate } = useThree()
    const frameCountRef = useRef(0)
    const capturedRef = useRef(false)

    useEffect(() => {
        invalidate()
    }, [invalidate])

    useFrame(() => {
        if (capturedRef.current) return
        frameCountRef.current += 1
        if (frameCountRef.current < 4) return

        capturedRef.current = true
        window.requestAnimationFrame(() => {
            try {
                onCapture(gl.domElement.toDataURL("image/png"))
            } catch (error) {
                onError(error)
            }
        })
    })

    return null
}

class ThumbnailErrorBoundary extends React.Component<
    { children: React.ReactNode; onError: (error: unknown) => void },
    { hasError: boolean }
> {
    override state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    override componentDidCatch(error: unknown) {
        this.props.onError(error)
    }

    override render() {
        return this.state.hasError ? null : this.props.children
    }
}

function ThumbnailBackground() {
    const texture = useMemo(() => {
        const canvas = document.createElement("canvas")
        canvas.width = THUMBNAIL_SIZE
        canvas.height = THUMBNAIL_SIZE
        const context = canvas.getContext("2d")
        if (!context) return null

        const gradient = context.createRadialGradient(
            THUMBNAIL_SIZE * 0.52,
            THUMBNAIL_SIZE * 0.42,
            THUMBNAIL_SIZE * 0.05,
            THUMBNAIL_SIZE * 0.52,
            THUMBNAIL_SIZE * 0.42,
            THUMBNAIL_SIZE * 0.72,
        )
        gradient.addColorStop(0, "#7f8998")
        gradient.addColorStop(0.42, "#343d4a")
        gradient.addColorStop(0.78, "#151b24")
        gradient.addColorStop(1, "#10141a")
        context.fillStyle = gradient
        context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)

        const nextTexture = new THREE.CanvasTexture(canvas)
        nextTexture.colorSpace = THREE.SRGBColorSpace
        return nextTexture
    }, [])

    useEffect(() => {
        return () => {
            texture?.dispose()
        }
    }, [texture])

    return texture ? <primitive attach="background" object={texture} /> : null
}

function ThumbnailScene({
    source,
    onCapture,
    onError,
}: {
    source: { url: string; extension: string }
    onCapture: (imageDataUrl: string) => void
    onError: (error: unknown) => void
}) {
    return (
        <>
            <ThumbnailBackground />
            <PreviewCameraController />
            <ambientLight intensity={1.05} />
            <hemisphereLight args={["#ffffff", "#374151", 1.65]} />
            <directionalLight
                position={[-4.4, 5.8, 4.8]}
                intensity={2.15}
                castShadow
                shadow-mapSize-width={512}
                shadow-mapSize-height={512}
            />
            <directionalLight position={[3.4, 2.8, -4.2]} intensity={0.68} color="#dbeafe" />
            <directionalLight position={[0, 3.8, 4.5]} intensity={0.5} color="#ffffff" />
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.014, 0]}>
                <circleGeometry args={[1.18, 64]} />
                <shadowMaterial opacity={0.24} transparent />
            </mesh>
            <Suspense fallback={null}>
                <ModelPreviewObject source={source} />
                <CaptureAfterFrames onCapture={onCapture} onError={onError} />
            </Suspense>
        </>
    )
}

export function SavedAssetThumbnailGenerator({
    assets,
    onThumbnailSaved,
}: {
    assets: GeneratedAssetItem[]
    onThumbnailSaved: (asset: GeneratedAssetItem) => void
}) {
    const attemptedAssetIdsRef = useRef(new Set<string>())
    const [activeAsset, setActiveAsset] = useState<GeneratedAssetItem | null>(null)

    const pendingAssets = useMemo(() => {
        return assets.filter((asset) => {
            if (!getSavedAssetId(asset)) return false
            if (asset.previewImageUrl) return false
            return Boolean(getModelPreviewSource(asset.viewerUrl, asset.viewerLabel ?? asset.title))
        })
    }, [assets])

    useEffect(() => {
        if (activeAsset) return
        const nextAsset = pendingAssets.find((asset) => !attemptedAssetIdsRef.current.has(asset.id))
        if (!nextAsset) return

        attemptedAssetIdsRef.current.add(nextAsset.id)
        setActiveAsset(nextAsset)
    }, [activeAsset, pendingAssets])

    const handleComplete = useCallback(() => {
        setActiveAsset(null)
    }, [])

    const handleCapture = useCallback(async (imageDataUrl: string) => {
        if (!activeAsset) return
        const savedAssetId = getSavedAssetId(activeAsset)
        if (!savedAssetId) {
            handleComplete()
            return
        }

        try {
            const response = await fetch(`/api/projects/assets/${savedAssetId}/thumbnail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageDataUrl }),
            })
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload?.asset) {
                throw new Error(payload?.error ?? `Thumbnail save failed with HTTP ${response.status}`)
            }
            onThumbnailSaved(payload.asset as GeneratedAssetItem)
        } catch (error) {
            console.warn("[SavedAssetThumbnailGenerator] Failed to save asset thumbnail", {
                assetId: activeAsset.id,
                error,
            })
        } finally {
            handleComplete()
        }
    }, [activeAsset, handleComplete, onThumbnailSaved])

    const handleRenderError = useCallback((error: unknown) => {
        if (activeAsset) {
            console.warn("[SavedAssetThumbnailGenerator] Failed to render asset thumbnail", {
                assetId: activeAsset.id,
                error,
            })
        }
        handleComplete()
    }, [activeAsset, handleComplete])

    const source = activeAsset
        ? getModelPreviewSource(activeAsset.viewerUrl, activeAsset.viewerLabel ?? activeAsset.title)
        : null

    if (!activeAsset || !source) return null

    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                left: -10000,
                top: -10000,
                width: THUMBNAIL_SIZE,
                height: THUMBNAIL_SIZE,
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <ThumbnailErrorBoundary onError={handleRenderError}>
                <Canvas
                    frameloop="always"
                    dpr={1.5}
                    orthographic
                    camera={{ position: [2.35, 1.42, 2.75], zoom: 72, near: 0.1, far: 100 }}
                    shadows
                    gl={{
                        antialias: true,
                        alpha: false,
                        preserveDrawingBuffer: true,
                        powerPreference: "low-power",
                    }}
                    style={{
                        width: THUMBNAIL_SIZE,
                        height: THUMBNAIL_SIZE,
                        background:
                            "radial-gradient(circle at 52% 42%, rgba(118,128,142,0.74), rgba(45,53,64,0.95) 43%, rgba(20,25,33,1) 78%, #10141a 100%)",
                    }}
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x10141a, 1)
                        gl.outputColorSpace = THREE.SRGBColorSpace
                        gl.toneMapping = THREE.ACESFilmicToneMapping
                        gl.toneMappingExposure = 1.28
                    }}
                >
                    <ThumbnailScene
                        source={source}
                        onCapture={handleCapture}
                        onError={handleRenderError}
                    />
                </Canvas>
            </ThumbnailErrorBoundary>
        </div>
    )
}
