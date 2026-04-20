const path = require("node:path")
const http = require("node:http")
const fs = require("node:fs")
const { spawn } = require("node:child_process")
const { app, BrowserWindow, ipcMain, nativeTheme, dialog, shell } = require("electron")

// Configuration
const DEFAULT_PORT = 3000
const AUTH_CALLBACK_PORT = 45678 // Local port for OAuth callback
const IS_DEV = process.env.VIPERMESH_DESKTOP_ENV === "development"
const PROTOCOL = "vipermesh"
const MANAGED_ASSET_LIBRARY_NAME = "ViperMeshAssets"
const MANAGED_ASSET_DIRECTORIES = [
  "catalog",
  "cache",
  "cache/downloads",
  "incoming/blenderkit",
  "incoming/polyhaven",
  "incoming/private",
  "incoming/marketplace",
  "previews",
  "props/footwear/ankle-boots",
  "props/footwear/sneakers",
  "props/plants/olive-branches",
  "props/plants/indoor-potted",
  "props/baskets/woven",
  "props/lamps/table-lamps",
  "props/books/stacks",
  "props/decor/vases",
  "props/decor/mirrors",
  "furniture/console-tables",
  "furniture/chairs",
  "furniture/stools",
  "materials/wood",
  "materials/fabric",
  "materials/ceramic",
  "hdris/interior",
  "hdris/studio",
]

function resolveManagedAssetLibraryRoot() {
  const envRoot = process.env.VIPERMESH_LOCAL_ASSET_LIBRARY_ROOT?.trim()
  if (envRoot) {
    return path.resolve(envRoot)
  }

  return path.join(app.getPath("documents"), MANAGED_ASSET_LIBRARY_NAME)
}

function resolveManagedAssetCatalogPath(libraryRoot = resolveManagedAssetLibraryRoot()) {
  const envCatalog = process.env.VIPERMESH_LOCAL_ASSET_CATALOG?.trim()
  if (envCatalog) {
    return path.resolve(envCatalog)
  }

  return path.join(libraryRoot, "catalog", "assets.json")
}

function resolveManagedAssetCacheRoot(libraryRoot = resolveManagedAssetLibraryRoot()) {
  const envCache = process.env.VIPERMESH_LOCAL_ASSET_CACHE_ROOT?.trim()
  if (envCache) {
    return path.resolve(envCache)
  }

  return path.join(libraryRoot, "cache")
}

function readManagedCatalogAssetCount(catalogPath) {
  if (!fs.existsSync(catalogPath)) {
    return 0
  }

  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"))
    return Array.isArray(catalog.assets) ? catalog.assets.length : 0
  } catch (error) {
    console.warn("[Desktop] Failed to read managed asset catalog:", error)
    return 0
  }
}

function buildEmptyManagedCatalog(libraryRoot) {
  return `${JSON.stringify({
    version: 1,
    generated_at: new Date().toISOString(),
    library_root: libraryRoot,
    assets: [],
  }, null, 2)}\n`
}

function ensureManagedAssetDefaults() {
  const libraryRoot = resolveManagedAssetLibraryRoot()
  const catalogPath = resolveManagedAssetCatalogPath(libraryRoot)
  const cacheRoot = resolveManagedAssetCacheRoot(libraryRoot)

  fs.mkdirSync(libraryRoot, { recursive: true })

  for (const relativeDir of MANAGED_ASSET_DIRECTORIES) {
    fs.mkdirSync(path.join(libraryRoot, relativeDir), { recursive: true })
  }

  fs.mkdirSync(path.dirname(catalogPath), { recursive: true })
  fs.mkdirSync(cacheRoot, { recursive: true })

  if (!fs.existsSync(catalogPath)) {
    fs.writeFileSync(catalogPath, buildEmptyManagedCatalog(libraryRoot), "utf-8")
  }

  return {
    libraryRoot,
    catalogPath,
    cacheRoot,
    catalogExists: fs.existsSync(catalogPath),
    assetCount: readManagedCatalogAssetCount(catalogPath),
    usingEnvCatalogOverride: Boolean(process.env.VIPERMESH_LOCAL_ASSET_CATALOG?.trim()),
    usingEnvLibraryRootOverride: Boolean(process.env.VIPERMESH_LOCAL_ASSET_LIBRARY_ROOT?.trim()),
    usingEnvCacheOverride: Boolean(process.env.VIPERMESH_LOCAL_ASSET_CACHE_ROOT?.trim()),
  }
}

