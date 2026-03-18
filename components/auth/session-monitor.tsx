"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * SessionMonitor — Client-side component that detects Supabase session
 * expiry and shows a banner prompting the user to re-login.
 *
 * Drop this into any layout that requires authentication.
 *
 * How it works:
 * 1. Listens to Supabase `onAuthStateChange` for SIGNED_OUT events
 * 2. Periodically probes the session (every 5 min) to catch silent expiry
 * 3. Intercepts 401 responses from API calls via a global fetch wrapper
 * 4. Shows a full-width banner when session is expired
 */
export function SessionMonitor() {
    const [expired, setExpired] = useState(false)
    const router = useRouter()

    const handleRelogin = useCallback(() => {
        router.push("/login")
    }, [router])

    useEffect(() => {
        const supabase = createClient()

        // 1. Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
                if (event === "SIGNED_OUT") {
                    setExpired(true)
                }
            }
        })

        // 2. Periodic session probe (every 5 minutes)
        const probeInterval = setInterval(async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            if (!session) {
                setExpired(true)
            }
        }, 5 * 60 * 1000) // 5 minutes

        // 3. Global fetch interceptor for 401 responses
        const originalFetch = window.fetch
        window.fetch = async (...args) => {
            const response = await originalFetch(...args)
            if (response.status === 401) {
                // Check if this is our API route (not an external request)
                const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url
                if (url && (url.startsWith("/api") || url.includes("/api/"))) {
                    setExpired(true)
                }
            }
            return response
        }

        return () => {
            subscription.unsubscribe()
            clearInterval(probeInterval)
            window.fetch = originalFetch
        }
    }, [])

    if (!expired) return null

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                color: "#fff",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                animation: "slideDown 0.3s ease-out",
            }}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Your session has expired. Please log in again to continue.</span>
            <button
                onClick={handleRelogin}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#fff",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.35)")
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                }
            >
                Log In
            </button>
            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
