import type { ReactNode } from 'react'
import Reveal from './Reveal'

export default function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="section">
      {title ? (
        <Reveal>
          <h2 className="section-title">{title}</h2>
        </Reveal>
      ) : null}
      {children}
    </section>
  )
}
