import { NextResponse } from "next/server"
import { getMcpConfig } from "@/lib/mcp"
import { checkMcpConnection, getLocalAssetLibraryStatus } from "@/lib/mcp/client"

export async function GET() {
  try {
    const config = getMcpConfig()
    const [status, localAssets] = await Promise.all([
      checkMcpConnection(),
      getLocalAssetLibraryStatus(),
    ])

    return NextResponse.json({
      config,
      status,
      localAssets,
    })
  } catch (error) {
    console.error("MCP status check failed:", error)
    return NextResponse.json(
      {
        error: "Unable to read MCP configuration",
      },
      { status: 500 }
    )
  }
}
