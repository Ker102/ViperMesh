"use client";

import { Bounds, ContactShadows, OrbitControls, useBounds } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Download, FolderOpen, Loader2, Maximize2, RotateCcw } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { cn } from "@/lib/utils";

export type HeavyInspectionMode = "material" | "geometry" | "solid" | "toon" | "wireframe";
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
    pbrEnabled?: boolean;
    unlitEnabled?: boolean;
    previewMetalness?: number;
    previewRoughness?: number;
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
    material: "#4d535d",
    geometry: "#343943",
    solid: "#3a3f47",
    toon: "#3f454f",
    wireframe: "#1a2029",
};

const frameBackgroundByMode: Record<HeavyInspectionMode, string> = {
    material: "radial-gradient(circle at top, rgba(148, 163, 184, 0.18), rgba(31, 41, 55, 0.95) 64%)",
    geometry: "radial-gradient(circle at top, rgba(186, 230, 253, 0.18), rgba(39, 46, 58, 0.98) 64%)",
    solid: "radial-gradient(circle at top, rgba(226, 232, 240, 0.12), rgba(39, 46, 58, 0.96) 66%)",
    toon: "radial-gradient(circle at top, rgba(196, 181, 253, 0.24), rgba(31, 41, 55, 0.95) 64%)",
    wireframe: "radial-gradient(circle at top, rgba(125, 211, 252, 0.14), rgba(17, 24, 39, 0.98) 64%)",
};

const toneMappingExposureByMode: Record<HeavyInspectionMode, number> = {
    material: 1.18,
    geometry: 1.05,
    solid: 1.08,
    toon: 1.1,
    wireframe: 1,
};

const SUPPORTED_VIEWER_EXTENSIONS = new Set([".glb", ".gltf", ".fbx", ".obj", ".stl"]);

let toonGradientTexture: THREE.DataTexture | null = null;

function getToonGradientTexture() {
    if (toonGradientTexture) {
        return toonGradientTexture;
    }

    const colors = new Uint8Array([
        20, 24, 31, 255,
        62, 72, 92, 255,
        118, 132, 156, 255,
        196, 208, 224, 255,
        250, 250, 255, 255,
    ]);
    const texture = new THREE.DataTexture(colors, 5, 1, THREE.RGBAFormat);
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

        if (/\.(glb|gltf|fbx|obj|stl)$/i.test(candidate)) {
            return candidate;
        }

        return `${candidate}.glb`;
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
        if (
            parsed.pathname === "/api/ai/neural-output" ||
            parsed.pathname.startsWith("/api/ai/neural-output/files/")
        ) {
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
        if (parsed.pathname === "/api/ai/neural-output") {
            const relativePath = parsed.searchParams.get("path");
            return relativePath ? decodeURIComponent(relativePath) : null;
        }

        const pathPrefix = "/api/ai/neural-output/files/";
        if (parsed.pathname.startsWith(pathPrefix)) {
            return parsed.pathname
                .slice(pathPrefix.length)
                .split("/")
                .map((segment) => decodeURIComponent(segment))
                .join("/");
        }

        return null;
    } catch {
        return null;
    }
}

function inferModelExtension(safeUrl: string): string | null {
    try {
        const parsed = new URL(
            safeUrl,
            typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1",
        );
        const queryPath = parsed.searchParams.get("path");
        const candidate = queryPath
            ? decodeURIComponent(queryPath)
            : parsed.pathname.split("/").map((segment) => decodeURIComponent(segment)).join("/");
        const extension = candidate.match(/\.[^.\\/]+$/)?.[0]?.toLowerCase() ?? null;
        return extension && SUPPORTED_VIEWER_EXTENSIONS.has(extension) ? extension : null;
    } catch {
        return null;
    }
}

function collectMaterialTextures(material: THREE.Material, textureSet: Set<THREE.Texture>) {
    Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) {
            textureSet.add(value);
        }
    });
}

