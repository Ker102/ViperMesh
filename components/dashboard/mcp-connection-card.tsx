"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plug, PlugZap, RefreshCcw, Terminal } from "lucide-react"

interface ConnectionStatus {
  connected: boolean
  error?: string
}

interface CommandResult {
  status: "idle" | "pending" | "success" | "error"
  message?: string
  raw?: unknown
}

interface McpConnectionCardProps {
  host: string
  port: number
  initialStatus: ConnectionStatus
}

export function McpConnectionCard({ host, port, initialStatus }: McpConnectionCardProps) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus)
  const [isChecking, setIsChecking] = useState(false)
  const [commandResult, setCommandResult] = useState<CommandResult>({ status: "idle" })

  const connectionBadge = useMemo(() => {
    if (status.connected) {
      return (
        <Badge variant="outline" className="gap-1 border-green-500/40 text-green-500">
          <PlugZap className="h-3 w-3" />
          Connected
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="gap-1 border-red-500/40 text-red-500">
        <Plug className="h-3 w-3" />
        Disconnected
      </Badge>
    )
  }, [status.connected])

  const fetchStatus = useCallback(async () => {
    setIsChecking(true)
    setCommandResult((prev) => (prev.status === "pending" ? prev : prev))
    try {
      const response = await fetch("/api/mcp/status", {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }
      const data = await response.json()
      setStatus(data.status ?? { connected: false, error: "Unknown status" })
    } catch (error) {
      setStatus({
        connected: false,
        error: error instanceof Error ? error.message : "Unable to reach status endpoint",
      })
    } finally {
      setIsChecking(false)
    }
  }, [])

  const sendTestCommand = useCallback(async () => {
    setCommandResult({ status: "pending" })
    try {
      const response = await fetch("/api/mcp/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "context_summary",
          params: {
            info: "ping-from-web-ui",
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? `Command failed with status ${response.status}`)
      }

      const data = await response.json()
      setCommandResult({
        status: "success",
        message: data.response?.message ?? "Command executed successfully",
        raw: data.response,
      })
      await fetchStatus()
    } catch (error) {
      setCommandResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to execute MCP command. Is Blender running?",
      })
    }
  }, [fetchStatus])

  useEffect(() => {
    // refresh status on mount in case server state changed
    fetchStatus()
  }, [fetchStatus])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>MCP Connection</CardTitle>
          <CardDescription>
            Bridge between ViperMesh and Blender for live scene control. Start the Blender addon to connect.
          </CardDescription>
        </div>
        {connectionBadge}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Host</span>
            <span className="font-medium">{host}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Port</span>
            <span className="font-medium">{port}</span>
          </div>
          {!status.connected && (
            <div className="space-y-2">
              {status.error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {status.error}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Make sure Blender is running with the ViperMesh addon enabled and connected. In Blender, press <strong>N</strong> → <strong>ViperMesh</strong> tab → <strong>&quot;Connect to ViperMesh&quot;</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={isChecking}>
            {isChecking ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={sendTestCommand}
            disabled={commandResult.status === "pending"}
          >
            {commandResult.status === "pending" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Terminal className="h-3.5 w-3.5" />
                Send test command
              </>
            )}
          </Button>
        </div>

        {commandResult.status !== "idle" && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${commandResult.status === "success" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-500" : commandResult.status === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-muted/40 text-muted-foreground"}`}
          >
            {commandResult.message ??
              (commandResult.status === "success"
                ? "Command executed successfully."
                : "Command pending…")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
