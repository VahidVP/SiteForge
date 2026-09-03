import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import RevealText from './RevealText'
import Magnetic from './Magnetic'
import { site, siteTitle, siteTagline, siteHeroKicker, siteCtaLabel } from '../lib/site'
import { getCopy } from '../lib/copy'
import { getLang } from '../lib/i18n'

export default function Hero({
  kicker: kickerProp,
  ctaTo,
  ctaLabel: ctaLabelProp
}: {
  kicker?: string
  ctaTo?: string
  ctaLabel?: string
}) {
  const lang = getLang()
  const copy = getCopy(site.siteType, lang)
  const title = siteTitle(lang)
  const tagline = siteTagline(lang)
  // Wizard "Website text" overrides win over the per-type defaults.
  const kicker = siteHeroKicker(lang, kickerProp ?? copy.heroKicker)
  const ctaLabel = siteCtaLabel(lang, ctaLabelProp ?? copy.ctaLabel)
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
            {site.heroImage ? (
              <img
                className={'hero-art hero-art-img' + (site.aurora ? ' anim-float' : '')}
                src={site.heroImage}
                alt=""
              />
            ) : (
              <div className={'hero-art' + (site.aurora ? ' anim-float' : '')} />
            )}
          </Reveal>
        </div>
      </section>
    )
  }

  if (style === 'spotlight') {
    return (
      <section className="hero hero-spotlight" onMouseMove={trackSpotlight}>
        <Reveal>
          <span className="kicker">{kicker}</span>
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
        {site.aurora ? (
          <Reveal className="hero-bg">
            <div className="aurora-wrap">
              <div className="hero-glow hero-glow-a anim-glow" />
            </div>
          </Reveal>
        ) : null}
        <Reveal>
          <span className="kicker">{kicker}</span>
          <h1>{title}</h1>
          <p className="tagline">{tagline}</p>
          {ctaTo && ctaLabel ? (
            <Link to={ctaTo} className="btn btn-primary btn-lg">{ctaLabel}</Link>
          ) : null}
        </Reveal>
        {/* Rotating waves along the hero's base — the exact technique the wizard's
            live preview uses (wide rounded bars spinning about centres just below
            the hero edge), scaled up for the full-size page. */}
        <div className="wave wave-a" aria-hidden="true" />
        <div className="wave wave-b" aria-hidden="true" />
      </section>
    )
  }

  if (style === 'grid') {
    return (
      <section className="hero hero-gridbg">
        <Reveal>
          <span className="kicker">{kicker}</span>
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
