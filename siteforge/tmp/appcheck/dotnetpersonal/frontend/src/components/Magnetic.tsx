import { useRef, type ReactNode } from 'react'
import { site } from '../lib/site'

export default function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)

  function handleMove(event: React.MouseEvent) {
    if (!site.magnetic || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    ref.current.style.transform = `translate(${dx * 0.18}px, ${dy * 0.18}px)`
  }

  function handleLeave() {
    if (!ref.current) return
    ref.current.style.transform = 'translate(0, 0)'
  }

  if (!site.magnetic) {
    return <span>{children}</span>
  }

  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex', transition: 'transform 0.2s ease-out' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </span>
  )
}
