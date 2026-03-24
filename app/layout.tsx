import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ElectronAuthListener } from "@/components/auth/electron-auth-listener"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ViperMesh - AI-Powered Blender Assistant",
  description: "Transform your 3D workflow with AI-powered Blender automation. Create, modify, and enhance your Blender projects through natural conversation.",
  keywords: ["Blender", "AI", "3D modeling", "automation", "MCP", "machine learning"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ElectronAuthListener />
        {children}
      </body>
    </html>
  )
}


