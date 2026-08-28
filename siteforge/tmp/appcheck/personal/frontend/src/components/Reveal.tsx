import { useRef, type ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'
import { site } from '../lib/site'

export default function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useReveal(ref)

  if (!site.reveal) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
