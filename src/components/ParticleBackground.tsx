'use client'

import { motion } from 'framer-motion'

interface ParticleBackgroundProps {
  particleCount?: number
}

export default function ParticleBackground({ particleCount = 30 }: ParticleBackgroundProps) {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-[#2563EB]/30 to-[#3B82F6]/20"
          initial={{
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: 0,
          }}
          animate={{
            x: [
              `${particle.x}vw`,
              `${particle.x + (Math.random() * 20 - 10)}vw`,
              `${particle.x}vw`,
            ],
            y: [
              `${particle.y}vh`,
              `${particle.y + (Math.random() * 20 - 10)}vh`,
              `${particle.y}vh`,
            ],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}