function disposeLoadedAssetResources(root: THREE.Object3D) {
    const geometrySet = new Set<THREE.BufferGeometry>();
    const materialSet = new Set<THREE.Material>();
    const textureSet = new Set<THREE.Texture>();

    root.traverse((child) => {
        const lineSegments = child as THREE.LineSegments;
        if (lineSegments.isLineSegments && lineSegments.userData.__inspectionOverlay) {
            if (lineSegments.geometry) {
                geometrySet.add(lineSegments.geometry);
            }
            const lineMaterials = Array.isArray(lineSegments.material) ? lineSegments.material : [lineSegments.material];
            lineMaterials.filter(Boolean).forEach((material) => materialSet.add(material));
            return;
        }

        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        if (mesh.geometry) {
            geometrySet.add(mesh.geometry);
        }
        const cachedSourceGeometry = mesh.userData.__inspectionGeometrySource as THREE.BufferGeometry | undefined;
        const cachedSmoothGeometry = mesh.userData.__inspectionGeometrySmooth as THREE.BufferGeometry | undefined;
        const cachedFlatGeometry = mesh.userData.__inspectionGeometryFlat as THREE.BufferGeometry | undefined;
        if (cachedSourceGeometry) geometrySet.add(cachedSourceGeometry);
        if (cachedSmoothGeometry) geometrySet.add(cachedSmoothGeometry);
        if (cachedFlatGeometry) geometrySet.add(cachedFlatGeometry);

        const originalMaterials =
            (mesh.userData.__originalMaterials as THREE.Material[] | undefined) ??
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);
        originalMaterials.filter(Boolean).forEach((material) => materialSet.add(material));

        const generatedMaterials = mesh.userData.__generatedMaterials as THREE.Material[] | undefined;
        generatedMaterials?.forEach((material) => materialSet.add(material));
    });

    materialSet.forEach((material) => collectMaterialTextures(material, textureSet));
    materialSet.forEach((material) => material.dispose());
    textureSet.forEach((texture) => texture.dispose());
    geometrySet.forEach((geometry) => geometry.dispose());
}

async function findObjMaterialLibraryUrl(objUrl: string): Promise<string | null> {
    try {
        const response = await fetch(objUrl, { credentials: "include" });
        if (!response.ok) {
            return null;
        }

        const source = await response.text();
        const match = source.match(/^\s*mtllib\s+(.+)\s*$/im);
        if (!match?.[1]) {
            return null;
        }

        return new URL(match[1].trim(), objUrl).toString();
    } catch {
        return null;
    }
}

async function loadAssetRoot(url: string, extension: string): Promise<THREE.Object3D> {
    if (extension === ".glb" || extension === ".gltf") {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        return SkeletonUtils.clone(gltf.scene) as THREE.Group;
    }

    if (extension === ".fbx") {
        const loader = new FBXLoader();
        const fbx = await loader.loadAsync(url);
        return SkeletonUtils.clone(fbx) as THREE.Group;
    }

    if (extension === ".obj") {
        const manager = new THREE.LoadingManager();
        const loader = new OBJLoader(manager);
        const mtlUrl = await findObjMaterialLibraryUrl(url);
        if (mtlUrl) {
            try {
                const materials = await new MTLLoader(manager).loadAsync(mtlUrl);
                materials.preload();
                loader.setMaterials(materials);
            } catch {
                // Best-effort: OBJ geometry should still load without its material library.
            }
        }
        const obj = await loader.loadAsync(url);
        return obj.clone(true);
    }

    if (extension === ".stl") {
        const geometry = await new STLLoader().loadAsync(url);
        const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: "#d4d4d8",
                metalness: 0.02,
                roughness: 0.9,
                side: THREE.DoubleSide,
            }),
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const group = new THREE.Group();
        group.add(mesh);
        return group;
    }

    throw new Error(`Unsupported model format: ${extension}`);
}

function disposeGeneratedMaterials(object: THREE.Object3D) {
    object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const toonOverlay = mesh.userData.__toonEdgeOverlay as THREE.LineSegments | undefined;
        if (toonOverlay) {
            mesh.remove(toonOverlay);
            toonOverlay.geometry.dispose();
            const overlayMaterials = Array.isArray(toonOverlay.material) ? toonOverlay.material : [toonOverlay.material];
            overlayMaterials.forEach((material) => material.dispose());
            delete mesh.userData.__toonEdgeOverlay;
            delete mesh.userData.__toonEdgeOverlayKey;
        }

        const generatedMaterials = mesh.userData.__generatedMaterials as THREE.Material[] | undefined;
        generatedMaterials?.forEach((material) => material.dispose());
        delete mesh.userData.__generatedMaterials;
    });
}

