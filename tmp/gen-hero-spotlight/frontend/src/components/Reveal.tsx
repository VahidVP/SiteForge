import { useRef, type ReactNode } from 'react'
import { useReveal } from '../hooks/useReveal'
import { site } from '../lib/site'

export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useReveal(ref)

  if (!site.reveal) {
    return <div>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={visible ? 'reveal visible' : 'reveal'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
