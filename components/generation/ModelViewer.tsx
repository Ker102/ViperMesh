"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

interface ModelViewerProps {
    url: string;
}

// Loading spinner component for Suspense fallback
function LoadingSpinner() {
    return (
        <div
            className="absolute inset-0 flex items-center justify-center"
            role="status"
            aria-busy="true"
            aria-label="Loading 3D model"
        >
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="text-sm text-white/70">Loading model...</span>
            </div>
        </div>
    );
}

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);

    // Cleanup on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear the GLTF cache for this URL
            useGLTF.clear(url);
        };
    }, [url]);

    if (!scene) return null;

    return <primitive object={scene} />;
}

/**
 * Validates a URL for safe loading in the 3D viewer.
 * Only allows HTTPS URLs (and HTTP for localhost dev).
 */
function isValidModelUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);

        // Block dangerous protocols
        const blockedProtocols = ['data:', 'blob:', 'javascript:', 'file:'];
        if (blockedProtocols.includes(url.protocol)) {
            console.warn('ModelViewer: Blocked unsafe protocol:', url.protocol);
            return false;
        }

        // Allow HTTPS, or HTTP for localhost development
        if (url.protocol === 'https:') return true;
        if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
            return true;
        }

        console.warn('ModelViewer: URL must use HTTPS:', urlString);
        return false;
    } catch {
        console.warn('ModelViewer: Invalid URL:', urlString);
        return false;
    }
}

export function ModelViewer({ url }: ModelViewerProps) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const isValidUrl = url ? isValidModelUrl(url) : false;
    const hasError = failedUrl === url;

    if (!url) return null;

    if (!isValidUrl) {
        return (
            <div
                className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center"
                role="alert"
            >
                <p className="text-red-400 text-sm">Invalid or unsafe model URL</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div
                className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center"
                role="alert"
            >
                <p className="text-red-400 text-sm">Failed to load 3D model</p>
            </div>
        );
    }

    return (
        <div
            className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden relative"
            role="img"
            aria-label="Interactive 3D model viewer. Use mouse to rotate and zoom."
        >
            {/* Visually hidden description for screen readers */}
            <div id="model-description" className="sr-only">
                A 3D model viewer displaying a generated asset.
                You can interact with the model by clicking and dragging to rotate,
                and scrolling to zoom in and out.
            </div>

            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ fov: 50 }}
                aria-describedby="model-description"
                onError={() => setFailedUrl(url)}
            >
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        <Model url={url} />
                    </Stage>
                </Suspense>
                <OrbitControls autoRotate />
            </Canvas>

            {/* Loading overlay outside Canvas for proper rendering */}
            <LoadingSpinner />

            <div className="absolute bottom-4 right-4 text-xs text-white/50 pointer-events-none">
                Powered by @react-three/fiber
            </div>

            {/* Keyboard instructions for accessibility */}
            <div className="absolute bottom-4 left-4 text-xs text-white/30 pointer-events-none">
                Click + drag to rotate • Scroll to zoom
            </div>
        </div>
    );
}