function copyCommonMaterialProps(
    target: THREE.Material,
    original: THREE.Material,
    flatShading: boolean,
    maxAnisotropy: number,
) {
    const source = original as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture | null;
        normalMap?: THREE.Texture | null;
        bumpMap?: THREE.Texture | null;
        bumpScale?: number;
        aoMap?: THREE.Texture | null;
        aoMapIntensity?: number;
        emissive?: THREE.Color;
        emissiveMap?: THREE.Texture | null;
        emissiveIntensity?: number;
        specular?: THREE.Color;
        specularMap?: THREE.Texture | null;
        shininess?: number;
        reflectivity?: number;
        metalness?: number;
        roughness?: number;
        metalnessMap?: THREE.Texture | null;
        roughnessMap?: THREE.Texture | null;
        envMap?: THREE.Texture | null;
        envMapIntensity?: number;
        combine?: THREE.Combine;
        transparent?: boolean;
        opacity?: number;
        alphaTest?: number;
        side?: THREE.Side;
    };
    const dest = target as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture | null;
        normalMap?: THREE.Texture | null;
        bumpMap?: THREE.Texture | null;
        bumpScale?: number;
        aoMap?: THREE.Texture | null;
        aoMapIntensity?: number;
        emissive?: THREE.Color;
        emissiveMap?: THREE.Texture | null;
        emissiveIntensity?: number;
        specular?: THREE.Color;
        specularMap?: THREE.Texture | null;
        shininess?: number;
        reflectivity?: number;
        metalness?: number;
        roughness?: number;
        metalnessMap?: THREE.Texture | null;
        roughnessMap?: THREE.Texture | null;
        envMap?: THREE.Texture | null;
        envMapIntensity?: number;
        combine?: THREE.Combine;
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
        if (dest.map) {
            dest.map.colorSpace = THREE.SRGBColorSpace;
            dest.map.generateMipmaps = true;
            dest.map.magFilter = THREE.LinearFilter;
            dest.map.minFilter = THREE.LinearMipmapLinearFilter;
            dest.map.anisotropy = maxAnisotropy;
            dest.map.needsUpdate = true;
        }
    }
    if ("normalMap" in dest) {
        dest.normalMap = source.normalMap ?? null;
        if (dest.normalMap) {
            dest.normalMap.colorSpace = THREE.NoColorSpace;
            dest.normalMap.generateMipmaps = true;
            dest.normalMap.magFilter = THREE.LinearFilter;
            dest.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.normalMap.anisotropy = maxAnisotropy;
            dest.normalMap.needsUpdate = true;
        }
    }
    if ("bumpMap" in dest) {
        dest.bumpMap = source.bumpMap ?? null;
        if (dest.bumpMap) {
            dest.bumpMap.colorSpace = THREE.NoColorSpace;
            dest.bumpMap.generateMipmaps = true;
            dest.bumpMap.magFilter = THREE.LinearFilter;
            dest.bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.bumpMap.anisotropy = maxAnisotropy;
            dest.bumpMap.needsUpdate = true;
        }
    }
    if ("bumpScale" in dest && typeof source.bumpScale === "number") {
        dest.bumpScale = source.bumpScale;
    }
    if ("aoMap" in dest) {
        dest.aoMap = source.aoMap ?? null;
        if (dest.aoMap) {
            dest.aoMap.colorSpace = THREE.NoColorSpace;
            dest.aoMap.generateMipmaps = true;
            dest.aoMap.magFilter = THREE.LinearFilter;
            dest.aoMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.aoMap.anisotropy = maxAnisotropy;
            dest.aoMap.needsUpdate = true;
        }
    }
    if ("aoMapIntensity" in dest && typeof source.aoMapIntensity === "number") {
        dest.aoMapIntensity = source.aoMapIntensity;
    }
    if (dest.emissive && source.emissive) {
        dest.emissive.copy(source.emissive);
    }
    if ("emissiveMap" in dest) {
        dest.emissiveMap = source.emissiveMap ?? null;
        if (dest.emissiveMap) {
            dest.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            dest.emissiveMap.generateMipmaps = true;
            dest.emissiveMap.magFilter = THREE.LinearFilter;
            dest.emissiveMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.emissiveMap.anisotropy = maxAnisotropy;
            dest.emissiveMap.needsUpdate = true;
        }
    }
    if ("emissiveIntensity" in dest && typeof source.emissiveIntensity === "number") {
        dest.emissiveIntensity = source.emissiveIntensity;
    }
    if (dest.specular && source.specular) {
        dest.specular.copy(source.specular);
    }
    if ("specularMap" in dest) {
        dest.specularMap = source.specularMap ?? null;
        if (dest.specularMap) {
            dest.specularMap.colorSpace = THREE.NoColorSpace;
            dest.specularMap.generateMipmaps = true;
            dest.specularMap.magFilter = THREE.LinearFilter;
            dest.specularMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.specularMap.anisotropy = maxAnisotropy;
            dest.specularMap.needsUpdate = true;
        }
    }
    if ("shininess" in dest && typeof source.shininess === "number") {
        dest.shininess = source.shininess;
    }
    if ("reflectivity" in dest && typeof source.reflectivity === "number") {
        dest.reflectivity = source.reflectivity;
    }
    if ("metalness" in dest && typeof source.metalness === "number") {
        dest.metalness = source.metalness;
    }
    if ("roughness" in dest && typeof source.roughness === "number") {
        dest.roughness = source.roughness;
    }
    if ("metalnessMap" in dest) {
        dest.metalnessMap = source.metalnessMap ?? null;
        if (dest.metalnessMap) {
            dest.metalnessMap.colorSpace = THREE.NoColorSpace;
            dest.metalnessMap.generateMipmaps = true;
            dest.metalnessMap.magFilter = THREE.LinearFilter;
            dest.metalnessMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.metalnessMap.anisotropy = maxAnisotropy;
            dest.metalnessMap.needsUpdate = true;
        }
    }
    if ("roughnessMap" in dest) {
        dest.roughnessMap = source.roughnessMap ?? null;
        if (dest.roughnessMap) {
            dest.roughnessMap.colorSpace = THREE.NoColorSpace;
            dest.roughnessMap.generateMipmaps = true;
            dest.roughnessMap.magFilter = THREE.LinearFilter;
            dest.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
            dest.roughnessMap.anisotropy = maxAnisotropy;
            dest.roughnessMap.needsUpdate = true;
        }
    }
    if ("envMapIntensity" in dest && typeof source.envMapIntensity === "number") {
        dest.envMapIntensity = source.envMapIntensity;
    }
    if ("envMap" in dest) {
        dest.envMap = source.envMap ?? null;
    }
    if ("combine" in dest && typeof source.combine === "number") {
        dest.combine = source.combine;
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

function stripFacetMutedMaps(material: THREE.Material) {
    const candidate = material as THREE.Material & {
        normalMap?: THREE.Texture | null;
        bumpMap?: THREE.Texture | null;
        aoMap?: THREE.Texture | null;
        specularMap?: THREE.Texture | null;
    };
    if ("normalMap" in candidate) {
        candidate.normalMap = null;
    }
    if ("bumpMap" in candidate) {
        candidate.bumpMap = null;
    }
    if ("aoMap" in candidate) {
        candidate.aoMap = null;
    }
    if ("specularMap" in candidate) {
        candidate.specularMap = null;
    }
    material.needsUpdate = true;
}

function buildClassicPreviewMaterial(
    original: THREE.Material,
    flatShading: boolean,
    maxAnisotropy: number,
) {
    if (
        original instanceof THREE.MeshPhongMaterial ||
        original instanceof THREE.MeshLambertMaterial
    ) {
        const material = original.clone();
        material.side = THREE.DoubleSide;
        material.flatShading = flatShading;
        if (material instanceof THREE.MeshPhongMaterial) {
            material.specular.multiplyScalar(0.3);
            material.shininess = Math.min(material.shininess ?? 10, 8);
            material.reflectivity = Math.min(material.reflectivity ?? 0.04, 0.04);
            material.combine = THREE.MultiplyOperation;
            material.envMap = null;
        }
        if (flatShading) {
            stripFacetMutedMaps(material);
        }
        material.needsUpdate = true;
        return material;
    }

    const material = new THREE.MeshPhongMaterial({
        color: "#ffffff",
        flatShading,
        side: THREE.DoubleSide,
        shininess: 14,
        specular: new THREE.Color("#1f2937"),
        reflectivity: 0.03,
    });
    copyCommonMaterialProps(material, original, flatShading, maxAnisotropy);
    material.side = THREE.DoubleSide;
    material.flatShading = flatShading;
    material.combine = THREE.MultiplyOperation;
    material.reflectivity = 0.03;
    material.shininess = 14;
    if (flatShading) {
        stripFacetMutedMaps(material);
    }
    material.needsUpdate = true;
    return material;
}

function derivePbrFactors(original: THREE.Material) {
    const source = original as THREE.Material & {
        metalness?: number;
        roughness?: number;
        reflectivity?: number;
        shininess?: number;
        specular?: THREE.Color;
    };

    const specularStrength = source.specular
        ? (source.specular.r + source.specular.g + source.specular.b) / 3
        : 0.08;
    const reflectivity = typeof source.reflectivity === "number" ? source.reflectivity : 0.08;
    const shininess = typeof source.shininess === "number" ? source.shininess : 18;

    const derivedMetalness = typeof source.metalness === "number"
        ? source.metalness
        : THREE.MathUtils.clamp(specularStrength * 0.55 + reflectivity * 0.35, 0.02, 0.52);
    const derivedRoughness = typeof source.roughness === "number"
        ? source.roughness
        : THREE.MathUtils.clamp(1 - Math.min(shininess / 120, 1) * 0.72, 0.16, 0.82);

    return {
        metalness: derivedMetalness,
        roughness: derivedRoughness,
    };
}

function buildReplacementMaterial(
    original: THREE.Material,
    mode: HeavyInspectionMode,
    tint: string,
    shadingMode: HeavyShadingMode,
    pbrEnabled: boolean,
    unlitEnabled: boolean,
    previewMetalness: number,
    previewRoughness: number,
    maxAnisotropy: number,
): THREE.Material {
    const flatShading = shadingMode === "flat";

    if (mode === "material") {
        if (unlitEnabled) {
            const material = new THREE.MeshBasicMaterial({
                color: "#ffffff",
                side: THREE.DoubleSide,
            });
            copyCommonMaterialProps(material, original, flatShading, maxAnisotropy);
            if ("normalMap" in material) {
                material.normalMap = null;
            }
            return material;
        }

        if (!pbrEnabled) {
            return buildClassicPreviewMaterial(original, flatShading, maxAnisotropy);
        }

        const derived = derivePbrFactors(original);
        const metalnessAlpha = previewMetalness === 1 ? 0 : 0.42;
        const roughnessAlpha = previewRoughness === 1 ? 0 : 0.32;
        const resolvedMetalness = THREE.MathUtils.clamp(
            THREE.MathUtils.lerp(derived.metalness, previewMetalness, metalnessAlpha),
            0,
            1,
        );
        const resolvedRoughness = THREE.MathUtils.clamp(
            THREE.MathUtils.lerp(derived.roughness, previewRoughness, roughnessAlpha),
            0.04,
            1,
        );

        const material = new THREE.MeshStandardMaterial({
            color: "#ffffff",
            flatShading,
            side: THREE.DoubleSide,
            metalness: resolvedMetalness,
            roughness: resolvedRoughness,
        });
        copyCommonMaterialProps(material, original, flatShading, maxAnisotropy);
        material.side = THREE.DoubleSide;
        material.flatShading = flatShading;
        material.envMapIntensity = 0.82;
        material.aoMapIntensity = 0.2;
        material.metalness = resolvedMetalness;
        material.roughness = resolvedRoughness;
        if (flatShading) {
            stripFacetMutedMaps(material);
        }
        material.needsUpdate = true;
        return material;
    }

    if (mode === "geometry") {
        const material = new THREE.MeshNormalMaterial({
            flatShading,
            side: THREE.DoubleSide,
        });
        return material;
    }

    if (mode === "solid") {
        return new THREE.MeshStandardMaterial({
            color: "#c3c8d0",
            metalness: 0,
            roughness: 0.96,
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
        material.emissive.copy(source.emissive ?? new THREE.Color("#000000"));
        material.emissiveIntensity = 0.02;
        material.emissiveMap = source.emissiveMap ?? null;
        stripFacetMutedMaps(material);
        material.needsUpdate = true;
        return material;
    }

    return new THREE.MeshBasicMaterial({
        color: tint,
        wireframe: true,
        side: THREE.DoubleSide,
    });
}

function getInspectionGeometryVariant(mesh: THREE.Mesh, shadingMode: HeavyShadingMode) {
    const sourceKey = "__inspectionGeometrySource";
    const variantKey =
        shadingMode === "flat" ? "__inspectionGeometryFlat" : "__inspectionGeometrySmooth";

    if (!mesh.userData[sourceKey]) {
        mesh.userData[sourceKey] = mesh.geometry.clone();
    }

    if (!mesh.userData[variantKey]) {
        const sourceGeometry = mesh.userData[sourceKey] as THREE.BufferGeometry;
        const geometry = (() => {
            if (shadingMode === "flat") {
                return sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
            }

            return mergeVertices(sourceGeometry.clone(), 1e-4);
        })();

        geometry.deleteAttribute("normal");
        geometry.computeVertexNormals();
        geometry.normalizeNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        geometry.attributes.normal.needsUpdate = true;
        mesh.userData[variantKey] = geometry;
    }

    return mesh.userData[variantKey] as THREE.BufferGeometry;
}

function prepareInspectionGeometry(root: THREE.Object3D, shadingMode: HeavyShadingMode) {
    root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry) return;

        mesh.geometry = getInspectionGeometryVariant(mesh, shadingMode);
    });
}

