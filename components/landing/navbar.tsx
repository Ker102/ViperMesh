"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "hsla(0, 0%, 100%, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "hsl(var(--forge-border))",
      }}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2L4 8v16l12 6 12-6V8L16 2z"
                fill="hsl(var(--forge-accent))"
                fillOpacity="0.15"
                stroke="hsl(var(--forge-accent))"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M16 2v14m0 0L4 8m12 8l12-8m-12 8v14"
                stroke="hsl(var(--forge-accent))"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="14" r="3" fill="hsl(var(--forge-accent))" />
            </svg>
            <span className="text-xl font-bold tracking-tight" style={{ color: "hsl(var(--forge-text))" }}>
              ViperMesh
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { href: "/#features", label: "Features" },
              { href: "/#pricing", label: "Pricing" },
              { href: "/docs", label: "Docs" },
              { href: "/docs#quick-start", label: "Quick Start" },
            ].map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: "easeOut" }}
              >
                <Link
                  href={link.href}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: "hsl(var(--forge-text-muted))" }}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
        >
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-sm font-medium rounded-full px-5"
              style={{ color: "hsl(var(--forge-text-muted))" }}
            >
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              className="text-sm font-semibold rounded-full px-6"
              style={{
                backgroundColor: "hsl(var(--forge-accent))",
                color: "white",
                boxShadow: "0 2px 8px hsl(168 75% 32% / 0.25)",
              }}
            >
              Get Started
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.nav>
  )
}
