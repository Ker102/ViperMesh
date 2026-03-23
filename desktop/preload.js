const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("vipermesh", {
  // MCP Configuration
  getMcpConfig: async () => {
    return ipcRenderer.invoke("mcp:get-config")
  },

  // App Info
  getAppInfo: async () => {
    return ipcRenderer.invoke("app:get-info")
  },

  // Addon Management
  getAddonPath: async () => {
    return ipcRenderer.invoke("addon:get-path")
  },

  openAddonFolder: async () => {
    return ipcRenderer.invoke("addon:open-folder")
  },

  // Open URL in system browser (not Electron window)
  openExternal: async (url) => {
    return ipcRenderer.invoke("shell:open-external", url)
  },

  // Auth - Listen for OAuth tokens from deep link
  onAuthToken: (callback) => {
    ipcRenderer.on("auth:token", (event, tokens) => {
      callback(tokens)
    })
  },
})
