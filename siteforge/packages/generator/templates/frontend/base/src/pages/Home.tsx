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
import { useI18n } from '../context/LangContext'
import { api, type Product, type Project, type ServiceItem, getItemGallery, resolveImageUrl } from '../api/client'

export default function Home() {
  const { t, lang } = useI18n()
  const c = getCopy(site.siteType, lang)
  const [featured, setFeatured] = useState<Product[] | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const ctaTo = site.shop ? '/products' : site.contact ? '/contact' : site.isPersonal ? '/portfolio' : '/services'

  useEffect(() => {
    if (!site.shop) return
    api.products().then(list => setFeatured(list.filter(p => p.featured).slice(0, 3))).catch(() => setFeatured([]))
  }, [])

  useEffect(() => {
    if (site.isPersonal) {
      api.projects().then(setProjects).catch(() => setProjects([]))
    } else if (site.isBusiness) {
      api.services().then(setServices).catch(() => setServices([]))
    }
  }, [])

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

        {!site.shop && site.isPersonal && (
          <ShowcaseSection title={c.projectsTitle} linkTo="/portfolio">
            <div className="grid grid-3">
              {projects.length > 0
                ? projects.slice(0, 3).map((project, index) => (
                    <Reveal key={project.id} delay={index * 90}>
                      <ProjectCard project={project} />
                    </Reveal>
                  ))
                : c.projects.slice(0, 3).map((item, index) => (
                    <Reveal key={item.name} delay={index * 90}>
                      <StaticCard name={item.name} text={item.description} tags={item.tags} />
                    </Reveal>
                  ))}
            </div>
          </ShowcaseSection>
        )}

        {!site.shop && site.isBusiness && (
          <ShowcaseSection title={c.servicesTitle} linkTo="/services">
            <div className="grid grid-2">
              {services.length > 0
                ? services.slice(0, 4).map((service, index) => (
                    <Reveal key={service.id} delay={index * 90}>
                      <Link to={`/services/${service.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                        <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                          {service.icon ? <span className="service-icon anim-float">{service.icon}</span> : null}
                          <h3>{lang === 'fa' && service.titleFa ? service.titleFa : service.title}</h3>
                          <p className="muted">{lang === 'fa' && service.textFa ? service.textFa : service.text}</p>
                        </article>
                      </Link>
                    </Reveal>
                  ))
                : c.services.slice(0, 4).map((item, index) => (
                    <Reveal key={item.title} delay={index * 90}>
                      <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                        <span className="service-icon anim-float">{item.icon}</span>
                        <h3>{item.title}</h3>
                        <p className="muted">{item.text}</p>
                      </article>
                    </Reveal>
                  ))}
            </div>
          </ShowcaseSection>
        )}
      </main>
    </main>
  )
}

function ShowcaseSection({ title, linkTo, children }: { title: string; linkTo: string; children: React.ReactNode }) {
  return (
    <Section title={title}>
      {children}
      <Reveal delay={180}>
        <p style={{ marginTop: 20 }}>
          <Link to={linkTo} className="btn btn-ghost">→</Link>
        </p>
      </Reveal>
    </Section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const { lang } = useI18n()
  const name = lang === 'fa' && project.nameFa ? project.nameFa : project.name
  const summary = lang === 'fa' && project.summaryFa ? project.summaryFa : (project.summary ?? '')
  const gallery = getItemGallery(project)
  const img = gallery.length > 0 ? resolveImageUrl(gallery[0]) : null
  const tags = Array.isArray(project.tags) && project.tags.length > 0 ? project.tags : (project.Tags ?? [])
  return (
    <Link to={`/portfolio/${project.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <article className={'card' + (site.hoverLift ? ' lift' : '')} style={{ padding: 0, overflow: 'hidden' }}>
        {img ? (
          <img className="product-image" src={img} alt={name} loading="lazy" />
        ) : (
          <div className="img-fallback">{name.charAt(0)}</div>
        )}
        <div style={{ padding: 18 }}>
          <h3>{name}</h3>
          <p className="muted">{summary}</p>
          {tags.length > 0 ? (
            <div className="tags">
              {tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  )
}

function StaticCard({ name, text, tags }: { name: string; text: string; tags: string[] }) {
  return (
    <article className={'card' + (site.hoverLift ? ' lift' : '')} style={{ padding: 0, overflow: 'hidden' }}>
      <div className="img-fallback">{name.charAt(0)}</div>
      <div style={{ padding: 18 }}>
        <h3>{name}</h3>
        <p className="muted">{text}</p>
        {tags.length > 0 ? (
          <div className="tags">
            {tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}