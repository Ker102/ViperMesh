/**
 * Global type definitions for ViperMesh Electron IPC
 */

export interface ViperMeshElectronAPI {
    // MCP Configuration
    getMcpConfig: () => Promise<{ host: string; port: number }>

    // App Info
    getAppInfo: () => Promise<{
        version: string
        platform: string
        arch: string
        isDev: boolean
    }>

    // Addon Management
    getAddonPath: () => Promise<{ path: string; exists: boolean }>
    openAddonFolder: () => Promise<{ opened: boolean; path: string }>
    getManagedAssetConfig: () => Promise<{
        libraryRoot: string
        catalogPath: string
        cacheRoot: string
        catalogExists: boolean
        assetCount: number
        usingEnvCatalogOverride: boolean
        usingEnvLibraryRootOverride: boolean
        usingEnvCacheOverride: boolean
    }>
    openManagedAssetFolder: () => Promise<{ opened: boolean; path: string }>

    // Open URL in system browser (not Electron window)
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>

    // Auth - Listen for OAuth tokens from deep link
    onAuthToken: (
        callback: (tokens: { accessToken: string; refreshToken: string }) => void
    ) => void
}

declare global {
    interface Window {
        vipermesh?: ViperMeshElectronAPI
    }
}

export { }
