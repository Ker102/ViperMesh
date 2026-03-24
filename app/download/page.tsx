import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Apple, Monitor } from "lucide-react"

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Download ViperMesh</h1>
            <p className="text-xl text-muted-foreground">
              Get the desktop app to start using AI with Blender
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 mb-2" />
                <CardTitle>Windows</CardTitle>
                <CardDescription>Windows 10 or later</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" disabled>
                  <Download className="h-4 w-4" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Apple className="h-8 w-8 mb-2" />
                <CardTitle>macOS</CardTitle>
                <CardDescription>macOS 11 or later</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" disabled>
                  <Download className="h-4 w-4" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 mb-2" />
                <CardTitle>Linux</CardTitle>
                <CardDescription>Ubuntu 20.04+, Fedora 35+</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" disabled>
                  <Download className="h-4 w-4" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Installation Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Install Blender MCP Server</h3>
                <p className="text-sm text-muted-foreground">
                  First, install the Blender MCP server plugin in your Blender installation.
                  This enables communication between ViperMesh and Blender.
                </p>
                <Button variant="link" className="px-0 mt-2">
                  View MCP Server Setup Guide →
                </Button>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 2: Download Desktop App</h3>
                <p className="text-sm text-muted-foreground">
                  Download and install the ViperMesh desktop application for your operating system.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 3: Connect & Create</h3>
                <p className="text-sm text-muted-foreground">
                  Launch both Blender (with MCP server running) and the ViperMesh app.
                  Sign in and start creating!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need help? Check out our{" "}
              <a href="/docs" className="text-primary hover:underline">
                documentation
              </a>{" "}
              or contact support.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

