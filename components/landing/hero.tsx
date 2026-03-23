"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { LineShadowText } from "@/components/ui/line-shadow-text"

// ── Simplified Studio workspace preview (pure CSS/HTML) ────────

function StudioPreview() {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  const sidebarIcons = [
    "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z",
    "M3 6h18M3 12h18M3 18h18",
    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8",
    "M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z",
    "M18 20V6M14 20V4M10 20V8M6 20v-6",
    "M5 12h14M12 5l7 7-7 7",
  ]

  const tools = [
    {
      name: "Geometry",
      active: true,
      desc: "Create and edit 3D meshes, primitives, and complex geometry",
      icon: (color: string) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      name: "",
      desc: "",
      icon: () => <div className="w-4 h-4" />,
    },
    {
      name: "Texture",
      desc: "Apply and manage UV maps, textures, and surface patterns",
      icon: (color: string) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
          <path d="M3 15h18" />
        </svg>
      ),
    },
    {
      name: "Materials",
      desc: "Design shaders, materials, and surface properties",
      icon: (color: string) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18" fill={color} fillOpacity="0.15" />
          <ellipse cx="9" cy="10" rx="2.5" ry="3.5" fill={color} fillOpacity="0.08" />
        </svg>
      ),
    },
    {
      name: "Lighting",
      desc: "Set up lights, shadows, and scene illumination",
      icon: (color: string) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
    },
    {
      name: "Animate",
      desc: "Keyframe animations, timelines, and motion paths",
      icon: (color: string) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h4l3-8 4 16 3-8h6" />
        </svg>
      ),
    },
  ]

  const handleMouseMove = (e: React.MouseEvent, desc: string) => {
    if (!desc) return
    const rect = e.currentTarget.closest('[data-studio-panel]')?.getBoundingClientRect()
    if (rect) {
      setTooltip({ text: desc, x: e.clientX - rect.left, y: e.clientY - rect.top - 32 })
    }
  }

  return (
    <div
      data-studio-panel
      className="w-full rounded-[2rem] overflow-hidden border-4 relative"
      style={{
        backgroundColor: "white",
        borderColor: "rgba(255, 255, 255, 0.4)",
        boxShadow: "0 0 0 1px hsl(var(--forge-border)), 0 30px 60px rgba(13, 148, 136, 0.15), 0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      {/* Cursor-following tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 px-2.5 py-1.5 rounded-lg text-[9px] font-medium whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
            backgroundColor: "hsl(var(--forge-text))",
            color: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {tooltip.text}
        </div>
      )}
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "hsl(var(--forge-border))" }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 32 32" fill="hsl(var(--forge-accent))">
            <path d="M16 2L4 8v16l12 6 12-6V8L16 2z" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: "hsl(var(--forge-text))" }}>
            ViperMesh Studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: "hsl(var(--forge-text-subtle))" }}>Mode</span>
          <div
            className="w-8 h-4 rounded-full relative"
            style={{ backgroundColor: "hsl(var(--forge-accent))" }}
          >
            <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 220 }}>
        {/* Mini sidebar */}
        <div
          className="flex flex-col items-center gap-2 py-3 px-2 border-r"
          style={{ borderColor: "hsl(var(--forge-border))", width: 40 }}
        >
          {sidebarIcons.map((d, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ backgroundColor: i === 0 ? "hsl(var(--forge-accent))" : "transparent" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={i === 0 ? "white" : "hsl(var(--forge-text-subtle))"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: "hsl(var(--forge-text))" }}>3D Tools</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
              backgroundColor: "hsl(var(--forge-accent-subtle))",
              color: "hsl(var(--forge-accent))",
            }}>Shape</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 mb-4">
            {tools.map((tool, idx) => (
              <div key={tool.name || `empty-${idx}`}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 ${tool.desc ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md' : ''}`}
                style={{
                  borderColor: tool.active ? "hsl(var(--forge-accent))" : "hsl(var(--forge-border))",
                  backgroundColor: tool.active ? "hsl(var(--forge-accent-subtle))" : "hsl(var(--forge-surface-dim))",
                }}
                onMouseMove={(e) => handleMouseMove(e, tool.desc)}
                onMouseLeave={() => setTooltip(null)}
              >
                {tool.icon(tool.active ? "hsl(var(--forge-accent))" : "hsl(var(--forge-text-subtle))")}
                {tool.name && (
                  <span className="text-[8px]" style={{
                    color: tool.active ? "hsl(var(--forge-accent))" : "hsl(var(--forge-text-subtle))",
                  }}>{tool.name}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "hsl(var(--forge-text))" }}>Project Assets</span>
            <span className="text-[9px]" style={{ color: "hsl(var(--forge-accent))" }}>View all</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { name: "Spaceship", img: "/images/hero/spaceship.png", time: "3 mins ago" },
              { name: "Designer Chair", img: "/images/hero/chair.png", time: "12 mins ago" },
              { name: "Robot Buddy", img: "/images/hero/robot.png", time: "28 mins ago" },
              { name: "Treehouse", img: "/images/hero/treehouse.png", time: "1 hour ago" },
            ].map((asset) => (
              <div key={asset.name} className="rounded-lg overflow-hidden border" style={{ borderColor: "hsl(var(--forge-border))" }}>
                <div className="aspect-square overflow-hidden">
                  <img src={asset.img} alt={asset.name} className="w-full h-full object-cover" />
                </div>
                <div className="px-1.5 py-1">
                  <span className="text-[7px] font-medium block truncate" style={{ color: "hsl(var(--forge-text))" }}>{asset.name}</span>
                  <span className="text-[6px]" style={{ color: "hsl(var(--forge-text-subtle))" }}>{asset.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Animation variants ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.1 },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" as const },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.3 },
  },
}

// ── Hero Section ───────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-32">
      {/* Background glow */}
      <motion.div
        className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        <div
          className="w-[1000px] h-[600px]"
          style={{
            background: "radial-gradient(circle at center, hsl(168 75% 42% / 0.15) 0%, transparent 60%)",
            filter: "blur(60px)",
          }}
        />
      </motion.div>

      <div className="container relative py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "hsl(var(--forge-accent-subtle))",
              color: "hsl(var(--forge-accent))",
              border: "1px solid hsl(var(--forge-accent-muted))",
            }}
          >
            <Sparkles className="w-4 h-4 text-[hsl(var(--forge-accent))]" />
            Transform your Blender workflow with AI
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
            style={{ color: "hsl(var(--forge-text))" }}
          >
            Build <LineShadowText shadowColor="hsl(var(--forge-accent))">3D Models</LineShadowText> with
            <br />
            <span 
              style={{ 
                backgroundImage: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, hsl(var(--forge-accent)) 40%, hsl(var(--forge-accent)) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent"
              }}
            >
              Natural Language
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: "hsl(var(--forge-text-muted))" }}
          >
            ViperMesh brings AI-powered automation to Blender. Create, modify,
            and enhance your 3D projects through simple conversation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="gap-2 rounded-full px-8 text-sm font-semibold"
                style={{
                  backgroundColor: "hsl(var(--forge-accent))",
                  color: "white",
                  boxShadow: "0 4px 14px hsl(168 75% 32% / 0.3)",
                }}
              >
                Start Free Trial
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-sm font-medium"
                style={{
                  borderColor: "hsl(var(--forge-border-strong))",
                  color: "hsl(var(--forge-text))",
                }}
              >
                Quick Start Guide
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Tilted Preview */}
        <motion.div
          className="mt-28 mx-auto max-w-5xl relative"
          style={{ perspective: "2000px" }}
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          {/* Viper illustration wrapping behind the preview panel */}
          <motion.img
            src="/images/c815e7cf-ee13-48ff-a8a9-2189ac48a424.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              width: "185%",
              maxWidth: "none",
              bottom: "-95%",
              left: "50%",
              marginLeft: "-90%",
              zIndex: 2,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
          <div
            className="relative z-10 transition-transform duration-1000 ease-out hover:scale-[1.02]"
            style={{
              transform: "translateY(100px) rotateX(12deg) rotateY(8deg) rotateZ(-3deg) scale(0.95)",
              transformOrigin: "center center",
            }}
          >
            <StudioPreview />
          </div>
          {/* Viper OVERLAY — body crossing ABOVE the panel */}
          <motion.img
            src="/images/c815e7cf-ee13-48ff-a8a9-2189ac48a424.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              width: "185%",
              maxWidth: "none",
              bottom: "-95%",
              left: "50%",
              marginLeft: "-90%",
              zIndex: 20,
              clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          />
          {/* Intense teal glow immediately behind the card */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, hsl(168 75% 42% / 0.25) 0%, transparent 60%)",
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