// Register deep link protocol (for OAuth callback)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL)
}

let mainWindow = null
let serverProcess = null
let serverReady = false
let pendingDeepLink = null
let authCallbackServer = null

/**
 * Get the URL to load in the renderer
 */
function getStartUrl() {
  const customUrl = process.env.VIPERMESH_DESKTOP_START_URL?.trim()
  if (customUrl) return customUrl

  const port = process.env.PORT || DEFAULT_PORT
  return `http://127.0.0.1:${port}/dashboard`
}

/**
 * Start the bundled Next.js server (production mode)
 */
function startBundledServer() {
  return new Promise((resolve, reject) => {
    if (IS_DEV) {
      // In dev mode, assume Next.js is running externally
      console.log("[Desktop] Development mode - expecting external Next.js server")
      serverReady = true
      resolve()
      return
    }

    // In production, start the bundled server
    const serverPath = path.join(process.resourcesPath, "server")
    const serverScript = path.join(serverPath, "server.js")

    console.log("[Desktop] Starting bundled server from:", serverPath)

    try {
      serverProcess = spawn(process.execPath.replace("electron", "node"), [serverScript], {
        cwd: serverPath,
        env: {
          ...process.env,
          PORT: String(DEFAULT_PORT),
          NODE_ENV: "production",
        },
        stdio: "pipe",
      })

      serverProcess.stdout.on("data", (data) => {
        const output = data.toString()
        console.log("[Server]", output)

        // Check if server is ready
        if (output.includes("Ready") || output.includes("started") || output.includes("listening")) {
          serverReady = true
          resolve()
        }
      })

      serverProcess.stderr.on("data", (data) => {
        console.error("[Server Error]", data.toString())
      })

      serverProcess.on("error", (error) => {
        console.error("[Desktop] Failed to start server:", error)
        reject(error)
      })

      serverProcess.on("exit", (code) => {
        console.log("[Desktop] Server exited with code:", code)
        serverProcess = null
      })

      // Timeout fallback
      setTimeout(() => {
        if (!serverReady) {
          serverReady = true
          resolve()
        }
      }, 5000)

    } catch (error) {
      console.error("[Desktop] Server spawn error:", error)
      reject(error)
    }
  })
}

/**
 * Get MCP configuration from environment
 */
function getMcpConfigFromEnv() {
  return {
    host: process.env.BLENDER_MCP_HOST || "127.0.0.1",
    port: Number.parseInt(process.env.BLENDER_MCP_PORT || "9876", 10),
  }
}

/**
 * Start a local HTTP server to receive OAuth callback tokens
 * This is more reliable than custom protocol handlers, especially on Linux
 */
