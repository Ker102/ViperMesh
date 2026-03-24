"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function AnimatedLogo({ size = 32, className = "" }: { size?: number, className?: string }) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      whileHover="hover"
      initial="initial"
    >
      {/* 
        With a transparent PNG, we can animate the image directly
        making it "float" up and adding a deep glowing drop-shadow.
      */}
      <motion.div
        className="w-full h-full relative"
        variants={{
          initial: { 
            y: 0,
            filter: "drop-shadow(0px 2px 4px rgba(20, 184, 166, 0.4))"
          },
          hover: { 
            y: -2,
            filter: "drop-shadow(0px 8px 12px rgba(20, 184, 166, 0.8))"
          }
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
      >
        <Image 
          src="/vipermesh-logo-transparent.png" 
          alt="ViperMesh Logo" 
          width={size * 2} // Double resolution for crispness
          height={size * 2}
          className="object-contain w-full h-full"
          priority
        />
        
        {/* Magic Shine Overlay */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none rounded-full"
          style={{
            background: "linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.5) 45%, rgba(20, 184, 166, 0.8) 50%, rgba(255, 255, 255, 0.5) 55%, transparent 80%)",
            backgroundSize: "200% 100%",
            mixBlendMode: "color-dodge",
            maskImage: `url(/vipermesh-logo-transparent.png)`,
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: `url(/vipermesh-logo-transparent.png)`,
            WebkitMaskSize: "contain",
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat"
          }}
          variants={{
            initial: { opacity: 0, backgroundPosition: "150% 0%" },
            hover: {
              opacity: 0.8,
              backgroundPosition: ["150% 0%", "-50% 0%"],
              transition: {
                backgroundPosition: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear"
                },
                opacity: { duration: 0.2 }
              }
            }
          }}
        />
      </motion.div>
    </motion.div>
  )
}
