import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import Marquee from '../components/Marquee'
import ProductCard from '../components/ProductCard'
import TiltCard from '../components/TiltCard'
import Magnetic from '../components/Magnetic'
import { getCopy } from '../lib/copy'
import { site } from '../lib/site'
import { getLang } from '../lib/i18n'
import { useI18n } from '../context/LangContext'
import { api, type Product } from '../api/client'

export default function Home() {
  const { t, lang } = useI18n()
  const c = getCopy(site.siteType, lang)
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const ctaTo = site.shop ? '/products' : site.contact ? '/contact' : site.isPersonal ? '/portfolio' : '/services'

  useEffect(() => {
    if (!site.shop) return
    api.products().then(list => setFeatured(list.filter(p => p.featured).slice(0, 3))).catch(() => setFeatured([]))
  }, [])

  const showcase = site.isPersonal ? c.projects.slice(0, 3) : c.services.slice(0, 4)

  return (
    <main>
      <div className="container">
        <Hero kicker={c.heroKicker} ctaTo={ctaTo} ctaLabel={c.ctaLabel} />
      </div>

      <Marquee />

      <main className="container page">
        {c.stats.length > 0 ? (
          <Reveal delay={220}>
            <div className="grid stats-band">
              {c.stats.map(stat => (
                <div key={stat.label} className="card stat">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}

        <Section title={c.cardsTitle}>
          <div className="grid grid-3">
            {c.cards.map((cardItem, index) => (
              <Reveal key={cardItem.title} delay={index * 90}>
                {site.tilt ? (
                  <TiltCard className="card lift">
                    <h3>{cardItem.title}</h3>
                    <p className="muted">{cardItem.text}</p>
                  </TiltCard>
                ) : (
                  <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                    <h3>{cardItem.title}</h3>
                    <p className="muted">{cardItem.text}</p>
                  </article>
                )}
              </Reveal>
            ))}
          </div>
        </Section>

        {site.shop && featured !== null && featured.length > 0 && (
          <Section title={t('products.featured')}>
            <div className="grid grid-3">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={index * 80}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <p style={{ marginTop: 20 }}>
                <Magnetic>
                  <Link to="/products" className="btn btn-ghost">→</Link>
                </Magnetic>
              </p>
            </Reveal>
          </Section>
        )}

        {!site.shop && showcase.length > 0 && (
          <Section title={site.isPersonal ? c.projectsTitle : c.servicesTitle}>
            <div className={site.isPersonal ? 'grid grid-3' : 'grid grid-2'}>
              {site.isPersonal
                ? showcase.map((item, index) => {
                    const project = item as (typeof c.projects)[number]
                    return (
                      <Reveal key={project.name} delay={index * 90}>
                        {site.tilt ? (
                          <TiltCard className="card" >
                            <ProjectBody project={project} />
                          </TiltCard>
                        ) : (
                          <article className={'card' + (site.hoverLift ? ' lift' : '')} style={{ padding: 0 }}>
                            <ProjectBody project={project} />
                          </article>
                        )}
                      </Reveal>
                    )
                  })
                : showcase.map((item, index) => {
                    const service = item as (typeof c.services)[number]
                    return (
                      <Reveal key={service.title} delay={index * 90}>
                        <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                          <span className="service-icon anim-float">{service.icon}</span>
                          <h3>{service.title}</h3>
                          <p className="muted">{service.text}</p>
                        </article>
                      </Reveal>
                    )
                  })}
            </div>
            <Reveal delay={180}>
              <p style={{ marginTop: 20 }}>
                <Link to={ctaTo} className="btn btn-ghost">→</Link>
              </p>
            </Reveal>
          </Section>
        )}
      </main>
    </main>
  )
}

function ProjectBody({ project }: { project: ReturnType<typeof getCopy>['projects'][number] }) {
  const { lang } = useI18n()
  void lang
  return (
    <>
      <img className="product-image" src={project.image} alt={project.name} loading="lazy" />
      <div style={{ padding: 18 }}>
        <h3>{project.name}</h3>
        <p className="muted">{project.description}</p>
        <div className="tags">
          {project.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </>
  )
}
