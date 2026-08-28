import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { getCopy } from '../lib/copy'
import { site } from '../lib/site'
import { getLang } from '../lib/i18n'

export default function Services() {
  const c = getCopy(site.siteType, getLang())
  return (
    <main className="container page">
      <Section title={c.servicesTitle}>
        <div className="grid grid-2">
          {c.services.map((service, index) => (
            <Reveal key={service.title} delay={index * 90}>
              <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                <span className="service-icon anim-float">{service.icon}</span>
                <h3>{service.title}</h3>
                <p className="muted">{service.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>
    </main>
  )
}
