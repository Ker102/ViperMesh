"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

/**
 * OAuth Start Page for Electron
 * 
 * This page is opened by Electron in the system browser to START the OAuth flow.
 * It uses Supabase's signInWithOAuth which properly sets up PKCE and state parameters.
 * The callback goes to a server-side API route that can exchange the code.
 */
function StartOAuthContent() {
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function startOAuth() {
            const provider = searchParams.get("provider") as "google" | null

            if (!provider) {
                setError("No provider specified")
                return
            }

            const supabase = createClient()

            // Start OAuth flow with proper PKCE - redirect to server-side API route
            // The API route will exchange the code and redirect to the callback page with tokens
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    // Redirect to server-side API route that handles code exchange
                    redirectTo: `${window.location.origin}/api/auth/electron-callback`,
                },
            })

            if (oauthError) {
                setError(oauthError.message)
            }
            // If no error, browser will redirect to OAuth provider
        }

        startOAuth()
    }, [searchParams])

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

                {error ? (
                    <div className="text-red-400">
                        <p>Error: {error}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                        <p className="text-slate-300">Redirecting to sign in...</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function StartOAuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        }>
            <StartOAuthContent />
        </Suspense>
    )
}
