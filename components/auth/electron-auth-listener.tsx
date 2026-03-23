"use client"

import { useEffect, useRef } from "react"

/**
 * Client component that listens for auth tokens from Electron's local HTTP server.
 * Mount this in the root layout to handle OAuth callbacks.
 */
export function ElectronAuthListener() {
    const processedRef = useRef(false)

    useEffect(() => {
        // Only run in Electron
        if (typeof window === "undefined" || !window.vipermesh?.onAuthToken) {
            return
        }

        // Prevent duplicate handling
        if (processedRef.current) return

        // Listen for auth tokens from Electron's local HTTP callback server
        window.vipermesh.onAuthToken(async (tokens) => {
            if (processedRef.current) return
            processedRef.current = true

            console.log("[ElectronAuth] Received tokens from Electron")

            try {
                // Navigate to the API route that sets session AND redirects in one response
                // This ensures cookies are set before the redirect happens
                const url = new URL("/api/auth/set-session-redirect", window.location.origin)
                url.searchParams.set("access_token", tokens.accessToken)
                url.searchParams.set("refresh_token", tokens.refreshToken)
                url.searchParams.set("redirect", "/dashboard")

                console.log("[ElectronAuth] Navigating to set-session-redirect API")
                window.location.href = url.toString()
            } catch (err) {
                console.error("[ElectronAuth] Error during auth:", err)
                processedRef.current = false
            }
        })
    }, [])

    // This component doesn't render anything
    return null
}

