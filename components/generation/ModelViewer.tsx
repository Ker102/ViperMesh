"use client";

import type { ModelViewerElement } from "@google/model-viewer";
import { Loader2, RotateCcw } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ModelViewerProps {
    url: string;
    className?: string;
}

type ViewerStatus = "booting" | "loading" | "ready" | "error";

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
        const blockedProtocols = ["data:", "blob:", "javascript:", "file:"];

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

export function ModelViewer({ url, className }: ModelViewerProps) {
    const viewerRef = useRef<ModelViewerElement | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return customElements.get("model-viewer") != null;
    });
    const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<{ url: string; message: string } | null>(null);
    const safeUrl = useMemo(() => getSafeModelUrl(url), [url]);

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

    const handleResetView = () => {
        viewerRef.current?.jumpCameraToGoal();
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
            className={cn(
                "relative h-96 w-full overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.14),_rgba(15,23,42,0.95)_58%)]",
                className,
            )}
            role="img"
            aria-label="Interactive 3D model viewer. Drag to rotate, scroll to zoom, and right-click drag to pan."
        >
            <div id="model-viewer-description" className="sr-only">
                A 3D model viewer displaying a generated asset. Drag to orbit the camera,
                scroll to zoom, and right-click drag to pan around the model.
            </div>

            <model-viewer
                key={safeUrl}
                ref={viewerRef}
                src={safeUrl}
                alt="Generated 3D model preview"
                camera-controls=""
                interaction-prompt="auto"
                loading="eager"
                reveal="auto"
                shadow-intensity="1"
                exposure="1"
                className="h-full w-full"
                style={{ backgroundColor: "transparent" }}
                aria-describedby="model-viewer-description"
            />

            {status === "booting" && <LoadingState message="Initializing 3D viewer..." />}
            {status === "loading" && <LoadingState message="Loading model..." />}
            {status === "error" && (
                <div className="absolute inset-0 p-4">
                    <ErrorState message={activeError ?? "Failed to load 3D model"} />
                </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent px-4 pb-4 pt-10">
                <div className="text-xs text-slate-200/75">
                    Drag to orbit • Scroll to zoom • Right-click drag to pan
                </div>
                <button
                    type="button"
                    onClick={handleResetView}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-teal-300/50 hover:bg-slate-900"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset View
                </button>
            </div>
        </div>
    );
}
