"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, Settings, FolderOpen } from "lucide-react"
import { AnimatedLogo } from "@/components/ui/animated-logo"
import { createClient } from "@/lib/supabase/client"

interface DashboardNavProps {
  user?: {
    email?: string | null
    subscriptionTier?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const subscriptionTier = (user?.subscriptionTier || "free").toLowerCase()
  const email = user?.email ?? "Unknown user"
  const searchString = searchParams.toString()
  const currentLocation = searchString ? `${pathname}?${searchString}` : pathname
  const upgradeHref = `/dashboard/settings?section=plans&from=${encodeURIComponent(currentLocation)}#plans`

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <AnimatedLogo size={32} />
            <span className="text-2xl font-bold">ViperMesh</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                Projects
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button
                variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {subscriptionTier}
            </Badge>
            {subscriptionTier === "free" && (
              <Button asChild size="sm" variant="outline">
                <Link href={upgradeHref}>Upgrade</Link>
              </Button>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}
