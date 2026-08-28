import { site } from '../lib/site'

export default function Aurora() {
  if (!site.aurora) {
    return (
      <>
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
      </>
    )
  }
  return (
    <div className="aurora-wrap">
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
    </div>
  )
}
