'use client'

import { useMemo, useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ProviderOption = "ollama" | "lmstudio" | ""

interface LocalLlmSettingsCardProps {
  subscriptionTier: string
  initialConfig: {
    provider: ProviderOption
    baseUrl: string
    model: string
    apiKeyConfigured: boolean
  }
}

const PROVIDER_DEFAULTS: Record<Exclude<ProviderOption, "">, string> = {
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234",
}

export function LocalLlmSettingsCard({
  subscriptionTier,
  initialConfig,
}: LocalLlmSettingsCardProps) {
  const [provider, setProvider] = useState<ProviderOption>(initialConfig.provider ?? "")
  const [baseUrl, setBaseUrl] = useState<string>(initialConfig.baseUrl ?? "")
  const [model, setModel] = useState<string>(initialConfig.model ?? "")
  const [apiKey, setApiKey] = useState<string>("")
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(initialConfig.apiKeyConfigured)
  const [status, setStatus] = useState<{ message: string; tone: "success" | "error" } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const requiresLocal = useMemo(() => subscriptionTier === "free", [subscriptionTier])
  const canTest = provider !== "" && baseUrl.trim().length > 0

  const resetStatus = () => setStatus(null)

  const handleProviderChange = (value: ProviderOption) => {
    setProvider(value)
    resetStatus()
    if (value && baseUrl.trim().length === 0) {
      setBaseUrl(PROVIDER_DEFAULTS[value])
    }
    if (value !== "lmstudio") {
      setApiKey("")
    }
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetStatus()

    if (provider && baseUrl.trim().length === 0) {
      setStatus({ message: "Base URL is required when a provider is selected.", tone: "error" })
      return
    }

    if (provider && model.trim().length === 0) {
      setStatus({ message: "Model name is required when a provider is selected.", tone: "error" })
      return
    }

    const payload: Record<string, unknown> = {}
    if (provider) {
      payload.provider = provider
      payload.baseUrl = baseUrl.trim()
      payload.model = model.trim()
      payload.apiKey = apiKey.trim().length > 0 ? apiKey.trim() : null
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/user/local-llm", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>

        if (!response.ok) {
          const message =
            typeof data.error === "string"
              ? data.error
              : "Failed to update local LLM settings."
          setStatus({ message, tone: "error" })
          return
        }

        setStatus({ message: "Local LLM settings saved.", tone: "success" })
        setApiKey("")
        if (provider) {
          setApiKeyConfigured(Boolean(payload.apiKey ?? apiKeyConfigured))
        } else {
          setProvider("")
          setBaseUrl("")
          setModel("")
          setApiKeyConfigured(false)
        }
      } catch (error) {
        console.error("Local LLM update failed:", error)
        setStatus({
          message: "Unexpected error while saving local LLM settings.",
          tone: "error",
        })
      }
    })
  }

  const handleClear = async () => {
    resetStatus()
    startTransition(async () => {
      try {
        const response = await fetch("/api/user/local-llm", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
          const message =
            typeof data.error === "string"
              ? data.error
              : "Failed to clear local LLM settings."
          setStatus({ message, tone: "error" })
          return
        }

        setProvider("")
        setBaseUrl("")
        setModel("")
        setApiKey("")
        setApiKeyConfigured(false)
        setStatus({ message: "Local LLM settings cleared.", tone: "success" })
      } catch (error) {
        console.error("Local LLM clear failed:", error)
        setStatus({
          message: "Unexpected error while clearing local LLM settings.",
          tone: "error",
        })
      }
    })
  }

  const handleTestConnection = async () => {
    resetStatus()
    if (!canTest) {
      setStatus({
        message: "Select a provider and enter a base URL before testing.",
        tone: "error",
      })
      return
    }

    setIsTesting(true)

    try {
      const response = await fetch("/api/user/local-llm/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          baseUrl: baseUrl.trim(),
          model: model.trim() || "test-model",
          apiKey: apiKey.trim().length > 0 ? apiKey.trim() : undefined,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Connection test failed."
        setStatus({ message, tone: "error" })
        return
      }

      setStatus({
        message: "Connection successful. The provider responded as expected.",
        tone: "success",
      })
    } catch (error) {
      console.error("Local LLM test failed:", error)
      setStatus({
        message: "Unexpected error while testing the connection.",
        tone: "error",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Local LLM Configuration</CardTitle>
        <CardDescription>
          Connect ViperMesh to a locally hosted model (Ollama or LM Studio). Free-tier
          accounts must configure a local provider before prompting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Active subscription: <span className="font-medium">{subscriptionTier}</span>
          </span>
          {requiresLocal ? (
            <Badge variant="secondary">Required</Badge>
          ) : (
            <Badge variant="outline">Optional</Badge>
          )}
        </div>

        {requiresLocal && (
          <div className="rounded-md border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
            Free plan reminder: configure a local model before chatting. We recommend Ollama with the
            `llama3.1` or `phi3` families for fast experimentation. LM Studio works as an
            OpenAI-compatible alternative if you prefer a GUI.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="local-llm-provider">Provider</Label>
              <select
                id="local-llm-provider"
                value={provider}
                onChange={(event) => handleProviderChange(event.target.value as ProviderOption)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Disabled (use hosted Gemini)</option>
                <option value="ollama">Ollama (http://localhost:11434)</option>
                <option value="lmstudio">LM Studio (OpenAI compatible)</option>
              </select>
            </div>

            {provider && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="local-llm-baseUrl">Base URL</Label>
                  <Input
                    id="local-llm-baseUrl"
                    value={baseUrl}
                    onChange={(event) => {
                      setBaseUrl(event.target.value)
                      resetStatus()
                    }}
                    placeholder={
                      provider === "ollama"
                        ? PROVIDER_DEFAULTS.ollama
                        : PROVIDER_DEFAULTS.lmstudio
                    }
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="local-llm-model">Model</Label>
                  <Input
                    id="local-llm-model"
                    value={model}
                    onChange={(event) => {
                      setModel(event.target.value)
                      resetStatus()
                    }}
                    placeholder={
                      provider === "ollama" ? "e.g. llama3.1" : "e.g. Meta-Llama-3-8B-Instruct"
                    }
                    autoComplete="off"
                  />
                </div>
              </>
            )}

            {provider === "lmstudio" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="local-llm-apiKey">API Key (optional)</Label>
                  {apiKeyConfigured && <Badge variant="outline">Stored</Badge>}
                </div>
                <Input
                  id="local-llm-apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value)
                    resetStatus()
                  }}
                  placeholder={
                    apiKeyConfigured
                      ? "•••••••• (enter a new key to replace)"
                      : "Enter key if LM Studio auth is enabled"
                  }
                  autoComplete="off"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save configuration"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canTest || isTesting || isPending}
              onClick={handleTestConnection}
            >
              {isTesting ? "Testing..." : "Test connection"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={handleClear}
            >
              Reset
            </Button>
          </div>

          {status && (
            <p
              className={cn(
                "text-sm",
                status.tone === "success" ? "text-emerald-600" : "text-destructive"
              )}
            >
              {status.message}
            </p>
          )}
        </form>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Quick tips</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ollama: run <code>ollama serve</code> then pull a model with <code>ollama pull llama3.1</code>.</li>
            <li>LM Studio: enable the OpenAI-compatible server and copy the base URL from the UI.</li>
            <li>Keep ViperMesh and your provider on the same machine; remote URLs may reject CORS or require tunnels.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
