import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { api, type ServiceItem } from '../api/client'
import { site } from '../lib/site'
import { useI18n } from '../context/LangContext'

export default function Services() {
  const { lang, t } = useI18n()
  const [services, setServices] = useState<ServiceItem[] | null>(null)

  useEffect(() => {
    api.services().then(setServices).catch(() => setServices([]))
  }, [])

  return (
    <main className="container page">
      <Section title={lang === 'fa' ? 'خدمات ما' : 'Services'}>
        {services === null ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : services.length === 0 ? (
          <div className="card muted">{t('admin.noData')}</div>
        ) : (
          <div className="grid grid-2">
            {services.map((service, index) => {
              const title = lang === 'fa' && service.titleFa ? service.titleFa : service.title
              const text = lang === 'fa' && service.textFa ? service.textFa : (service.text ?? '')
              return (
                <Reveal key={service.id} delay={index * 90}>
                  <Link to={`/services/${service.id}`} style={{ display: 'block', textDecoration: 'none' }}>
                    <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                      {service.icon ? <span className="service-icon anim-float">{service.icon}</span> : null}
                      <h3>{title}</h3>
                      <p className="muted">{text}</p>
                    </article>
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