function syncToonEdgeOverlay(root: THREE.Object3D, enabled: boolean, shadingMode: HeavyShadingMode) {
    root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const existingOverlay = mesh.userData.__toonEdgeOverlay as THREE.LineSegments | undefined;
        if (!enabled) {
            if (existingOverlay) {
                mesh.remove(existingOverlay);
                existingOverlay.geometry.dispose();
                const overlayMaterials = Array.isArray(existingOverlay.material) ? existingOverlay.material : [existingOverlay.material];
                overlayMaterials.forEach((material) => material.dispose());
                delete mesh.userData.__toonEdgeOverlay;
                delete mesh.userData.__toonEdgeOverlayKey;
            }
            return;
        }

        const overlayKey = `${shadingMode}:${mesh.geometry.uuid}`;
        if (existingOverlay && mesh.userData.__toonEdgeOverlayKey === overlayKey) {
            return;
        }

        if (existingOverlay) {
            mesh.remove(existingOverlay);
            existingOverlay.geometry.dispose();
            const overlayMaterials = Array.isArray(existingOverlay.material) ? existingOverlay.material : [existingOverlay.material];
            overlayMaterials.forEach((material) => material.dispose());
        }

        const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, shadingMode === "flat" ? 6 : 18);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: "#0b0f16",
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            toneMapped: false,
        });
        const overlay = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        overlay.userData.__inspectionOverlay = true;
        overlay.renderOrder = 8;
        overlay.scale.setScalar(1.0015);
        mesh.add(overlay);
        mesh.userData.__toonEdgeOverlay = overlay;
        mesh.userData.__toonEdgeOverlayKey = overlayKey;
    });
}

