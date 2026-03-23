"use client"

import { useState, useEffect } from "react"

interface SetupStep {
    step: number
    title: string
    description: string
    action?: "open-folder"
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
        description: "Click 'Install...' and select 'modelforge-addon.py' from the folder that opened.",
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

export default function SetupPage() {
    const [addonPath, setAddonPath] = useState<string>("")
    const [platform, setPlatform] = useState<string>("unknown")
    const [isDesktop, setIsDesktop] = useState(false)
    const [folderOpened, setFolderOpened] = useState(false)

    useEffect(() => {
        // Check if running in Electron (desktop app)
        if (typeof window !== "undefined" && window.modelforge) {
            setIsDesktop(true)

            window.modelforge.getAddonPath().then((result) => {
                setAddonPath(result.path)
            })

            window.modelforge.getAppInfo().then((info) => {
                setPlatform(info.platform)
            })
        }
    }, [])

    const handleOpenFolder = async () => {
        if (window.modelforge) {
            await window.modelforge.openAddonFolder()
            setFolderOpened(true)
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

                {/* Web notice */}
                {!isDesktop && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <p className="text-yellow-800">
                            ⚠️ You're viewing this in a browser. For the best experience, open this page in the ViperMesh desktop app.
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
                    <h3 className="font-semibold text-green-800 mb-2">🎉 You're all set!</h3>
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
