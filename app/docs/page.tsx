"use client"

import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"

// ── Sidebar navigation items ────────────────────────────────────

const sections = [
  { id: "quick-start", label: "Quick Start", icon: "🚀" },
  { id: "modes", label: "Modes", icon: "🎛️" },
  { id: "features", label: "Core Features", icon: "⚡" },
  { id: "architecture", label: "Architecture", icon: "🏗️" },
  { id: "api-reference", label: "API Reference", icon: "📡" },
  { id: "faq", label: "FAQ", icon: "❓" },
]

// ── Animation variants ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.08 },
  }),
}

// ── Scroll-aware sidebar ────────────────────────────────────────

function DocsSidebar({ activeSection }: { activeSection: string }) {
  return (
    <nav className="hidden lg:block w-56 shrink-0">
      <div className="sticky top-24 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "hsl(var(--forge-text-muted))" }}>
          On this page
        </p>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200"
            style={{
              color: activeSection === s.id ? "hsl(var(--forge-accent))" : "hsl(var(--forge-text-muted))",
              backgroundColor: activeSection === s.id ? "hsl(var(--forge-accent-subtle))" : "transparent",
              fontWeight: activeSection === s.id ? 600 : 400,
            }}
          >
            <span className="text-base">{s.icon}</span>
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

// ── Section wrapper ─────────────────────────────────────────────

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      {children}
    </section>
  )
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-60px" }} custom={0}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: "hsl(var(--forge-text))" }}>{title}</h2>
      </div>
      <p className="text-base ml-10" style={{ color: "hsl(var(--forge-text-muted))" }}>{subtitle}</p>
    </motion.div>
  )
}

// ── Step card ───────────────────────────────────────────────────

function StepCard({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-40px" }} custom={num}
      className="rounded-2xl border p-6 relative overflow-hidden"
      style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}
    >
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: "hsl(var(--forge-accent))" }}>
          {num}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--forge-text))" }}>{title}</h3>
          <div className="text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Code block ──────────────────────────────────────────────────

function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "hsl(var(--forge-border))" }}>
      {title && (
        <div className="px-4 py-2 text-xs font-mono font-semibold border-b"
          style={{ backgroundColor: "hsl(var(--forge-surface-dim))", borderColor: "hsl(var(--forge-border))", color: "hsl(var(--forge-text-muted))" }}>
          {title}
        </div>
      )}
      <pre className="p-4 text-sm overflow-x-auto font-mono leading-relaxed"
        style={{ backgroundColor: "hsl(222 47% 6%)", color: "hsl(215 20% 75%)" }}>
        {children}
      </pre>
    </div>
  )
}

// ── Feature card for docs ───────────────────────────────────────

function FeatureBlock({ title, description, examples }: { title: string; description: string; examples?: string[] }) {
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-40px" }} custom={0}
      className="rounded-2xl border p-6"
      style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}
    >
      <h3 className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--forge-text))" }}>{title}</h3>
      <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--forge-text-muted))" }}>{description}</p>
      {examples && (
        <div className="space-y-2">
          {examples.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 text-sm"
              style={{ color: "hsl(var(--forge-text))" }}>
              <span className="text-xs mt-0.5" style={{ color: "hsl(var(--forge-accent))" }}>▸</span>
              <code className="font-mono text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "hsl(var(--forge-accent-subtle))", color: "hsl(var(--forge-accent))" }}>
                {ex}
              </code>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── FAQ item ────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      variants={fadeUp} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: "-40px" }} custom={0}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
      >
        <span className="text-sm font-semibold" style={{ color: "hsl(var(--forge-text))" }}>{question}</span>
        <span className="text-lg transition-transform duration-200" style={{
          transform: open ? "rotate(45deg)" : "rotate(0)",
          color: "hsl(var(--forge-accent))",
        }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "hsl(var(--forge-text-muted))" }}>
          {answer}
        </div>
      )}
    </motion.div>
  )
}

