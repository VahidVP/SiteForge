import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import RevealText from './RevealText'
import Magnetic from './Magnetic'
import { site, siteTitle, siteTagline } from '../lib/site'
import { getCopy } from '../lib/copy'
import { getLang } from '../lib/i18n'

export default function Hero({
  kicker,
  ctaTo,
  ctaLabel
}: {
  kicker?: string
  ctaTo?: string
  ctaLabel?: string
}) {
  const lang = getLang()
  const copy = getCopy(site.siteType, lang)
  const title = siteTitle(lang)
  const tagline = siteTagline(lang)
  const style = site.heroStyle

  function trackSpotlight(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
  }

  if (style === 'split') {
    return (
      <section className="hero" style={{ paddingBlock: '70px 40px' }}>
        <div className="hero-split container">
          <div className="hero-copy">
            {kicker ? (
              <Reveal><span className="kicker">{kicker}</span></Reveal>
            ) : null}
            <Reveal delay={80}>
              <h1><RevealText text={title} /></h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="tagline" style={{ marginInline: 0 }}>{tagline}</p>
              {ctaTo && ctaLabel ? (
                <Magnetic>
                  <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
                </Magnetic>
              ) : null}
            </Reveal>
          </div>
          <Reveal delay={220}>
            <div className={'hero-art' + (site.aurora ? ' anim-float' : '')} />
          </Reveal>
        </div>
      </section>
    )
  }

  if (style === 'spotlight') {
    return (
      <section className="hero hero-spotlight" onMouseMove={trackSpotlight}>
        <Reveal>
          <span className="kicker">{copy.heroKicker}</span>
          <h1>{title}</h1>
          <p className="tagline">{tagline}</p>
          {ctaTo && ctaLabel ? (
            <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
          ) : null}
        </Reveal>
      </section>
    )
  }

  if (style === 'waves') {
    return (
      <section className="hero hero-waves">
        <Reveal className="hero-bg">
          <div className="aurora-wrap">
            <div className={'hero-glow hero-glow-a' + (site.aurora ? ' anim-glow' : '')} />
          </div>
        </Reveal>
        <Reveal>
          <span className="kicker">{copy.heroKicker}</span>
          <h1>{title}</h1>
          <p className="tagline">{tagline}</p>
          {ctaTo && ctaLabel ? (
            <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
          ) : null}
        </Reveal>
        <div className="waves">
          <div className="wave" />
          <div className="wave" />
          <div className="wave" />
        </div>
      </section>
    )
  }

  if (style === 'grid') {
    return (
      <section className="hero hero-gridbg">
        <Reveal>
          <span className="kicker">{copy.heroKicker}</span>
          <h1>{title}</h1>
          <p className="tagline">{tagline}</p>
          {ctaTo && ctaLabel ? (
            <Magnetic>
              <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
            </Magnetic>
          ) : null}
        </Reveal>
      </section>
    )
  }

  return (
    <section className="hero">
      <Reveal className="hero-bg">
        <div className="aurora-wrap">
          <div className={'hero-glow hero-glow-a' + (site.aurora ? ' anim-glow' : '')} />
          <div className={'hero-glow hero-glow-b' + (site.aurora ? ' anim-glow d-3' : '')} />
        </div>
      </Reveal>
      {kicker ? (
        <Reveal><span className="kicker">{kicker}</span></Reveal>
      ) : null}
      <Reveal delay={80}>
        <h1><RevealText text={title} /></h1>
      </Reveal>
      {(tagline || ctaLabel) ? (
        <Reveal delay={160}>
          {tagline ? <p className="tagline">{tagline}</p> : null}
          {ctaTo && ctaLabel ? (
            <Magnetic>
              <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
            </Magnetic>
          ) : null}
        </Reveal>
      ) : null}
    </section>
  )
}
