"use client"

import { motion } from "framer-motion"

// ── Features Section — Image-based illustrations (11 features) ──

const features = [
  {
    title: "Natural Language to 3D",
    description:
      "Describe complex objects in plain text and watch ViperMesh generate detailed 3D assets. No scripting, no menus — just conversation.",
    image: "/images/features/nlp-to-3d.png",
  },
  {
    title: "Iterative Prompting",
    description:
      "Easily refine geometry, textures, and details with precise prompt adjustments. The AI re-generates only what changed.",
    image: "/images/features/iterative-prompting.png",
  },
  {
    title: "High-Fidelity Textures",
    description:
      "Automatically generate photorealistic PBR materials and textures — roughness, metallic, normal maps — tailored to your model.",
    image: "/images/features/pbr-textures.png",
  },
  {
    title: "AI Viewport Vision",
    description:
      "After every operation, the AI captures your Blender viewport and checks the result. If something looks off, it self-corrects automatically.",
    image: "/images/features/viewport-vision.png",
  },
  {
    title: "Neural 3D Generation",
    description:
      "Generate meshes from text or images using Hunyuan3D and TRELLIS 2. ViperMesh imports, cleans, and rigs the result in one pipeline.",
    image: "/images/features/neural-3d.png",
  },
  {
    title: "134 Expert Scripts",
    description:
      "A curated library of professional Blender scripts — rigging, topology, animation, PBR — indexed by RAG so the AI always writes correct code.",
    image: "/images/features/rag-library.png",
  },
  {
    title: "Live Blender Bridge",
    description:
      "Execute Python directly inside Blender through MCP. No copy-paste, no file exports — real-time scene manipulation from your browser.",
    image: "/images/features/mcp-bridge.png",
  },
  {
    title: "Guided Workflow Pipeline",
    description:
      "Pick your tools, queue steps, and control each stage. Mix procedural, neural, and manual operations with full visibility.",
    image: "/images/features/workflow.png",
  },
  {
    title: "Multi-Format Export",
    description:
      "Export finished models in industry-standard formats — USDZ, FBX, GLTF, OBJ — optimized for Unity, Unreal, or any game engine.",
    image: "/images/features/export.png",
  },
  {
    title: "Mesh & Topology Control",
    description:
      "Fine-tune mesh density, retopology flow, and poly-count. Voxel remesh, Quadriflow, and smart decimation at your command.",
    image: "/images/features/geometry.png",
  },
  {
    title: "Auto Rigging & Animation",
    description:
      "One-click Rigify skeleton fitting, automatic weight painting, and procedural animation presets — orbit, wave, pendulum, and more.",
    image: "/images/features/rigging.png",
  },
]

// ── Animation variants ──────────────────────────────────────────

const containerVariants = {
  hidden: {} as const,
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const headingVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
}

// ── Feature Card ────────────────────────────────────────────────

function FeatureCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image: string
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden group"
      style={{
        borderColor: "hsl(var(--forge-border))",
        backgroundColor: "white",
      }}
    >
      {/* Image illustration */}
      <div
        className="w-full h-44 overflow-hidden"
        style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
        />
      </div>

      {/* Text */}
      <div className="p-5">
        <h3
          className="text-base font-semibold mb-2"
          style={{ color: "hsl(var(--forge-text))" }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "hsl(var(--forge-text-muted))" }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  )
}

// ── Main Section ────────────────────────────────────────────────

export function Features() {
  return (
    <section
      id="features"
      className="py-20 md:py-28"
      style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-4 mb-16">
          <motion.div
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "hsl(var(--forge-accent-subtle))",
              color: "hsl(var(--forge-accent))",
            }}
          >
            Features
          </motion.div>
          <motion.h2
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={1}
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: "hsl(var(--forge-text))" }}
          >
            Everything You Need to Create
          </motion.h2>
          <motion.p
            variants={headingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={2}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "hsl(var(--forge-text-muted))" }}
          >
            From natural language to finished 3D model — ViperMesh handles the entire pipeline.
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              image={feature.image}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