// ── Main docs page ──────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quick-start")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}>
      <Navbar />
      <main className="flex-1 container py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: "hsl(var(--forge-accent-subtle))", color: "hsl(var(--forge-accent))" }}
          >
            Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3"
            style={{ color: "hsl(var(--forge-text))" }}>
            Learn ViperMesh
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--forge-text-muted))" }}>
            Everything you need to go from installation to your first AI-generated 3D model in minutes.
          </p>
        </motion.div>

        {/* Layout: sidebar + content */}
        <div className="max-w-5xl mx-auto flex gap-10">
          <DocsSidebar activeSection={activeSection} />

          <div className="flex-1 min-w-0">

            {/* ── 1. Quick Start ──────────────────────────────── */}
            <Section id="quick-start">
              <SectionTitle icon="🚀" title="Quick Start" subtitle="Get connected in three steps — no extra tools required" />
              <div className="space-y-4">
                <StepCard num={1} title="Install Blender 5.x (Recommended)">
                  <p>Download from <a href="https://www.blender.org/download/" target="_blank" rel="noreferrer"
                    className="font-medium underline" style={{ color: "hsl(var(--forge-accent))" }}>blender.org</a> and
                    follow the installer for your platform. <strong>Blender 5.x is strongly recommended</strong> — ViperMesh&apos;s code generation, RAG scripts, and API compatibility layer are built around the 5.x API. Older versions (3.x / 4.x) may work but are not actively tested.</p>
                </StepCard>

                <StepCard num={2} title="Install the ViperMesh Addon">
                  <div className="space-y-3">
                    <p>The addon is bundled with the ViperMesh desktop app. You can also download it directly:</p>
                    <a href="/downloads/modelforge-addon.py" download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md"
                      style={{ backgroundColor: "hsl(var(--forge-accent))" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Addon (.py)
                    </a>
                    <p>In Blender, go to <strong>Edit → Preferences → Add-ons → Install</strong>, select the downloaded file,
                      and enable <strong>&quot;Interface: ViperMesh Blender&quot;</strong>.</p>
                  </div>
                </StepCard>

                <StepCard num={3} title="Connect & Start Creating">
                  <div className="space-y-2">
                    <p>In Blender&apos;s 3D View, press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border"
                      style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "hsl(var(--forge-surface-dim))" }}>N</kbd> to
                      open the sidebar, click the <strong>ViperMesh</strong> tab, and hit <strong>&quot;Connect to ViperMesh&quot;</strong>.</p>
                    <p>Back in the ViperMesh dashboard, the <em>MCP Connection</em> card should show &quot;Connected&quot;. You&apos;re ready to go!</p>
                  </div>
                </StepCard>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true }} custom={4}
                  className="rounded-xl border p-4 flex items-start gap-3"
                  style={{ borderColor: "hsl(168 75% 42% / 0.3)", backgroundColor: "hsl(168 75% 42% / 0.06)" }}>
                  <span className="text-lg">💡</span>
                  <div className="text-sm" style={{ color: "hsl(var(--forge-text))" }}>
                    <strong>No extra dependencies needed.</strong> ViperMesh bundles everything — no separate Python, Git,
                    or <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}>uv</code> install
                    required. The addon runs inside Blender&apos;s built-in Python and communicates over a local socket.
                  </div>
                </motion.div>
              </div>
            </Section>

            {/* ── 2. Modes ────────────────────────────────────── */}
            <Section id="modes">
              <SectionTitle icon="🎛️" title="Modes" subtitle="Two ways to work — pick the one that fits your workflow" />
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }} custom={0}
                  className="rounded-2xl border p-6"
                  style={{ borderColor: "hsl(var(--forge-accent))", backgroundColor: "white" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--forge-accent))" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <h3 className="text-lg font-bold" style={{ color: "hsl(var(--forge-text))" }}>Autopilot Mode</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "hsl(var(--forge-text-muted))" }}>
                    Describe what you want in natural language. The AI plans the steps, generates Blender Python code,
                    executes it, and validates the result — all automatically.
                  </p>
                  <div className="space-y-1.5 text-xs" style={{ color: "hsl(var(--forge-text))" }}>
                    <p><strong>Best for:</strong> Quick prototypes, scene setup, lighting, materials</p>
                    <p><strong>Flow:</strong> Describe → Plan → Execute → Validate → Done</p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }} custom={1}
                  className="rounded-2xl border p-6"
                  style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--forge-accent))" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                    <h3 className="text-lg font-bold" style={{ color: "hsl(var(--forge-text))" }}>Studio Mode</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "hsl(var(--forge-text-muted))" }}>
                    Pick specific tools from the catalog, queue workflow steps, and control each stage.
                    Mix procedural, neural, and manual operations with full visibility.
                  </p>
                  <div className="space-y-1.5 text-xs" style={{ color: "hsl(var(--forge-text))" }}>
                    <p><strong>Best for:</strong> Production pipelines, complex assets, precise control</p>
                    <p><strong>Flow:</strong> Pick Tools → Queue Steps → Execute → Review → Export</p>
                  </div>
                </motion.div>
              </div>
            </Section>

            {/* ── 3. Core Features ────────────────────────────── */}
            <Section id="features">
              <SectionTitle icon="⚡" title="Core Features" subtitle="What you can do with ViperMesh" />
              <div className="space-y-4">
                <FeatureBlock
                  title="Natural Language Commands"
                  description="Use everyday language to control Blender. Create objects, modify materials, adjust lighting, animate, and more through simple text commands."
                  examples={[
                    "\"Create a medieval castle with a drawbridge\"",
                    "\"Add dramatic sunset lighting to the scene\"",
                    "\"Make the walls look like weathered stone\"",
                    "\"Animate the dragon flying in a circle\"",
                  ]}
                />
                <FeatureBlock
                  title="Neural 3D Generation"
                  description="Generate meshes from text or images using Hunyuan3D 2.1 and TRELLIS 2. ViperMesh imports the result, cleans the mesh, and rigs it — all in one pipeline."
                  examples={[
                    "\"Generate a treasure chest using neural 3D\"",
                    "\"Create a detailed robot from this image [upload]\"",
                  ]}
                />
                <FeatureBlock
                  title="Visual Feedback Loop"
                  description="After every operation, the AI captures a viewport screenshot and analyzes the result with Gemini Vision. If something looks off, it automatically generates corrective code and re-executes."
                />
                <FeatureBlock
                  title="RAG Script Library"
                  description="134 curated professional Blender scripts — rigging, topology, animation, PBR materials, retopology, UV unwrapping, export — indexed with vector embeddings so the AI always generates correct, production-ready code."
                />
                <FeatureBlock
                  title="Corrective RAG (CRAG)"
                  description="Each retrieved script is graded by the AI for relevance. If too few are relevant, the system broadens its search automatically. This ensures the AI always has the right reference code, even for unusual requests."
                />
              </div>
            </Section>

            {/* ── 4. Architecture ─────────────────────────────── */}
            <Section id="architecture">
              <SectionTitle icon="🏗️" title="Architecture" subtitle="How ViperMesh controls Blender through MCP" />
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true, margin: "-40px" }} custom={0}
                className="rounded-2xl border p-6 space-y-4"
                style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}>
                <p className="text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                  The ViperMesh addon creates a lightweight socket server inside Blender (port 9876). When you send a prompt,
                  the AI generates Blender Python code, which is sent to the addon and executed directly in your scene.
                </p>
                <div className="space-y-3">
                  {[
                    { num: "1", text: "You type a natural-language instruction in the ViperMesh chat." },
                    { num: "2", text: "The orchestration engine plans the steps and generates Blender Python code via Gemini." },
                    { num: "3", text: "ViperMesh sends the code to the addon over a local TCP socket (MCP bridge)." },
                    { num: "4", text: "The addon executes the code inside Blender and returns results." },
                    { num: "5", text: "ViperMesh captures a viewport screenshot and runs visual validation." },
                    { num: "6", text: "If issues are detected, auto-correction code is generated and re-executed." },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: "hsl(var(--forge-accent))" }}>{step.num}</span>
                      <p style={{ color: "hsl(var(--forge-text))" }}>{step.text}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: "hsl(var(--forge-accent-subtle))", color: "hsl(var(--forge-accent))" }}>
                  <strong>Tip:</strong> Only run one connection to the addon at a time (Cursor, Claude Desktop, or ViperMesh) to avoid port conflicts.
                </div>
              </motion.div>
            </Section>

            {/* ── 5. API Reference ────────────────────────────── */}
            <Section id="api-reference">
              <SectionTitle icon="📡" title="API Reference" subtitle="For developers building integrations" />
              <div className="space-y-4">
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }} custom={0}
                  className="rounded-2xl border p-6 space-y-4"
                  style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded"
                      style={{ backgroundColor: "hsl(168 75% 42% / 0.15)", color: "hsl(var(--forge-accent))" }}>POST</span>
                    <code className="text-sm font-mono font-semibold" style={{ color: "hsl(var(--forge-text))" }}>/api/ai/chat</code>
                  </div>
                  <p className="text-sm" style={{ color: "hsl(var(--forge-text-muted))" }}>
                    Streams AI responses as NDJSON chunks for real-time updates. Verifies project ownership and enforces tier limits.
                  </p>
                </motion.div>

                <CodeBlock title="Request Body">{`{
  "projectId": "uuid-of-project",
  "conversationId": "optional-conversation-uuid",
  "startNew": true,
  "message": "Create a low-poly forest scene"
}`}</CodeBlock>

                <CodeBlock title="Response (NDJSON stream)">{`{"type":"init","conversationId":"uuid"}
{"type":"delta","content":"Planning the forest scene..."}
{"type":"agent:plan","steps":["Create terrain","Add trees","Set lighting"]}
{"type":"agent:code_execution","step":1,"code":"bpy.ops.mesh.primitive_plane_add(...)"}
{"type":"delta","content":"Step 1 complete: terrain created"}
{"type":"complete","usage":{"daily":{"used":3,"limit":100}}}`}</CodeBlock>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                  viewport={{ once: true }} custom={0}
                  className="rounded-xl border p-4 text-sm"
                  style={{ borderColor: "hsl(var(--forge-border))", backgroundColor: "white", color: "hsl(var(--forge-text-muted))" }}>
                  <strong style={{ color: "hsl(var(--forge-text))" }}>Error handling:</strong> On limit exhaustion the API responds
                  with <code className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: "hsl(var(--forge-surface-dim))" }}>429</code> and
                  the current usage so you can prompt the user to upgrade or wait for resets.
                </motion.div>
              </div>
            </Section>

            {/* ── 6. FAQ ──────────────────────────────────────── */}
            <Section id="faq">
              <SectionTitle icon="❓" title="FAQ" subtitle="Common questions and answers" />
              <div className="space-y-3">
                <FaqItem
                  question="Which Blender versions are supported?"
                  answer="Blender 5.x is strongly recommended and is the primary supported version. ViperMesh's RAG scripts, code generation, and API compatibility layer are all built around the Blender 5.x API. We track 21 categories of breaking changes. Older versions (3.x / 4.x) may work for basic tasks but are not actively tested."
                />
                <FaqItem
                  question="Can I use ViperMesh with other MCP clients?"
                  answer="Yes! The Blender addon works with any MCP-compatible client — Cursor, Claude Desktop, or ViperMesh. Just make sure only one client is connected at a time to avoid port conflicts on port 9876."
                />
                <FaqItem
                  question="What happens if the AI generates bad code?"
                  answer="ViperMesh has a built-in visual feedback loop. After each code execution, it captures a viewport screenshot and analyzes the result with Gemini Vision. If something looks wrong, it automatically generates corrective code and re-executes — up to 3 correction attempts."
                />
                <FaqItem
                  question="Do I need a GPU for neural 3D generation?"
                  answer="No — neural generation (Hunyuan3D, TRELLIS 2) runs on our cloud infrastructure. Your local machine only needs to run Blender with the ViperMesh addon. The generated meshes are sent to Blender for import and post-processing."
                />
                <FaqItem
                  question="What's the difference between Autopilot and Studio mode?"
                  answer="Autopilot is fully autonomous — describe what you want and the AI handles everything. Studio mode gives you granular control — pick specific tools from a catalog, queue workflow steps, and control each stage. Use Autopilot for quick prototypes and Studio for production pipelines."
                />
                <FaqItem
                  question="How does pricing work?"
                  answer="Free: 10 daily requests with basic RAG. Starter ($12/mo): 100 daily requests with advanced RAG + CRAG and visual feedback. Pro ($29/mo): Unlimited requests with neural 3D generation, Studio mode, and workflow automation."
                />
                <FaqItem
                  question="Can I export models for game engines?"
                  answer="Yes! ViperMesh supports exporting to USDZ, FBX, GLTF, and OBJ with LOD generation and format-specific optimization presets for Unity, Unreal, web, and print."
                />
              </div>
            </Section>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center py-8"
            >
              <p className="text-lg font-semibold mb-3" style={{ color: "hsl(var(--forge-text))" }}>
                Ready to start building?
              </p>
              <Link href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: "hsl(var(--forge-accent))", boxShadow: "0 4px 14px hsl(168 75% 32% / 0.3)" }}>
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
