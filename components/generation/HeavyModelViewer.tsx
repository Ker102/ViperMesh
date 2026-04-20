"use client";

import { Bounds, ContactShadows, OrbitControls, useBounds } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Download, Loader2, Maximize2, RotateCcw } from "lucide-react";
import React, { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { cn } from "@/lib/utils";

export type HeavyInspectionMode = "material" | "geometry" | "clay" | "toon" | "wireframe";
export type HeavyShadingMode = "smooth" | "flat";

interface HeavyModelViewerProps {
    url: string;
    className?: string;
    showControls?: boolean;
    showFooter?: boolean;
    interactive?: boolean;
    inspectionMode?: HeavyInspectionMode;
    inspectionTint?: "neutral" | "violet" | "cyan";
    shadingMode?: HeavyShadingMode;
}

type ViewerStatus = "loading" | "ready" | "error";

type ViewerApi = {
    fit: () => void;
    reset: () => void;
};

type ErrorBoundaryProps = {
    onError: (error: Error) => void;
    children: React.ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
};

const tintPaletteHex: Record<NonNullable<HeavyModelViewerProps["inspectionTint"]>, string> = {
    neutral: "#d4d4d8",
    violet: "#e9d5ff",
    cyan: "#c4f1f9",
};

class ViewerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        this.props.onError(error);
    }

    override componentDidUpdate(prevProps: ErrorBoundaryProps) {
        if (prevProps.children !== this.props.children && this.state.hasError) {
            this.setState({ hasError: false });
        }
    }

    override render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

function getSafeModelUrl(urlString: string): string | null {
    try {
        const baseUrl =
            typeof window !== "undefined"
                ? window.location.origin
                : "http://127.0.0.1";
        const url = new URL(urlString, baseUrl);
        const blockedProtocols = ["data:", "blob:", "javascript:", "vbscript:", "file:"];

        if (blockedProtocols.includes(url.protocol)) {
            console.warn("HeavyModelViewer: Blocked unsafe protocol:", url.protocol);
            return null;
        }

        if (url.protocol === "https:") {
            return url.toString();
        }

        if (
            url.protocol === "http:" &&
            (url.hostname === "localhost" || url.hostname === "127.0.0.1")
        ) {
            return url.toString();
        }

        console.warn("HeavyModelViewer: URL must use HTTPS or local HTTP:", urlString);
        return null;
    } catch {
        console.warn("HeavyModelViewer: Invalid URL:", urlString);
        return null;
    }
}

function LoadingState({ message }: { message: string }) {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm"
            role="status"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="flex flex-col items-center gap-2 text-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
                <span className="text-sm">{message}</span>
            </div>
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div
            className="flex h-full items-center justify-center rounded-lg border border-red-500/30 bg-red-950/20 px-6 text-center"
            role="alert"
        >
            <p className="max-w-sm text-sm text-red-200">{message}</p>
        </div>
    );
}

function getDownloadFilename(safeUrl: string) {
    try {
        const parsed = new URL(safeUrl, typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1");
        const queryPath = parsed.searchParams.get("path");
        const candidate = queryPath
            ? decodeURIComponent(queryPath).split(/[\\/]/).filter(Boolean).at(-1)
            : parsed.pathname.split("/").filter(Boolean).at(-1);

        if (!candidate) {
            return "model.glb";
        }

        return candidate.toLowerCase().endsWith(".glb") ? candidate : `${candidate}.glb`;
    } catch {
        return "model.glb";
    }
}

function disposeGeneratedMaterials(object: THREE.Object3D) {
    object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const generatedMaterials = mesh.userData.__generatedMaterials as THREE.Material[] | undefined;
        generatedMaterials?.forEach((material) => material.dispose());
        delete mesh.userData.__generatedMaterials;
    });
}