function SceneEnvironmentController({
    inspectionMode,
    pbrEnabled,
    unlitEnabled,
}: {
    inspectionMode: HeavyInspectionMode;
    pbrEnabled: boolean;
    unlitEnabled: boolean;
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
        if (inspectionMode === "material" && !unlitEnabled) {
            scene.environment = envTextureRef.current;
            scene.environmentIntensity = pbrEnabled ? 0.62 : 0.2;
        } else if (inspectionMode === "toon") {
            scene.environment = envTextureRef.current;
            scene.environmentIntensity = 0.18;
        } else if (inspectionMode === "solid") {
            scene.environment = envTextureRef.current;
            scene.environmentIntensity = 0.08;
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
    }, [gl, inspectionMode, pbrEnabled, scene, unlitEnabled]);

    return null;
}

function applyInspectionMaterials(
    root: THREE.Object3D,
    mode: HeavyInspectionMode,
    tint: string,
    shadingMode: HeavyShadingMode,
    pbrEnabled: boolean,
    unlitEnabled: boolean,
    previewMetalness: number,
    previewRoughness: number,
    maxAnisotropy: number,
) {
    prepareInspectionGeometry(root, shadingMode);
    syncToonEdgeOverlay(root, mode === "toon", shadingMode);

    root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;

        const originalMaterials =
            (mesh.userData.__originalMaterials as THREE.Material[] | undefined) ??
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);
        mesh.userData.__originalMaterials = originalMaterials;

        const generatedMaterials = mesh.userData.__generatedMaterials as THREE.Material[] | undefined;
        generatedMaterials?.forEach((material) => material.dispose());

        const replacements = originalMaterials.map((material) =>
            buildReplacementMaterial(
                material,
                mode,
                tint,
                shadingMode,
                pbrEnabled,
                unlitEnabled,
                previewMetalness,
                previewRoughness,
                maxAnisotropy,
            )
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
            window.requestAnimationFrame(() => {
                controlsRef.current?.saveState?.();
            });
        };
        const reset = () => {
            controlsRef.current?.reset?.();
            fit();
        };

        onRegisterApi({ fit, reset });
    }, [bounds, controlsRef, onRegisterApi]);

    return null;
}