function startAuthCallbackServer() {
  if (authCallbackServer) return // Already running

  authCallbackServer = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${AUTH_CALLBACK_PORT}`)

    if (url.pathname === "/auth/callback") {
      const accessToken = url.searchParams.get("access_token")
      const refreshToken = url.searchParams.get("refresh_token")
      const error = url.searchParams.get("error")

      // Set CORS headers to allow browser redirect
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Content-Type", "text/html")

      if (error) {
        console.log("[Desktop Auth] OAuth error:", error)
        res.writeHead(200)
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Authentication Failed - ViperMesh</title>
          </head>
          <body style="background:linear-gradient(135deg,#0a0f1a 0%,#111827 50%,#0a1628 100%);color:#f1f5f9;font-family:'Inter',system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
            <div style="text-align:center;background:rgba(15,23,42,0.6);border:1px solid rgba(239,68,68,0.2);border-radius:20px;padding:48px 40px;max-width:420px;width:90%;backdrop-filter:blur(20px);box-shadow:0 25px 50px rgba(0,0,0,0.3)">
              <div style="width:64px;height:64px;margin:0 auto 20px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(239,68,68,0.25)">
                <span style="font-size:28px;font-weight:700;color:#fff">!</span>
              </div>
              <h1 style="color:#f87171;font-size:22px;font-weight:600;margin:0 0 12px">Authentication Failed</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 8px">${error}</p>
              <p style="color:#64748b;font-size:13px;margin:0">You can close this window.</p>
            </div>
          </body>
          </html>
        `)
        return
      }

      if (accessToken) {
        console.log("[Desktop Auth] Received tokens, sending to renderer")

        // Send tokens to renderer
        if (mainWindow) {
          mainWindow.webContents.send("auth:token", { accessToken, refreshToken })
          mainWindow.focus()
        }

        res.writeHead(200)
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Authentication Successful - ViperMesh</title>
          </head>
          <body style="background:linear-gradient(135deg,#0a0f1a 0%,#111827 50%,#0a1628 100%);color:#f1f5f9;font-family:'Inter',system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
            <div style="text-align:center;background:rgba(15,23,42,0.6);border:1px solid rgba(13,148,136,0.2);border-radius:20px;padding:48px 40px;max-width:420px;width:90%;backdrop-filter:blur(20px);box-shadow:0 25px 50px rgba(0,0,0,0.3)">
              <div style="width:64px;height:64px;margin:0 auto 20px;background:linear-gradient(135deg,#0d9488,#14b8a6);border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(13,148,136,0.3)">
                <span style="font-size:28px;font-weight:700;color:#fff">V</span>
              </div>
              <h1 style="color:#2dd4bf;font-size:22px;font-weight:600;margin:0 0 12px">&#x2714; Authentication Successful!</h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 8px">You can close this window and return to ViperMesh.</p>
              <p style="color:#64748b;font-size:12px;margin:0">This window will close automatically...</p>
              <script>setTimeout(() => window.close(), 2000)</script>
            </div>
          </body>
          </html>
        `)
        return
      }

      res.writeHead(400)
      res.end("Missing tokens")
      return
    }

    res.writeHead(404)
    res.end("Not found")
  })

  authCallbackServer.listen(AUTH_CALLBACK_PORT, "127.0.0.1", () => {
    console.log(`[Desktop Auth] Local callback server listening on http://127.0.0.1:${AUTH_CALLBACK_PORT}`)
  })

  authCallbackServer.on("error", (err) => {
    console.error("[Desktop Auth] Server error:", err)
    if (err.code === "EADDRINUSE") {
      console.log("[Desktop Auth] Port already in use, assuming another instance is running")
    }
  })
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "ViperMesh",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0f172a" : "#ffffff",
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Prevent title changes from web content
  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault()
  })

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    // Open DevTools in dev mode for debugging
    if (IS_DEV) {
      mainWindow.webContents.openDevTools({ mode: "detach" })
    }
  })

  // Load the app
  const url = getStartUrl()
  console.log("[Desktop] Loading URL:", url)

  mainWindow.loadURL(url).catch((error) => {
    console.error("[Desktop] Failed to load URL:", error)

    // Show error dialog
    dialog.showErrorBox(
      "Connection Error",
      IS_DEV
        ? "Could not connect to the Next.js development server.\n\nMake sure to run 'npm run dev' in the main project directory first."
        : "Could not start the ViperMesh server.\n\nPlease try restarting the application."
    )

    // Load offline page
    mainWindow.loadFile(path.join(__dirname, "renderer", "offline.html")).catch(() => { })
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Handle external URLs (OAuth, etc.) - open in system browser
  const { shell } = require("electron")

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in system browser
    if (url.startsWith("https://") && !url.includes("127.0.0.1") && !url.includes("localhost")) {
      shell.openExternal(url)
      return { action: "deny" }
    }
    return { action: "allow" }
  })

  mainWindow.webContents.on("will-navigate", (event, url) => {
    // If navigating to OAuth provider, open in system browser
    if (url.includes("supabase.co") || url.includes("accounts.google.com")) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  return mainWindow
}

/**
 * App initialization
 */
app.on("ready", async () => {
  console.log("[Desktop] App ready, starting...")
  console.log("[Desktop] Mode:", IS_DEV ? "development" : "production")

  try {
    const managedAssets = ensureManagedAssetDefaults()
    console.log("[Desktop] Managed asset library root:", managedAssets.libraryRoot)
    console.log("[Desktop] Managed asset catalog path:", managedAssets.catalogPath)

    // Start bundled server if in production
    if (!IS_DEV) {
      await startBundledServer()
    }

    // Note: Session cookies are preserved across restarts for better dev experience.
    // If you hit auth redirect loops, manually clear via: session.defaultSession.clearStorageData()

    // Start local auth callback server (for OAuth tokens from browser)
    startAuthCallbackServer()

    createWindow()
  } catch (error) {
    console.error("[Desktop] Startup error:", error)
    dialog.showErrorBox("Startup Error", error.message)
    app.quit()
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * Handle deep links (OAuth callback)
 * Windows/Linux: second-instance event
 * macOS: open-url event
 */
function handleDeepLink(url) {
  console.log("[Desktop] Deep link received:", url)

  if (url.startsWith(`${PROTOCOL}://`)) {
    // Parse the deep link URL
    const urlObj = new URL(url)
    const params = urlObj.searchParams

    // Check if this is an auth callback
    if (urlObj.pathname === "/auth/callback" || urlObj.host === "auth") {
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && mainWindow) {
        // Send tokens to renderer to complete auth
        mainWindow.webContents.send("auth:token", { accessToken, refreshToken })
        mainWindow.focus()
      } else if (mainWindow) {
        // Navigate to callback URL in app
        const port = process.env.PORT || DEFAULT_PORT
        const callbackUrl = `http://127.0.0.1:${port}/auth/callback?${params.toString()}`
        mainWindow.loadURL(callbackUrl)
        mainWindow.focus()
      }
    }
  }
}

// Windows/Linux: Handle protocol when app is already running
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", (event, commandLine) => {
    // Find the deep link URL in command line args
    const deepLinkUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (deepLinkUrl) {
      handleDeepLink(deepLinkUrl)
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// macOS: Handle protocol
app.on("open-url", (event, url) => {
  event.preventDefault()
  if (app.isReady()) {
    handleDeepLink(url)
  } else {
    pendingDeepLink = url
  }
})

/**
 * Clean up on quit
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("before-quit", () => {
  // Kill server process if running
  if (serverProcess) {
    console.log("[Desktop] Stopping server...")
    serverProcess.kill()
    serverProcess = null
  }
})

/**
 * IPC Handlers
 */
ipcMain.handle("mcp:get-config", () => {
  return getMcpConfigFromEnv()
})

ipcMain.handle("app:get-info", () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    isDev: IS_DEV,
  }
})

ipcMain.handle("assets:get-managed-config", () => {
  return ensureManagedAssetDefaults()
})

ipcMain.handle("addon:get-path", () => {
  // In production, addon is in resources/assets
  // In dev, it's in desktop/assets
  const addonPath = IS_DEV
    ? path.join(__dirname, "assets", "vipermesh-addon.py")
    : path.join(process.resourcesPath, "assets", "vipermesh-addon.py")

  return {
    path: addonPath,
    exists: fs.existsSync(addonPath)
  }
})

ipcMain.handle("addon:open-folder", () => {
  const addonPath = IS_DEV
    ? path.join(__dirname, "assets")
    : path.join(process.resourcesPath, "assets")

  shell.openPath(addonPath)
  return { opened: true, path: addonPath }
})

ipcMain.handle("assets:open-managed-folder", () => {
  const { libraryRoot } = ensureManagedAssetDefaults()
  shell.openPath(libraryRoot)
  return { opened: true, path: libraryRoot }
})

ipcMain.handle("shell:show-item-in-folder", async (event, targetPath) => {
  try {
    if (!targetPath || typeof targetPath !== "string") {
      return { success: false, error: "Missing file path" }
    }

    if (!fs.existsSync(targetPath)) {
      return { success: false, error: "File not found" }
    }

    shell.showItemInFolder(targetPath)
    return { success: true, path: targetPath }
  } catch (error) {
    console.error("[Desktop] Failed to reveal file:", error)
    return { success: false, error: error.message }
  }
})

// Open URL in system browser (not Electron window)
ipcMain.handle("shell:open-external", async (event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error("[Desktop] Failed to open external URL:", error)
    return { success: false, error: error.message }
  }
})
