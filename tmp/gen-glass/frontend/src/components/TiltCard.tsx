import { useRef, type ReactNode } from 'react'
import { site } from '../lib/site'

export default function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(event: React.MouseEvent) {
    if (!site.tilt || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    ref.current.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${py * -10}deg)`
  }

  function handleLeave() {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)'
  }

  return (
    <div ref={ref} className={`tilt-card ${className}`} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  )
}
