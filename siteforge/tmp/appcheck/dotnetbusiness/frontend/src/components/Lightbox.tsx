import { useEffect } from 'react'

export default function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
      <img src={src} alt={alt} onClick={e => e.stopPropagation()} />
    </div>
  )
}