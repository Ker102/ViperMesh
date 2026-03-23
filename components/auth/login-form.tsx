"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type LoginFormProps = {
  initialErrorCode?: string
  callbackUrl?: string
}

export function LoginForm({ initialErrorCode, callbackUrl }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialErrorCode || null)

  // Detect if running in Electron
  const isElectron = typeof window !== "undefined" && window.navigator.userAgent.includes("Electron")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const targetUrl = callbackUrl ?? "/dashboard"

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push(targetUrl)
        router.refresh()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError(null)
    setIsOAuthLoading(true)
    try {
      const targetUrl = callbackUrl ?? "/dashboard"

      if (isElectron && window.vipermesh?.openExternal) {
        // For Electron: Open the browser with start-oauth page using shell.openExternal
        // This opens the REAL system browser (not an Electron window)
        // The browser will handle the entire OAuth flow and deep link back
        const startOAuthUrl = `${window.location.origin}/auth/start-oauth?provider=google`
        const result = await window.vipermesh.openExternal(startOAuthUrl)

        if (!result.success) {
          setError("Failed to open browser for authentication")
          setIsOAuthLoading(false)
        }
        // Keep loading state - user will return via deep link
        // The ElectronAuthListener component will handle the session
        return
      }

      // For regular browser: use standard OAuth flow
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetUrl)}`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setIsOAuthLoading(false)
      }
      // If no error, browser will redirect to Google
    } catch (err) {
      console.error(err)
      setError("Failed to sign in with Google. Please try again.")
      setIsOAuthLoading(false)
    }
  }

  function cancelOAuth() {
    setIsOAuthLoading(false)
    setError(null)
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <Button disabled={isLoading || isOAuthLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in with email"
            )}
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isOAuthLoading || isLoading}
      >
        {isOAuthLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
          >
            <path
              fill="#EA4335"
              d="M12 10.2v3.6h5.1c-.2 1.1-.9 2.5-2.1 3.5l3.2 2.5c1.9-1.8 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z"
            />
            <path
              fill="#34A853"
              d="M5.9 14.1c-.3-.9-.5-1.9-.5-3s.2-2.1.5-3l-3.3-2.6C1.4 7 1 8.9 1 11.1c0 2.1.4 4.1 1.6 5.7l3.3-2.7z"
            />
            <path
              fill="#4A90E2"
              d="M12 21c2.7 0 5-1 6.6-2.7l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4L3.1 16c1.3 2.6 4 5 8.9 5z"
            />
            <path
              fill="#FBBC05"
              d="M12 4.6c1.5 0 2.9.5 4 1.4L19 2.9C17.5 1.5 15.1 1 12 1 7 1 4.3 3.4 3.1 6.2l3.5 2.8c.8-2.3 3-4.4 5.4-4.4z"
            />
          </svg>
        )}
        {isOAuthLoading ? "Waiting for authentication..." : "Continue with Google"}
      </Button>

      {/* Cancel button shown during OAuth loading */}
      {isOAuthLoading && isElectron && (
        <Button
          type="button"
          variant="ghost"
          onClick={cancelOAuth}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
      )}
    </div>
  )
}
