import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { getCopy } from '../lib/copy'
import { site } from '../lib/site'
import { getLang } from '../lib/i18n'

export default function Portfolio() {
  const c = getCopy(site.siteType, getLang())
  return (
    <main className="container page">
      <Section title={c.projectsTitle}>
        <div className="grid grid-3">
          {c.projects.map((project, index) => (
            <Reveal key={project.name} delay={index * 90}>
              <article className={'card' + (site.hoverLift ? ' lift' : '')} style={{ padding: 0 }}>
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
              </article>
            </Reveal>
          ))}
        </div>
      </Section>
    </main>
  )
}