function buildReplacementMaterial(
    original: THREE.Material,
    mode: HeavyInspectionMode,
    tint: string,
    shadingMode: HeavyShadingMode,
): THREE.Material {
    const flatShading = shadingMode === "flat";

    if (mode === "material") {
        const cloned = original.clone();
        if ("flatShading" in cloned) {
            (cloned as THREE.Material & { flatShading?: boolean }).flatShading = flatShading;
            cloned.needsUpdate = true;
        }
        if ("wireframe" in cloned) {
            (cloned as THREE.Material & { wireframe?: boolean }).wireframe = false;
        }
        if ("side" in cloned) {
            (cloned as THREE.Material & { side?: THREE.Side }).side = THREE.DoubleSide;
        }
        return cloned;
    }

    if (mode === "geometry") {
        return new THREE.MeshNormalMaterial({
            flatShading,
            side: THREE.DoubleSide,
        });
    }

    if (mode === "clay") {
        return new THREE.MeshStandardMaterial({
            color: tint,
            metalness: 0,
            roughness: 1,
            flatShading,
            side: THREE.DoubleSide,
        });
    }

    if (mode === "toon") {
        const material = new THREE.MeshToonMaterial({
            color: tint,
            side: THREE.DoubleSide,
        }) as THREE.MeshToonMaterial & { flatShading?: boolean };
        material.flatShading = flatShading;
        material.needsUpdate = true;
        return material;
    }

    return new THREE.MeshBasicMaterial({
        color: tint,
        wireframe: true,
        side: THREE.DoubleSide,
    });
}

function applyInspectionMaterials(
    root: THREE.Object3D,
    mode: HeavyInspectionMode,
    tint: string,
    shadingMode: HeavyShadingMode,
) {
    root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const originalMaterials =
            (mesh.userData.__originalMaterials as THREE.Material[] | undefined) ??
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);
        mesh.userData.__originalMaterials = originalMaterials;

        const generatedMaterials = mesh.userData.__generatedMaterials as THREE.Material[] | undefined;
        generatedMaterials?.forEach((material) => material.dispose());

        if (mode === "material" && shadingMode === "smooth") {
            mesh.material = Array.isArray(mesh.material) || originalMaterials.length > 1
                ? originalMaterials
                : originalMaterials[0];
            delete mesh.userData.__generatedMaterials;
            return;
        }

        const replacements = originalMaterials.map((material) =>
            buildReplacementMaterial(material, mode, tint, shadingMode)
        );
        mesh.userData.__generatedMaterials = replacements;
        mesh.material = Array.isArray(mesh.material) || replacements.length > 1 ? replacements : replacements[0];
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    });
}

function SceneController({
    controlsRef,
    onRegisterApi,
}: {
    controlsRef: React.MutableRefObject<{ reset?: () => void; saveState?: () => void } | null>;
    onRegisterApi: (api: ViewerApi) => void;
}) {
    const bounds = useBounds();

    useEffect(() => {
        const fit = () => {
            bounds.refresh().clip().fit();
        };
        const reset = () => {
            controlsRef.current?.reset?.();
            fit();
        };

        fit();
        window.requestAnimationFrame(() => {
            controlsRef.current?.saveState?.();
        });
        onRegisterApi({ fit, reset });
    }, [bounds, controlsRef, onRegisterApi]);

    return null;
}

function LoadedAsset({
    url,
    inspectionMode,
    inspectionTint,
    shadingMode,
    onReady,
}: {
    url: string;
    inspectionMode: HeavyInspectionMode;
    inspectionTint: NonNullable<HeavyModelViewerProps["inspectionTint"]>;
    shadingMode: HeavyShadingMode;
    onReady: () => void;
}) {
    const gltf = useLoader(GLTFLoader, url);
    const scene = useMemo(
        () => SkeletonUtils.clone(gltf.scene) as THREE.Group,
        [gltf.scene],
    );

    useEffect(() => {
        applyInspectionMaterials(scene, inspectionMode, tintPaletteHex[inspectionTint], shadingMode);
        onReady();

        return () => {
            disposeGeneratedMaterials(scene);
        };
    }, [inspectionMode, inspectionTint, onReady, scene, shadingMode]);

    return <primitive object={scene} />;
}

