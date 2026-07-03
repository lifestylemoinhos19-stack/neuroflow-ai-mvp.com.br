import { useEffect, useState } from 'react'

interface Particle {
  id: number
  left: number
  delay: number
  size: number
}

export function CrystalParticles({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: 14 }, (_, i) => ({
          id: i,
          left: 20 + Math.random() * 60,
          delay: Math.random() * 0.4,
          size: 4 + Math.random() * 10,
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
          className="absolute rounded-full bg-[#00FFFF]"
          style={{
            left: `${p.left}%`,
            bottom: '25%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFloat 2.5s ease-out ${p.delay}s forwards`,
            boxShadow: '0 0 12px rgba(0, 255, 255, 0.9)',
          }}
        />
      ))}
    </div>
  )
}
