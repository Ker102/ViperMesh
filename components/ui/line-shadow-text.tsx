"use client"

import { type CSSProperties, type HTMLAttributes } from "react"
import { motion, type MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
} as const

type MotionElementType = keyof typeof motionElements

interface LineShadowTextProps
  extends Omit<HTMLAttributes<HTMLElement>, keyof MotionProps>, MotionProps {
  children: string
  shadowColor?: string
  as?: MotionElementType
}

export function LineShadowText({
  children,
  shadowColor = "black",
  className,
  as: Component = "span",
  ...props
}: LineShadowTextProps) {
  const MotionComponent = motionElements[Component] as any

  return (
    <MotionComponent
      className={cn("relative z-0 inline-block", className)}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="absolute left-[0.06em] top-[0.06em] z-[-1] block pointer-events-none select-none whitespace-nowrap"
        style={{
          backgroundImage: `linear-gradient(45deg, transparent 40%, ${shadowColor} 40%, ${shadowColor} 60%, transparent 0)`,
          backgroundSize: "0.08em 0.08em",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          animation: "line-shadow 15s linear infinite"
        }}
      >
        {children}
      </span>
    </MotionComponent>
  )
}
