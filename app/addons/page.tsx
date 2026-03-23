import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  Sparkles,
  Box,
  Paintbrush,
  Move3d,
  FileOutput,
  Wrench,
  Cpu,
  Printer,
  Puzzle,
  Shapes,
} from "lucide-react"

// ── Addon Data ──────────────────────────────────────────────────────────────

interface RecommendedAddon {
  name: string
  description: string
  category: string
  icon: React.ReactNode
  extensionsUrl?: string
  builtIn: boolean
  aiCompatible: boolean
  aiCapability?: string
  tags: string[]
}

const CATEGORIES = [
  { id: "modeling", label: "Modeling", icon: <Box className="h-4 w-4" /> },
  { id: "shading", label: "Shading & Nodes", icon: <Paintbrush className="h-4 w-4" /> },
  { id: "rigging", label: "Rigging & Animation", icon: <Move3d className="h-4 w-4" /> },
  { id: "import-export", label: "Import / Export", icon: <FileOutput className="h-4 w-4" /> },
  { id: "utilities", label: "Utilities", icon: <Wrench className="h-4 w-4" /> },
  { id: "3d-printing", label: "3D Printing", icon: <Printer className="h-4 w-4" /> },
]

const ADDONS: RecommendedAddon[] = [
  // ── Shading & Nodes ───────────────────────────────────────────────
  {
    name: "Node Wrangler",
    description:
      "Essential shader node workflow shortcuts. Auto-connects PBR texture sets, adds viewer nodes, and speeds up node editing.",
    category: "shading",
    icon: <Paintbrush className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can auto-connect PBR textures via bpy.ops.node.nw_add_principled_setup()",
    tags: ["Nodes", "PBR", "Textures"],
  },
  // ── Rigging & Animation ───────────────────────────────────────────
  {
    name: "Rigify",
    description:
      "Professional auto-rigging toolkit. Generate production-ready rigs from simple meta-rigs with IK/FK switching, face controls, and more.",
    category: "rigging",
    icon: <Move3d className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can add meta-rigs and generate full rigs with bpy.ops.pose.rigify_generate()",
    tags: ["Rigging", "Animation", "IK/FK"],
  },
  // ── Modeling ──────────────────────────────────────────────────────
  {
    name: "LoopTools",
    description:
      "Advanced mesh editing tools: Circle, Relax, Bridge, Flatten, and Space. Essential for clean topology workflows.",
    category: "modeling",
    icon: <Shapes className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can relax vertices, circularize edge loops, and bridge edges via execute_code",
    tags: ["Mesh", "Topology", "Edge Loops"],
  },
  {
    name: "Bool Tool",
    description:
      "Quick boolean operations between objects — union, difference, intersection — without manually configuring modifiers.",
    category: "modeling",
    icon: <Puzzle className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can perform boolean operations via bpy.ops.object.booltool_auto_difference()",
    tags: ["Boolean", "Hard Surface", "CSG"],
  },
  {
    name: "F2",
    description:
      "Extended face-filling. The F key intelligently fills faces from a single vertex or edge, saving time in retopology.",
    category: "modeling",
    icon: <Box className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability: "Enhanced face-filling available in edit mode through the agent",
    tags: ["Mesh", "Retopology", "Face Fill"],
  },
  {
    name: "Extra Mesh Objects",
    description:
      "Additional procedural mesh primitives: gears, gems, rocks, mathematical surfaces, pipe joints, and more.",
    category: "modeling",
    icon: <Shapes className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can create procedural gears, gems, and stars via execute_code",
    tags: ["Procedural", "Primitives", "Gears"],
  },
  // ── Import / Export ───────────────────────────────────────────────
  {
    name: "Images as Planes",
    description:
      "Import images directly as textured plane meshes. Great for reference images, billboards, and 2D decals in 3D scenes.",
    category: "import-export",
    icon: <FileOutput className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can import reference images as planes via bpy.ops.import_image.to_plane()",
    tags: ["Import", "Images", "Textures"],
  },
  {
    name: "Extra Curve Objects",
    description:
      "Additional curve primitives: spirals, torus knots, surface profiles, and mathematical curves.",
    category: "modeling",
    icon: <Shapes className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can create spirals and torus knots via execute_code",
    tags: ["Curves", "Procedural", "Spirals"],
  },
  // ── 3D Printing ───────────────────────────────────────────────────
  {
    name: "3D-Print Toolbox",
    description:
      "Mesh analysis for 3D printing: checks for non-manifold geometry, overhangs, wall thickness, and other print-quality issues.",
    category: "3d-printing",
    icon: <Printer className="h-5 w-5" />,
    builtIn: true,
    aiCompatible: true,
    aiCapability:
      "Agent can run all print checks via bpy.ops.mesh.print3d_check_all()",
    tags: ["3D Print", "Mesh Analysis", "Manifold"],
  },
  // ── Utilities ─────────────────────────────────────────────────────
  {
    name: "Animation Nodes",
    description:
      "Visual programming for procedural animation. Node-based system for creating complex motion graphics and effects.",
    category: "rigging",
    icon: <Cpu className="h-5 w-5" />,
    extensionsUrl: "https://extensions.blender.org",
    builtIn: false,
    aiCompatible: true,
    aiCapability:
      "Agent can manipulate node trees via bpy.data.node_groups",
    tags: ["Procedural", "Motion Graphics", "Nodes"],
  },
  {
    name: "BlenderKit",
    description:
      "Online library of materials, models, HDRIs, and scenes. Browse and download assets directly inside Blender.",
    category: "import-export",
    icon: <Puzzle className="h-5 w-5" />,
    extensionsUrl: "https://www.blenderkit.com",
    builtIn: false,
    aiCompatible: true,
    aiCapability: "Agent can trigger downloads via bpy.ops.scene.blenderkit_download()",
    tags: ["Assets", "Materials", "Models"],
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AddonsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Recommended Addons
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Curated Blender addons that work great with ViperMesh.
              Addons marked with{" "}
              <Badge variant="secondary" className="gap-1 text-xs align-middle">
                <Sparkles className="h-3 w-3" /> AI Compatible
              </Badge>{" "}
              are automatically detected and enhanced by our AI agent.
            </p>
          </div>

          {/* AI Compatible Explainer */}
          <Card className="mb-10 border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    What does &quot;AI Compatible&quot; mean?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    When you connect to ViperMesh, our agent automatically detects which
                    addons you have installed. For recognized addons, it gains knowledge of
                    their operators and capabilities — so it can use them in your workflows
                    without you writing any code. Just install the addon, and the agent
                    adapts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Sections */}
          {CATEGORIES.map((category) => {
            const categoryAddons = ADDONS.filter(
              (a) => a.category === category.id
            )
            if (categoryAddons.length === 0) return null

            return (
              <section key={category.id} className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  {category.icon}
                  <h2 className="text-2xl font-semibold">{category.label}</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {categoryAddons.map((addon) => (
                    <Card key={addon.name} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2">
                              {addon.icon}
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {addon.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {addon.builtIn
                                  ? "Built-in addon"
                                  : "Community addon"}
                              </CardDescription>
                            </div>
                          </div>
                          {addon.aiCompatible && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-xs shrink-0 bg-primary/10 text-primary border-primary/20"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                          {addon.description}
                        </p>
                        {addon.aiCompatible && addon.aiCapability && (
                          <div className="text-xs bg-muted/50 rounded-md px-3 py-2 border border-border/50">
                            <span className="font-medium text-primary">
                              🤖 AI:{" "}
                            </span>
                            {addon.aiCapability}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-auto pt-2">
                          <div className="flex flex-wrap gap-1">
                            {addon.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {addon.extensionsUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto shrink-0 gap-1"
                              asChild
                            >
                              <a
                                href={addon.extensionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Get
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )
          })}

          {/* Footer CTA */}
          <div className="text-center mt-12 space-y-4">
            <p className="text-sm text-muted-foreground">
              Looking for more addons? Browse the official Blender Extensions Platform:
            </p>
            <Button variant="outline" className="gap-2" asChild>
              <a
                href="https://extensions.blender.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Browse extensions.blender.org
              </a>
            </Button>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Addons you install from the Blender Extensions Platform will be
              automatically detected by the ViperMesh agent if they are in our
              registry.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
