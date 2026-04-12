import { motion } from 'framer-motion'

const COLORS = ['#7B0D1E', '#10b981', '#f59e0b', '#e11d48', '#6366f1', '#0ea5e9']
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  x: (Math.random() - 0.5) * 200,
  y: -(40 + Math.random() * 120),
  rotate: Math.random() * 360,
  scale: 0.5 + Math.random() * 0.8,
  delay: Math.random() * 0.3,
}))

export function PRConfetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: p.scale,
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
