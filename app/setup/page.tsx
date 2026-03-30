"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

interface SetupStep {
    step: number
    title: string
    description: string
    action?: "open-folder"
}

interface ManagedAssetConfig {
    libraryRoot: string
    catalogPath: string
    cacheRoot: string
    catalogExists: boolean
    assetCount: number
    usingEnvCatalogOverride: boolean
    usingEnvLibraryRootOverride: boolean
    usingEnvCacheOverride: boolean
}

const SETUP_STEPS: SetupStep[] = [
    {
        step: 1,
        title: "Download the Addon",
        description: "Click the button below to open the folder containing the ViperMesh Blender addon.",
        action: "open-folder",
    },
    {
        step: 2,
        title: "Open Blender Preferences",
        description: "In Blender, go to Edit → Preferences → Add-ons",
    },
    {
        step: 3,
        title: "Install the Addon",
        description: "Click 'Install...' and select 'vipermesh-addon.py' from the folder that opened.",
    },
    {
        step: 4,
        title: "Enable the Addon",
        description: "Search for 'ViperMesh' and check the box next to 'Interface: ViperMesh Blender'",
    },
    {
        step: 5,
        title: "Connect to ViperMesh",
        description: "In Blender's 3D View, press N to open the sidebar, then click the 'ViperMesh' tab and hit 'Connect to ViperMesh'",
    },
]

function subscribeToDesktopBridge() {
    return () => {}
}

export default function SetupPage() {
    const [addonPath, setAddonPath] = useState<string>("")
    const [platform, setPlatform] = useState<string>("unknown")
    const [folderOpened, setFolderOpened] = useState(false)
    const [managedAssetFolderOpened, setManagedAssetFolderOpened] = useState(false)
    const [managedAssets, setManagedAssets] = useState<ManagedAssetConfig | null>(null)
    const isDesktop = useSyncExternalStore(
        subscribeToDesktopBridge,
        () => Boolean(window.vipermesh),
        () => false,
    )

    useEffect(() => {
        if (!isDesktop || !window.vipermesh) return

        let cancelled = false

        void Promise.all([
            window.vipermesh.getAddonPath(),
            window.vipermesh.getAppInfo(),
            window.vipermesh.getManagedAssetConfig(),
        ]).then(([addonResult, info, managedAssetConfig]) => {
            if (cancelled) return
            setAddonPath(addonResult.path)
            setPlatform(info.platform)
            setManagedAssets(managedAssetConfig)
        })

        return () => {
            cancelled = true
        }
    }, [isDesktop])

    const handleOpenFolder = async () => {
        if (window.vipermesh) {
            await window.vipermesh.openAddonFolder()
            setFolderOpened(true)
        }
    }

    const handleOpenManagedAssetFolder = async () => {
        if (window.vipermesh) {
            await window.vipermesh.openManagedAssetFolder()
            setManagedAssetFolderOpened(true)
        }
    }

    const getPlatformName = () => {
        switch (platform) {
            case "win32":
                return "Windows"
            case "darwin":
                return "macOS"
            case "linux":
                return "Linux"
            default:
                return "your operating system"
        }
    }

    return (
        <div className="min-h-screen bg-white text-black p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Blender Addon Setup</h1>
                    <p className="text-gray-600">
                        Follow these steps to connect Blender to ViperMesh.
                    </p>
                </div>

                {/* Platform info */}
                {isDesktop && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">●</span>
                            <span className="font-medium">Running on {getPlatformName()}</span>
                        </div>
                        {addonPath && (
                            <p className="text-sm text-gray-500 mt-2 font-mono break-all">
                                Addon location: {addonPath}
                            </p>
                        )}
                    </div>
                )}

                {isDesktop && managedAssets && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-black font-medium">Managed ViperMesh Assets</span>
                            <span className="text-sm text-gray-500">
                                {managedAssets.assetCount} curated assets indexed
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                            The desktop app now creates a default managed asset library automatically. In Blender, you can keep the managed defaults or override them with your own catalog and library root.
                        </p>
                        <div className="space-y-2 text-sm">
                            <p className="text-gray-500">
                                Library root:
                                <span className="block font-mono text-gray-700 break-all mt-1">
                                    {managedAssets.libraryRoot}
                                </span>
                            </p>
                            <p className="text-gray-500">
                                Catalog JSON:
                                <span className="block font-mono text-gray-700 break-all mt-1">
                                    {managedAssets.catalogPath}
                                </span>
                            </p>
                            <p className="text-gray-500">
                                Reserved cache root:
                                <span className="block font-mono text-gray-700 break-all mt-1">
                                    {managedAssets.cacheRoot}
                                </span>
                            </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                onClick={handleOpenManagedAssetFolder}
                                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {managedAssetFolderOpened ? "✓ Asset Folder Opened" : "Open Managed Asset Folder"}
                            </button>
                            {(managedAssets.usingEnvCatalogOverride || managedAssets.usingEnvLibraryRootOverride) && (
                                <p className="text-xs text-gray-500 self-center">
                                    Managed asset defaults are currently overridden by environment variables.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Web notice */}
                {!isDesktop && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <p className="text-yellow-800">
                            ⚠️ You&apos;re viewing this in a browser. For the best experience, open this page in the ViperMesh desktop app.
                        </p>
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-6">
                    {SETUP_STEPS.map((step) => (
                        <div
                            key={step.step}
                            className="border border-gray-200 rounded-lg p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                    {step.step}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                                    <p className="text-gray-600 mb-3">{step.description}</p>

                                    {step.action === "open-folder" && isDesktop && (
                                        <button
                                            onClick={handleOpenFolder}
                                            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            {folderOpened ? "✓ Folder Opened" : "Open Addon Folder"}
                                        </button>
                                    )}

                                    {step.action === "open-folder" && !isDesktop && (
                                        <p className="text-sm text-gray-500 italic">
                                            (Available in desktop app)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Success message */}
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-green-800 mb-2">🎉 You&apos;re all set!</h3>
                    <p className="text-green-700">
                        Once connected, ViperMesh can communicate with Blender to help you create, modify, and enhance your 3D projects.
                    </p>
                </div>

                {/* Back link */}
                <div className="mt-8">
                    <a href="/dashboard" className="text-gray-600 hover:text-black underline">
                        ← Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
    )
}