export function HeavyModelViewer({
    url,
    className,
    showControls = true,
    showFooter = true,
    interactive = true,
    inspectionMode = "material",
    inspectionTint = "neutral",
    shadingMode = "smooth",
}: HeavyModelViewerProps) {
    const frameRef = useRef<HTMLDivElement | null>(null);
    const viewerApiRef = useRef<ViewerApi | null>(null);
    const controlsRef = useRef<{ reset?: () => void; saveState?: () => void } | null>(null);
    const descriptionId = useId();
    const safeUrl = useMemo(() => getSafeModelUrl(url), [url]);
    const [status, setStatus] = useState<ViewerStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setStatus("loading");
        setErrorMessage(null);
    }, [safeUrl]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === frameRef.current);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const handleFitView = () => {
        viewerApiRef.current?.fit();
    };

    const handleResetView = () => {
        viewerApiRef.current?.reset();
    };

    const handleToggleFullscreen = async () => {
        if (!frameRef.current) return;

        if (document.fullscreenElement === frameRef.current) {
            await document.exitFullscreen();
            return;
        }

        await frameRef.current.requestFullscreen();
    };

    const handleDownload = async () => {
        if (!safeUrl) return;

        try {
            const response = await fetch(safeUrl, { credentials: "include" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = getDownloadFilename(safeUrl);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (downloadError) {
            console.warn("HeavyModelViewer: falling back to direct download", downloadError);
            window.open(safeUrl, "_blank", "noopener,noreferrer");
        }
    };

    if (!url) return null;

    if (!safeUrl) {
        return (
            <div className={cn("h-96 w-full", className)}>
                <ErrorState message="Invalid or unsafe model URL" />
            </div>
        );
    }

    return (
        <div
            ref={frameRef}
            className={cn(
                "relative h-96 w-full overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_rgba(15,23,42,0.95)_58%)]",
                className,
            )}
            role="img"
            aria-label="Interactive advanced 3D model viewer. Drag to orbit the camera, scroll to zoom, and right-click drag to pan."
        >
            <div id={descriptionId} className="sr-only">
                A Three.js-based 3D model viewer for advanced inspection, including shader and geometry previews.
            </div>

            <Canvas
                shadows
                camera={{ position: [0, 1.4, 4.8], fov: 32 }}
                gl={{ antialias: true, alpha: true }}
                className="h-full w-full"
            >
                <color attach="background" args={["#000000"]} />
                <ambientLight intensity={1.2} />
                <directionalLight position={[6, 8, 5]} intensity={2.6} castShadow />
                <directionalLight position={[-5, 3, -6]} intensity={1.1} />
                <Suspense fallback={null}>
                    <ViewerErrorBoundary
                        onError={(error) => {
                            console.error("HeavyModelViewer: model load failure", error);
                            setStatus("error");
                            setErrorMessage(`Failed to load 3D model (${error.message})`);
                        }}
                    >
                        <OrbitControls
                            ref={controlsRef as React.Ref<any>}
                            makeDefault
                            enableDamping
                            dampingFactor={0.08}
                            enabled={interactive}
                        />
                        <Bounds fit clip observe margin={1.18}>
                            <SceneController
                                controlsRef={controlsRef}
                                onRegisterApi={(api) => {
                                    viewerApiRef.current = api;
                                }}
                            />
                            <LoadedAsset
                                url={safeUrl}
                                inspectionMode={inspectionMode}
                                inspectionTint={inspectionTint}
                                shadingMode={shadingMode}
                                onReady={() => {
                                    setStatus("ready");
                                    setErrorMessage(null);
                                }}
                            />
                        </Bounds>
                        <ContactShadows
                            position={[0, -1.6, 0]}
                            opacity={0.45}
                            scale={18}
                            blur={2.6}
                            far={6}
                            resolution={512}
                            color="#000000"
                            frames={1}
                        />
                    </ViewerErrorBoundary>
                </Suspense>
            </Canvas>

            {status === "loading" && <LoadingState message="Loading advanced viewer..." />}
            {status === "error" && (
                <div className="absolute inset-0 p-4">
                    <ErrorState message={errorMessage ?? "Failed to load 3D model"} />
                </div>
            )}

            {showControls && (
                <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleFitView}
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900"
                    >
                        Fit
                    </button>
                    <button
                        type="button"
                        onClick={handleResetView}
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900"
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                    </button>
                </div>
            )}

            {showFooter && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent px-4 pb-4 pt-10">
                    <div className="text-xs text-slate-200/75">
                        Drag to orbit • Scroll to zoom • Right-click drag to pan
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-900/45 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-200/70">
                        Advanced preview
                    </div>
                </div>
            )}
        </div>
    );
}
