import type { ReactNode } from 'react'

export interface ConsoleItem {
  key: string
  icon: string
  label: string
}

export default function ConsoleLayout({
  items,
  active,
  onSelect,
  children
}: {
  items: ConsoleItem[]
  active: string
  onSelect: (key: string) => void
  children: ReactNode
}) {
  return (
    <div className="container page">
      <div className="console">
        <nav className="console-nav">
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              className={active === item.key ? 'console-link active' : 'console-link'}
              onClick={() => onSelect(item.key)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  )
}
