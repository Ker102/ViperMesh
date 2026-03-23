"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AnimatedLogo } from "@/components/ui/animated-logo"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#workflows", label: "Workflows" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
]

export function Navbar() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 w-full pointer-events-none">
      <motion.nav
        className="pointer-events-auto flex items-center justify-between px-2 py-2 rounded-full border border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] min-w-[320px] w-full max-w-5xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-6 pl-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedLogo size={36} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-foreground transition-all duration-300 group-hover:text-[hsl(var(--forge-accent))]">
              ViperMesh
            </span>
          </Link>

          {/* Nav links with Sliding Hover Pill */}
          <div className="hidden md:flex items-center gap-1 ml-4" onMouseLeave={() => setHoveredLink(null)}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
                onMouseEnter={() => setHoveredLink(link.label)}
              >
                {hoveredLink === link.label && (
                  <motion.div
                    layoutId="navbar-hover-pill"
                    className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 text-muted-foreground hover:text-foreground transition-colors duration-200">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2 pr-2">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-medium rounded-full px-5 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </motion.button>
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-semibold rounded-full px-6 py-2.5 relative overflow-hidden group"
              style={{
                backgroundColor: "hsl(var(--forge-accent))",
                color: "white",
                boxShadow: "0 4px 14px hsl(168 75% 32% / 0.3)",
              }}
            >
              <motion.div 
                className="absolute inset-0 z-0 bg-white/20"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
              <span className="relative z-10">Get Started</span>
            </motion.button>
          </Link>
        </div>
      </motion.nav>
    </div>
  )
}
