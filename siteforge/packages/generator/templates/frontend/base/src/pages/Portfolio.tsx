import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import TiltCard from '../components/TiltCard'
import { api, type Project, getItemGallery, resolveImageUrl } from '../api/client'
import { site } from '../lib/site'
import { useI18n } from '../context/LangContext'

export default function Portfolio() {
  const { lang, t } = useI18n()
  const [projects, setProjects] = useState<Project[] | null>(null)

  useEffect(() => {
    api.projects().then(setProjects).catch(() => setProjects([]))
  }, [])

  return (
    <main className="container page">
      <Section title={lang === 'fa' ? 'نمونه‌کارها' : 'Selected work'}>
        {projects === null ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : projects.length === 0 ? (
          <div className="card muted">{t('admin.noData')}</div>
        ) : (
          <div className="grid grid-3">
            {projects.map((project, index) => {
              const name = lang === 'fa' && project.nameFa ? project.nameFa : project.name
              const summary = lang === 'fa' && project.summaryFa ? project.summaryFa : (project.summary ?? '')
              const gallery = getItemGallery(project)
              const img = gallery.length > 0 ? resolveImageUrl(gallery[0]) : null
              const tags = Array.isArray(project.tags) && project.tags.length > 0 ? project.tags : (project.Tags ?? [])

              const cardElement = (
                <article
                  className={'card project-card' + (site.hoverLift && !site.tilt ? ' lift' : '')}
                  style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {img ? (
                    <img className="product-image" src={img} alt={name} loading="lazy" />
                  ) : (
                    <div className="img-fallback">{name.charAt(0)}</div>
                  )}
                  <div style={{ padding: 18, flex: 1 }}>
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
              )

              return (
                <Reveal key={project.id} delay={index * 90}>
                  <Link to={`/portfolio/${project.id}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
                    {site.tilt ? <TiltCard className={site.hoverLift ? 'lift' : ''}>{cardElement}</TiltCard> : cardElement}
                  </Link>
                </Reveal>
              )
            })}
          </div>
        )}
      </Section>
    </main>
  )
}