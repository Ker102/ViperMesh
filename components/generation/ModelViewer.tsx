"use client";

import type { ModelViewerElement } from "@google/model-viewer";
import { Download, Loader2, Maximize2, RotateCcw } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
    url: string;
    className?: string;
    showControls?: boolean;
    showFooter?: boolean;
    interactive?: boolean;
    inspectionMode?: "material" | "geometry" | "clay";
    inspectionTint?: "neutral" | "violet" | "cyan";
}

type ViewerStatus = "booting" | "loading" | "ready" | "error";

type MaterialSnapshot = {
    material: any;
    baseColorFactor: number[];
    metallicFactor: number;
    roughnessFactor: number;
    baseColorTexture: any;
    metallicRoughnessTexture: any;
    normalTexture: any;
    occlusionTexture: any;
    emissiveTexture: any;
    emissiveFactor: number[];
};

let modelViewerRegistration: Promise<void> | null = null;

function ensureModelViewerRegistered(): Promise<void> {
    if (!modelViewerRegistration) {
        modelViewerRegistration = import("@google/model-viewer").then(() => undefined);
    }

    return modelViewerRegistration;
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
            console.warn("ModelViewer: Blocked unsafe protocol:", url.protocol);
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

        console.warn("ModelViewer: URL must use HTTPS or local HTTP:", urlString);
        return null;
    } catch {
        console.warn("ModelViewer: Invalid URL:", urlString);
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

export function ModelViewer({
    url,
    className,
    showControls = true,
    showFooter = true,
    interactive = true,
    inspectionMode = "material",
    inspectionTint = "neutral",
}: ModelViewerProps) {
    const viewerRef = useRef<ModelViewerElement | null>(null);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const materialSnapshotRef = useRef<MaterialSnapshot[] | null>(null);
    const descriptionId = useId();
    const [isRegistered, setIsRegistered] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return customElements.get("model-viewer") != null;
    });
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<{ url: string; message: string } | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const safeUrl = useMemo(() => getSafeModelUrl(url), [url]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === frameRef.current);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        if (!safeUrl || isRegistered) return;

        ensureModelViewerRegistered()
            .then(() => {
                if (cancelled) return;
                setIsRegistered(true);
            })
            .catch((error: unknown) => {
                if (cancelled) return;

                console.error("ModelViewer: Failed to register model-viewer", error);
                setErrorState({
                    url: safeUrl,
                    message: "Failed to initialize the 3D viewer",
                });
            });

        return () => {
            cancelled = true;
        };
    }, [isRegistered, safeUrl]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !safeUrl) return;

        const handleLoad = () => {
            (viewer as ModelViewerElement & { updateFraming?: () => void }).updateFraming?.();
            viewer.jumpCameraToGoal();
            setLoadedUrl(safeUrl);
            setErrorState(null);
        };

        const handleError = (event: Event) => {
            const detail = (event as CustomEvent<{ type?: string; sourceError?: unknown }>).detail;
            const sourceError = detail?.sourceError;
            const reason =
                sourceError instanceof Error
                    ? sourceError.message
                    : typeof detail?.type === "string"
                      ? detail.type
                      : "unknown error";

            console.error("ModelViewer: model load failure", detail);
            setLoadedUrl((currentUrl) => (currentUrl === safeUrl ? null : currentUrl));
            setErrorState({
                url: safeUrl,
                message: `Failed to load 3D model (${reason})`,
            });
        };

        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError as EventListener);

        return () => {
            viewer.removeEventListener("load", handleLoad);
            viewer.removeEventListener("error", handleError as EventListener);
        };
    }, [safeUrl]);

    useEffect(() => {
        materialSnapshotRef.current = null;
    }, [safeUrl]);

    const handleResetView = () => {
        viewerRef.current?.jumpCameraToGoal();
    };

    const handleFitView = () => {
        const viewer = viewerRef.current as ModelViewerElement & { updateFraming?: () => void };
        viewer?.updateFraming?.();
        viewer?.jumpCameraToGoal();
    };

    const handleToggleFullscreen = async () => {
        if (!frameRef.current) return;

        if (document.fullscreenElement === frameRef.current) {
            await document.exitFullscreen();
            return;
        }

        await frameRef.current.requestFullscreen();
    };

    const getDownloadFilename = () => {
        if (!safeUrl) return "model.glb";

        try {
            const parsed = new URL(safeUrl, typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1");
            const queryPath = parsed.searchParams.get("path");
            const candidate = queryPath
                ? decodeURIComponent(queryPath).split(/[\\/]/).filter(Boolean).at(-1)
                : parsed.pathname.split("/").filter(Boolean).at(-1);

            if (!candidate) {
                return "model.glb";
            }

            if (/\.(glb|gltf)$/i.test(candidate)) {
                return candidate;
            }

            return `${candidate}.glb`;
        } catch {
            return "model.glb";
        }
    };

    const activeError =
        !safeUrl ? "Invalid or unsafe model URL" : errorState?.url === safeUrl ? errorState.message : null;
    const status: ViewerStatus = activeError
        ? "error"
        : !isRegistered
          ? "booting"
          : loadedUrl === safeUrl
            ? "ready"
            : "loading";

    useEffect(() => {
        if (status !== "ready") return;

        const viewer = viewerRef.current as (ModelViewerElement & { model?: { materials?: any[] } }) | null;

        const materials = viewer?.model?.materials;
        if (!materials || materials.length === 0) return;

        if (!materialSnapshotRef.current) {
            materialSnapshotRef.current = materials.map((material) => ({
                material,
                baseColorFactor: [...material.pbrMetallicRoughness.baseColorFactor],
                metallicFactor: material.pbrMetallicRoughness.metallicFactor,
                roughnessFactor: material.pbrMetallicRoughness.roughnessFactor,
                baseColorTexture: material.pbrMetallicRoughness.baseColorTexture?.texture ?? null,
                metallicRoughnessTexture: material.pbrMetallicRoughness.metallicRoughnessTexture?.texture ?? null,
                normalTexture: material.normalTexture?.texture ?? null,
                occlusionTexture: material.occlusionTexture?.texture ?? null,
                emissiveTexture: material.emissiveTexture?.texture ?? null,
                emissiveFactor: [...material.emissiveFactor],
            }));
        }

        const snapshot = materialSnapshotRef.current;
        if (!snapshot) return;

        const tintPalette: Record<NonNullable<ModelViewerProps["inspectionTint"]>, number[]> = {
            neutral: [0.83, 0.84, 0.86, 1],
            violet: [0.9, 0.8, 0.98, 1],
            cyan: [0.79, 0.93, 0.97, 1],
        };
        const tint = tintPalette[inspectionTint];

        for (const entry of snapshot) {
            if (inspectionMode === "clay" || inspectionMode === "geometry") {
                entry.material.pbrMetallicRoughness.baseColorTexture?.setTexture(null);
                entry.material.pbrMetallicRoughness.metallicRoughnessTexture?.setTexture(null);
                entry.material.emissiveTexture?.setTexture(null);
                entry.material.pbrMetallicRoughness.setBaseColorFactor(tint);
                entry.material.pbrMetallicRoughness.setMetallicFactor(0);
                entry.material.pbrMetallicRoughness.setRoughnessFactor(inspectionMode === "geometry" ? 0.68 : 1);
                entry.material.normalTexture?.setTexture(inspectionMode === "geometry" ? entry.normalTexture : null);
                entry.material.occlusionTexture?.setTexture(inspectionMode === "geometry" ? entry.occlusionTexture : null);
                entry.material.setEmissiveFactor([0, 0, 0]);
                continue;
            }

            entry.material.pbrMetallicRoughness.setBaseColorFactor(entry.baseColorFactor);
            entry.material.pbrMetallicRoughness.setMetallicFactor(entry.metallicFactor);
            entry.material.pbrMetallicRoughness.setRoughnessFactor(entry.roughnessFactor);
            entry.material.pbrMetallicRoughness.baseColorTexture?.setTexture(entry.baseColorTexture);
            entry.material.pbrMetallicRoughness.metallicRoughnessTexture?.setTexture(entry.metallicRoughnessTexture);
            entry.material.normalTexture?.setTexture(entry.normalTexture);
            entry.material.occlusionTexture?.setTexture(entry.occlusionTexture);
            entry.material.emissiveTexture?.setTexture(entry.emissiveTexture);
            entry.material.setEmissiveFactor(entry.emissiveFactor);
        }
    }, [inspectionMode, inspectionTint, status]);

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
            anchor.download = getDownloadFilename();
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (downloadError) {
            console.warn("ModelViewer: falling back to direct download", downloadError);
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
            aria-label="Interactive 3D model viewer. Drag to rotate, scroll to zoom, and right-click drag to pan."
        >
            <div id={descriptionId} className="sr-only">
                A 3D model viewer displaying a generated asset. Drag to orbit the camera,
                scroll to zoom, and right-click drag to pan around the model.
            </div>

            <model-viewer
                key={safeUrl}
                ref={viewerRef}
                src={safeUrl}
                alt="Generated 3D model preview"
                camera-controls={interactive ? "" : undefined}
                interaction-prompt={interactive ? "auto" : "none"}
                loading="eager"
                reveal="auto"
                shadow-intensity="1"
                exposure="1"
                className="h-full w-full"
                style={{ backgroundColor: "transparent" }}
                aria-describedby={descriptionId}
            />

            {status === "booting" && <LoadingState message="Initializing 3D viewer..." />}
            {status === "loading" && <LoadingState message="Loading model..." />}
            {status === "error" && (
                <div className="absolute inset-0 p-4">
                    <ErrorState message={activeError ?? "Failed to load 3D model"} />
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
                        Interactive preview
                    </div>
                </div>
            )}
        </div>
    );
}
