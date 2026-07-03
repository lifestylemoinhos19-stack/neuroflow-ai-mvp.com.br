import { useEffect, useState } from 'react'

interface Particle {
  id: number
  left: number
  delay: number
  size: number
  duration: number
}

export function CrystalParticles({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: 16 }, (_, i) => ({
          id: i,
          left: 15 + Math.random() * 70,
          delay: Math.random() * 0.5,
          size: 6 + Math.random() * 14,
          duration: 2 + Math.random() * 1.5,
        })),
      )
    }
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            bottom: '20%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: 'rotate(45deg)',
            animation: `crystalFloat ${p.duration}s ease-out ${p.delay}s forwards`,
            background: 'linear-gradient(135deg, #00FFFF, #00CCCC)',
            boxShadow: '0 0 16px rgba(0, 255, 255, 0.9), 0 0 32px rgba(0, 255, 255, 0.4)',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  )
}
