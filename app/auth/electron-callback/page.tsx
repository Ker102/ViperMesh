"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

// Electron's local auth callback server port
const ELECTRON_CALLBACK_PORT = 45678

/**
 * Electron OAuth Callback Page
 * 
 * This page receives tokens from the server-side API route and redirects
 * to Electron's local HTTP callback server to pass them back.
 * This is more reliable than custom protocol handlers on Linux.
 */
function ElectronCallbackContent() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("Processing authentication...")
    const processedRef = useRef(false)

    useEffect(() => {
        // Prevent duplicate execution
        if (processedRef.current) return
        processedRef.current = true

        function handleCallback() {
            // Check for success with tokens (from API route)
            const success = searchParams.get("success")
            const accessToken = searchParams.get("access_token")
            const refreshToken = searchParams.get("refresh_token")

            // Check for errors
            const error = searchParams.get("error")
            const errorDescription = searchParams.get("error_description")

            if (error) {
                setStatus("error")
                setMessage(errorDescription || error || "Authentication failed")
                return
            }

            if (success && accessToken) {
                // Success! We have tokens from the API route
                setStatus("success")
                setMessage("Authentication successful! Returning to ModelForge...")

                // Redirect to Electron's local HTTP callback server
                // This is more reliable than custom protocol handlers on Linux
                const electronCallbackUrl = new URL(`http://127.0.0.1:${ELECTRON_CALLBACK_PORT}/auth/callback`)
                electronCallbackUrl.searchParams.set("access_token", accessToken)
                if (refreshToken) {
                    electronCallbackUrl.searchParams.set("refresh_token", refreshToken)
                }

                // Small delay to show success message, then redirect to Electron's local server
                setTimeout(() => {
                    window.location.href = electronCallbackUrl.toString()
                }, 1000)
                return
            }

            // No tokens and no error - something went wrong
            setStatus("error")
            setMessage("No authentication data received. Please try again.")
        }

        handleCallback()
    }, [searchParams])

    // Fallback function to manually redirect
    function tryFallbackRedirect() {
        const accessToken = searchParams.get("access_token")
        const refreshToken = searchParams.get("refresh_token")

        if (accessToken) {
            const electronCallbackUrl = new URL(`http://127.0.0.1:${ELECTRON_CALLBACK_PORT}/auth/callback`)
            electronCallbackUrl.searchParams.set("access_token", accessToken)
            if (refreshToken) {
                electronCallbackUrl.searchParams.set("refresh_token", refreshToken)
            }
            window.location.href = electronCallbackUrl.toString()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
                {/* Logo */}
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">M</span>
                    </div>
                    <h1 className="mt-4 text-xl font-semibold text-white">ModelForge</h1>
                </div>

                {/* Status */}
                <div className="space-y-4">
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                            <p className="text-slate-300">{message}</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                            <p className="text-green-400 font-medium">{message}</p>
                            <p className="text-sm text-slate-400">
                                If the app doesn&apos;t open automatically,{" "}
                                <button
                                    onClick={tryFallbackRedirect}
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    click here
                                </button>
                            </p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <XCircle className="w-12 h-12 mx-auto text-red-500" />
                            <p className="text-red-400 font-medium">Authentication Failed</p>
                            <p className="text-sm text-slate-400">{message}</p>
                            <button
                                onClick={() => window.close()}
                                className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                Close Window
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ElectronCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        }>
            <ElectronCallbackContent />
        </Suspense>
    )
}
