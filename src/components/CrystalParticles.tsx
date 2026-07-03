import { useEffect, useState } from 'react'

interface Particle {
  id: number
  left: number
  delay: number
  size: number
  duration: number
  isGlow: boolean
}

export function CrystalParticles({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: 20 }, (_, i) => ({
          id: i,
          left: 10 + Math.random() * 80,
          delay: Math.random() * 0.6,
          size: 5 + Math.random() * 16,
          duration: 2 + Math.random() * 1.8,
          isGlow: i % 3 === 0,
        })),
      )
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            bottom: '18%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: p.isGlow ? 'none' : 'rotate(45deg)',
            borderRadius: p.isGlow ? '50%' : '2px',
            animation: `crystalFloat ${p.duration}s ease-out ${p.delay}s forwards`,
            background: p.isGlow
              ? 'radial-gradient(circle, rgba(0,255,255,0.6) 0%, rgba(0,255,255,0) 70%)'
              : 'linear-gradient(135deg, #00FFFF, #00CCCC)',
            boxShadow: p.isGlow
              ? '0 0 24px rgba(0, 255, 255, 0.5)'
              : '0 0 16px rgba(0, 255, 255, 0.9), 0 0 32px rgba(0, 255, 255, 0.4)',
          }}
        />
      ))}
    </div>
  )
}
