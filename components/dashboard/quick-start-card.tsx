"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download } from "lucide-react"

export function QuickStartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start</CardTitle>
        <CardDescription>Get connected in three steps — no extra tools required</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <ol className="space-y-3 list-decimal list-inside">
          <li>
            <p className="font-semibold">Install Blender 3.0+</p>
            <p className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Download from <a href="https://www.blender.org/download/" target="_blank" rel="noreferrer" className="underline">blender.org</a> and follow the installer for your platform.
            </p>
          </li>
          <li>
            <p className="font-semibold">Install the ViperMesh addon in Blender</p>
            <div className="mt-2 space-y-2 text-xs text-muted-foreground">
              <p>The addon is bundled with the desktop app. You can also download it here:</p>
              <Button asChild size="sm" className="gap-2">
                <a href="/downloads/vipermesh-addon.py" download>
                  <Download className="h-3.5 w-3.5" />
                  Download addon
                </a>
              </Button>
              <p className="text-xs">In Blender: <strong>Edit → Preferences → Add-ons → Install</strong>, select the file, and enable <strong>&quot;Interface: ViperMesh Blender&quot;</strong>.</p>
            </div>
          </li>
          <li>
            <p className="font-semibold">Connect to ViperMesh</p>
            <p className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              In Blender&apos;s 3D View, press <strong>N</strong> → <strong>ViperMesh</strong> tab → <strong>&quot;Connect to ViperMesh&quot;</strong>. The MCP Connection card below should show &quot;Connected&quot;.
            </p>
          </li>
        </ol>
        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">No extra dependencies needed</p>
          <p>The addon runs inside Blender&apos;s built-in Python and talks directly to ViperMesh over a local socket. No separate Python, Git, or package manager install required.</p>
        </div>
        <Button asChild variant="secondary" size="sm" className="gap-2">
          <Link href="/docs">
            View full guide
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