function LoadedAsset({
    url,
    extension,
    inspectionMode,
    inspectionTint,
    shadingMode,
    pbrEnabled,
    unlitEnabled,
    previewMetalness,
    previewRoughness,
    onReady,
    onError,
}: {
    url: string;
    extension: string;
    inspectionMode: HeavyInspectionMode;
    inspectionTint: NonNullable<HeavyModelViewerProps["inspectionTint"]>;
    shadingMode: HeavyShadingMode;
    pbrEnabled: boolean;
    unlitEnabled: boolean;
    previewMetalness: number;
    previewRoughness: number;
    onReady: () => void;
    onError: (error: Error) => void;
}) {
    const { gl } = useThree();
    const [scene, setScene] = useState<THREE.Object3D | null>(null);
    const readyKeyRef = useRef<string | null>(null);
    const maxAnisotropy = useMemo(() => {
        const capability = gl.capabilities.getMaxAnisotropy?.() ?? 1;
        return Math.max(1, Math.min(8, capability));
    }, [gl]);

    useEffect(() => {
        let cancelled = false;
        let loadedScene: THREE.Object3D | null = null;

        void (async () => {
            try {
                const nextScene = await loadAssetRoot(url, extension);
                if (cancelled) {
                    disposeLoadedAssetResources(nextScene);
                    return;
                }

                loadedScene = nextScene;
                setScene(nextScene);
            } catch (error) {
                const resolvedError =
                    error instanceof Error ? error : new Error("Failed to load 3D model");
                if (!cancelled) {
                    onError(resolvedError);
                }
            }
        })();

        return () => {
            cancelled = true;
            if (loadedScene) {
                disposeLoadedAssetResources(loadedScene);
            }
        };
    }, [extension, onError, url]);

    useEffect(() => {
        if (!scene) {
            return;
        }

        const readyKey = `${extension}:${url}`;
        if (readyKeyRef.current === readyKey) {
            return;
        }

        readyKeyRef.current = readyKey;
        onReady();
    }, [extension, onReady, scene, url]);

    useEffect(() => {
        if (!scene) {
            return;
        }

        applyInspectionMaterials(
            scene,
            inspectionMode,
            tintPaletteHex[inspectionTint],
            shadingMode,
            pbrEnabled,
            unlitEnabled,
            previewMetalness,
            previewRoughness,
            maxAnisotropy,
        );

        return () => {
            disposeGeneratedMaterials(scene);
        };
    }, [inspectionMode, inspectionTint, maxAnisotropy, pbrEnabled, previewMetalness, previewRoughness, scene, shadingMode, unlitEnabled]);

    if (!scene) {
        return null;
    }

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
    pbrEnabled = true,
    unlitEnabled = false,
    previewMetalness = 1,
    previewRoughness = 1,
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
    const modelExtension = useMemo(() => inferModelExtension(safeUrl), [safeUrl]);
    const handleAssetReady = React.useCallback(() => {
        setStatus("ready");
        setErrorMessage(null);
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                viewerApiRef.current?.fit();
            });
        });
    }, []);
    const handleAssetError = React.useCallback((error: Error) => {
        console.error("HeavyModelViewer: asset load failure", error);
        setStatus("error");
        setErrorMessage(`Failed to load 3D model (${error.message})`);
    }, []);
    const useMaterialView = inspectionMode === "material";
    const useFlatLighting = useMaterialView && !unlitEnabled && shadingMode === "flat";
    const materialAmbientIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 0.42
            : inspectionMode === "solid"
                ? 0.28
                : 0.92
        : unlitEnabled
            ? 0.15
            : useFlatLighting
                ? (pbrEnabled ? 0.18 : 0.24)
                : pbrEnabled
                    ? 0.34
                    : 0.5;
    const materialHemisphereIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 0.72
            : inspectionMode === "solid"
                ? 0.58
                : 1.45
        : unlitEnabled
            ? 0.15
            : useFlatLighting
                ? (pbrEnabled ? 0.24 : 0.34)
                : pbrEnabled
                    ? 0.62
                    : 0.92;
    const keyDirectionalIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 2.75
            : inspectionMode === "solid"
                ? 1.95
                : 2.15
        : unlitEnabled
            ? 0.1
            : useFlatLighting
                ? (pbrEnabled ? 2.15 : 2.4)
                : pbrEnabled
                    ? 1.35
                    : 1.68;
    const fillDirectionalIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 0.18
            : inspectionMode === "solid"
                ? 0.18
                : 0.9
        : unlitEnabled
            ? 0.08
            : useFlatLighting
                ? (pbrEnabled ? 0.16 : 0.22)
                : pbrEnabled
                    ? 0.42
                    : 0.58;
    const coolDirectionalIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 0.08
            : inspectionMode === "solid"
                ? 0.08
                : 0.45
        : unlitEnabled
            ? 0.06
            : useFlatLighting
                ? (pbrEnabled ? 0.12 : 0.18)
                : pbrEnabled
                    ? 0.22
                    : 0.34;
    const rimDirectionalIntensity = !useMaterialView
        ? inspectionMode === "toon"
            ? 0.28
            : inspectionMode === "solid"
                ? 0.12
                : 0.28
        : unlitEnabled
            ? 0.04
            : useFlatLighting
                ? (pbrEnabled ? 0.08 : 0.12)
                : pbrEnabled
                    ? 0.12
                    : 0.2;

    useEffect(() => {
        setStatus(modelExtension ? "loading" : "error");
        setErrorMessage(modelExtension ? null : "Unsupported model format");
    }, [modelExtension, safeUrl]);

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
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
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

            const payload = (await response.json()) as { relativePath?: string; error?: string };
            if (!payload.relativePath) {
                throw new Error(payload.error ?? "Resolved file path is missing");
            }

            const revealResult = await window.vipermesh!.revealItemInFolder(payload.relativePath);
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
                <SceneEnvironmentController inspectionMode={inspectionMode} pbrEnabled={pbrEnabled} unlitEnabled={unlitEnabled} />
                <ambientLight intensity={materialAmbientIntensity} />
                <hemisphereLight
                    args={["#f8fafc", "#1e293b", materialHemisphereIntensity]}
                />
                <directionalLight position={[5.5, 7, 4.5]} intensity={keyDirectionalIntensity} castShadow />
                <directionalLight position={[-4, 3, -5]} intensity={fillDirectionalIntensity} />
                <directionalLight position={[0, 4, -7]} intensity={coolDirectionalIntensity} color="#dbeafe" />
                <directionalLight position={[0, -1.5, 5]} intensity={rimDirectionalIntensity} color="#f8fafc" />
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
                    <Bounds clip margin={1.18}>
                        <SceneController
                            controlsRef={controlsRef}
                            onRegisterApi={(api) => {
                                viewerApiRef.current = api;
                            }}
                        />
                        {modelExtension ? (
                            <LoadedAsset
                                key={`${modelExtension}:${safeUrl}`}
                                url={safeUrl}
                                extension={modelExtension}
                                inspectionMode={inspectionMode}
                                inspectionTint={inspectionTint}
                                shadingMode={shadingMode}
                                pbrEnabled={pbrEnabled}
                                unlitEnabled={unlitEnabled}
                                previewMetalness={previewMetalness}
                                previewRoughness={previewRoughness}
                                onReady={handleAssetReady}
                                onError={handleAssetError}
                            />
                        ) : null}
                    </Bounds>
                    <ContactShadows
                        position={[0, -1.6, 0]}
                        opacity={inspectionMode === "material" ? 0.2 : inspectionMode === "toon" ? 0.12 : inspectionMode === "solid" ? 0.14 : 0.08}
                        scale={18}
                        blur={2.6}
                        far={6}
                        resolution={512}
                        color="#000000"
                        frames={1}
                    />
                </ViewerErrorBoundary>
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
