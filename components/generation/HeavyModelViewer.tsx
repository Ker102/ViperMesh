"use client";

import { Bounds, ContactShadows, OrbitControls, useBounds } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Download, FolderOpen, Loader2, Maximize2, RotateCcw } from "lucide-react";
import React, { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
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

const clearColorByMode: Record<HeavyInspectionMode, string> = {
    material: "#5b6470",
    geometry: "#363d47",
    clay: "#2c333d",
    toon: "#424955",
    wireframe: "#1a2029",
};

const frameBackgroundByMode: Record<HeavyInspectionMode, string> = {
    material: "radial-gradient(circle at top, rgba(191, 219, 254, 0.32), rgba(26, 32, 44, 0.92) 62%)",
    geometry: "radial-gradient(circle at top, rgba(186, 230, 253, 0.18), rgba(39, 46, 58, 0.98) 64%)",
    clay: "radial-gradient(circle at top, rgba(226, 232, 240, 0.2), rgba(31, 41, 55, 0.96) 64%)",
    toon: "radial-gradient(circle at top, rgba(196, 181, 253, 0.24), rgba(31, 41, 55, 0.95) 64%)",
    wireframe: "radial-gradient(circle at top, rgba(125, 211, 252, 0.14), rgba(17, 24, 39, 0.98) 64%)",
};

const toneMappingExposureByMode: Record<HeavyInspectionMode, number> = {
    material: 1.34,
    geometry: 1.05,
    clay: 1.1,
    toon: 1.18,
    wireframe: 1,
};

let toonGradientTexture: THREE.DataTexture | null = null;

function getToonGradientTexture() {
    if (toonGradientTexture) {
        return toonGradientTexture;
    }

    const colors = new Uint8Array([
        68, 76, 92,
        126, 140, 166,
        196, 210, 236,
        250, 250, 255,
    ]);
    const texture = new THREE.DataTexture(colors, 4, 1, THREE.RGBFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    toonGradientTexture = texture;
    return texture;
}

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

function getDownloadUrl(safeUrl: string) {
    try {
        const parsed = new URL(
            safeUrl,
            typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1",
        );
        if (parsed.pathname === "/api/ai/neural-output") {
            parsed.searchParams.set("download", "1");
        }
        return parsed.toString();
    } catch {
        return safeUrl;
    }
}

function getNeuralOutputRelativePath(safeUrl: string) {
    try {
        const parsed = new URL(
            safeUrl,
            typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1",
        );
        if (parsed.pathname !== "/api/ai/neural-output") {
            return null;
        }

        const relativePath = parsed.searchParams.get("path");
        return relativePath ? decodeURIComponent(relativePath) : null;
    } catch {
        return null;
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

function copyCommonMaterialProps(
    target: THREE.Material,
    original: THREE.Material,
    flatShading: boolean,
) {
    const source = original as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture | null;
        normalMap?: THREE.Texture | null;
        emissive?: THREE.Color;
        emissiveMap?: THREE.Texture | null;
        emissiveIntensity?: number;
        transparent?: boolean;
        opacity?: number;
        alphaTest?: number;
        side?: THREE.Side;
    };
    const dest = target as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture | null;
        normalMap?: THREE.Texture | null;
        emissive?: THREE.Color;
        emissiveMap?: THREE.Texture | null;
        emissiveIntensity?: number;
        transparent?: boolean;
        opacity?: number;
        alphaTest?: number;
        side?: THREE.Side;
        flatShading?: boolean;
    };

    if (dest.color && source.color) {
        dest.color.copy(source.color);
    }
    if ("map" in dest) {
        dest.map = source.map ?? null;
    }
    if ("normalMap" in dest) {
        dest.normalMap = source.normalMap ?? null;
    }
    if (dest.emissive && source.emissive) {
        dest.emissive.copy(source.emissive);
    }
    if ("emissiveMap" in dest) {
        dest.emissiveMap = source.emissiveMap ?? null;
    }
    if ("emissiveIntensity" in dest && typeof source.emissiveIntensity === "number") {
        dest.emissiveIntensity = source.emissiveIntensity;
    }
    if (typeof source.transparent === "boolean") {
        dest.transparent = source.transparent;
    }
    if (typeof source.opacity === "number") {
        dest.opacity = source.opacity;
    }
    if (typeof source.alphaTest === "number") {
        dest.alphaTest = source.alphaTest;
    }
    if (typeof source.side !== "undefined") {
        dest.side = source.side;
    } else {
        dest.side = THREE.DoubleSide;
    }
    if ("flatShading" in dest) {
        dest.flatShading = flatShading;
    }
    dest.needsUpdate = true;
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
        const material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            vertexShader: `
                varying vec3 vNormalView;

                void main() {
                    vNormalView = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormalView;

                void main() {
                    vec3 n = normalize(vNormalView);
                    vec3 encoded = n * 0.5 + 0.5;
                    vec3 cyan = vec3(0.42, 0.95, 1.0);
                    vec3 magenta = vec3(0.99, 0.46, 0.97);
                    vec3 blue = vec3(0.66, 0.78, 1.0);
                    vec3 color = mix(cyan, magenta, encoded.x);
                    color = mix(color, blue, clamp(encoded.z * 0.82, 0.0, 1.0));
                    color += vec3(0.05, 0.03, 0.08) * encoded.y;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });
        (material as THREE.ShaderMaterial & { flatShading?: boolean }).flatShading = flatShading;
        material.needsUpdate = true;
        return material;
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
            side: THREE.DoubleSide,
            gradientMap: getToonGradientTexture(),
        }) as THREE.MeshToonMaterial & { flatShading?: boolean };
        const source = original as THREE.Material & {
            color?: THREE.Color;
            map?: THREE.Texture | null;
            emissive?: THREE.Color;
            emissiveMap?: THREE.Texture | null;
            transparent?: boolean;
            opacity?: number;
            alphaTest?: number;
            side?: THREE.Side;
        };

        material.flatShading = flatShading;
        material.side = source.side ?? THREE.DoubleSide;
        material.transparent = source.transparent ?? false;
        material.opacity = typeof source.opacity === "number" ? source.opacity : 1;
        material.alphaTest = typeof source.alphaTest === "number" ? source.alphaTest : 0;
        material.map = source.map ?? null;
        material.color.copy(source.color ?? new THREE.Color("#ffffff"));
        if (material.map) {
            material.color.set("#ffffff");
        }
        material.emissive.copy(source.emissive ?? new THREE.Color("#111827"));
        material.emissiveIntensity = source.map ? 0.2 : 0.08;
        material.emissiveMap = source.emissiveMap ?? null;
        material.needsUpdate = true;
        return material;
    }

    return new THREE.MeshBasicMaterial({
        color: tint,
        wireframe: true,
        side: THREE.DoubleSide,
    });
}

function SceneEnvironmentController({
    inspectionMode,
}: {
    inspectionMode: HeavyInspectionMode;
}) {
    const { gl, scene } = useThree();
    const envTextureRef = useRef<THREE.Texture | null>(null);

    useEffect(() => {
        const environment = new RoomEnvironment();
        const pmremGenerator = new THREE.PMREMGenerator(gl);
        const envMap = pmremGenerator.fromScene(environment, 0.04).texture;
        environment.dispose();
        pmremGenerator.dispose();
        envTextureRef.current = envMap;

        return () => {
            envMap.dispose();
            envTextureRef.current = null;
        };
    }, [gl]);

    useEffect(() => {
        // Three renderer exposure is runtime state, not React props.
        // eslint-disable-next-line react-hooks/immutability
        gl.toneMappingExposure = toneMappingExposureByMode[inspectionMode];
        gl.setClearColor(clearColorByMode[inspectionMode], 1);

        // Three scene environment is renderer-owned runtime state.
        /* eslint-disable react-hooks/immutability */
        if (inspectionMode === "material") {
            scene.environment = envTextureRef.current;
            scene.environmentIntensity = 2;
        } else if (inspectionMode === "toon") {
            scene.environment = envTextureRef.current;
            scene.environmentIntensity = 0.85;
        } else {
            scene.environment = null;
            scene.environmentIntensity = 1;
        }

        return () => {
            scene.environment = null;
            scene.environmentIntensity = 1;
            gl.toneMappingExposure = 1;
        };
        /* eslint-enable react-hooks/immutability */
    }, [gl, inspectionMode, scene]);

    return null;
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

function HeavyModelViewerInner({
    safeUrl,
    className,
    showControls = true,
    showFooter = true,
    interactive = true,
    inspectionMode = "material",
    inspectionTint = "neutral",
    shadingMode = "smooth",
}: Omit<HeavyModelViewerProps, "url"> & { safeUrl: string }) {
    const frameRef = useRef<HTMLDivElement | null>(null);
    const viewerApiRef = useRef<ViewerApi | null>(null);
    const controlsRef = useRef<{ reset?: () => void; saveState?: () => void } | null>(null);
    const descriptionId = useId();
    const [status, setStatus] = useState<ViewerStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isRevealPending, setIsRevealPending] = useState(false);
    const desktopRevealAvailable =
        typeof window !== "undefined" &&
        typeof window.vipermesh?.revealItemInFolder === "function";
    const localRelativePath = useMemo(() => getNeuralOutputRelativePath(safeUrl), [safeUrl]);

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
            const downloadUrl = getDownloadUrl(safeUrl);
            const response = await fetch(downloadUrl, { credentials: "include" });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = getDownloadFilename(safeUrl);
            anchor.rel = "noopener noreferrer";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (downloadError) {
            console.warn("HeavyModelViewer: falling back to direct download", downloadError);
            window.open(getDownloadUrl(safeUrl), "_blank", "noopener,noreferrer");
        }
    };

    const handleRevealFile = async () => {
        if (!desktopRevealAvailable || !localRelativePath) return;

        setIsRevealPending(true);
        try {
            const response = await fetch(
                `/api/ai/neural-output/path?path=${encodeURIComponent(localRelativePath)}`,
                { credentials: "include" },
            );

            if (!response.ok) {
                throw new Error(`Failed to resolve local file (${response.status})`);
            }

            const payload = (await response.json()) as { localPath?: string; error?: string };
            if (!payload.localPath) {
                throw new Error(payload.error ?? "Resolved file path is missing");
            }

            const revealResult = await window.vipermesh!.revealItemInFolder(payload.localPath);
            if (!revealResult.success) {
                throw new Error(revealResult.error ?? "Desktop shell refused the file reveal request");
            }
        } catch (revealError) {
            const message =
                revealError instanceof Error
                    ? revealError.message
                    : "Failed to reveal the model file";
            console.warn("HeavyModelViewer: failed to reveal model file", revealError);
            setErrorMessage(message);
        } finally {
            setIsRevealPending(false);
        }
    };

    return (
        <div
            ref={frameRef}
            className={cn(
                "relative h-96 w-full overflow-hidden rounded-lg border border-white/10",
                className,
            )}
            style={{ background: frameBackgroundByMode[inspectionMode] }}
            role="img"
            aria-label="Interactive advanced 3D model viewer. Drag to orbit the camera, scroll to zoom, and right-click drag to pan."
        >
            <div id={descriptionId} className="sr-only">
                A Three.js-based 3D model viewer for advanced inspection, including shader and geometry previews.
            </div>

            <Canvas
                shadows
                camera={{ position: [0, 1.4, 4.8], fov: 32 }}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                }}
                className="h-full w-full"
            >
                <color attach="background" args={[clearColorByMode[inspectionMode]]} />
                <SceneEnvironmentController inspectionMode={inspectionMode} />
                <ambientLight intensity={inspectionMode === "material" ? 0.88 : inspectionMode === "toon" ? 0.76 : 0.68} />
                <hemisphereLight
                    args={["#f8fafc", "#1e293b", inspectionMode === "material" ? 1.95 : inspectionMode === "toon" ? 1.6 : 1.2]}
                />
                <directionalLight position={[6, 8, 5]} intensity={inspectionMode === "material" ? 4.4 : inspectionMode === "toon" ? 3.2 : 2.25} castShadow />
                <directionalLight position={[-5, 3, -6]} intensity={inspectionMode === "material" ? 2.45 : inspectionMode === "toon" ? 1.65 : 1.05} />
                <directionalLight position={[0, 5, -8]} intensity={inspectionMode === "material" ? 1.25 : inspectionMode === "toon" ? 1.05 : 0.55} color="#dbeafe" />
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
                            opacity={inspectionMode === "material" ? 0.28 : inspectionMode === "toon" ? 0.18 : 0.08}
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
                    {desktopRevealAvailable && localRelativePath ? (
                        <button
                            type="button"
                            onClick={handleRevealFile}
                            disabled={isRevealPending}
                            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"
                        >
                            {isRevealPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
                            Reveal File
                        </button>
                    ) : null}
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

export function HeavyModelViewer({
    url,
    ...props
}: HeavyModelViewerProps) {
    const safeUrl = useMemo(() => getSafeModelUrl(url), [url]);

    if (!url) return null;

    if (!safeUrl) {
        return (
            <div className={cn("h-96 w-full", props.className)}>
                <ErrorState message="Invalid or unsafe model URL" />
            </div>
        );
    }

    return <HeavyModelViewerInner key={safeUrl} safeUrl={safeUrl} {...props} />;
}
