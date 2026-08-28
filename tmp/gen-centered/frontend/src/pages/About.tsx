import { useEffect, useState } from 'react'
import Section from '../components/Section'
import Reveal from '../components/Reveal'
import { getCopy } from '../lib/copy'
import { site } from '../lib/site'
import { getLang } from '../lib/i18n'
import { api } from '../api/client'

export default function About() {
  const [dbContent, setDbContent] = useState('')
  const c = getCopy(site.siteType, getLang())

  useEffect(() => {
    api.page('about').then(page => setDbContent(page.content)).catch(() => {})
  }, [])

  return (
    <main className="container page page-narrow">
      <Section title={c.aboutTitle}>
        {c.aboutParagraphs.map((text, index) => (
          <Reveal key={index} delay={index * 80}>
            <p className="prose">{text}</p>
          </Reveal>
        ))}
        {dbContent ? (
          <Reveal delay={200}>
            <p className="prose">{dbContent}</p>
          </Reveal>
        ) : null}
      </Section>
      {c.team.length > 0 && (
        <Section title={c.aboutTitle}>
          <div className="grid grid-3">
            {c.team.map((member, index) => (
              <Reveal key={member.name} delay={index * 90}>
                <article className={'card' + (site.hoverLift ? ' lift' : '')}>
                  <div className="team-avatar">
                    {member.name.split(' ').map(part => part.charAt(0)).join('').slice(0, 2)}
                  </div>
                  <h3 style={{ margin: '0 0 2px' }}>{member.name}</h3>
                  <p style={{ margin: '0 0 8px', color: 'var(--accent-2)', fontSize: '0.88rem', fontWeight: 600 }}>{member.role}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>{member.bio}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>
      )}
    </main>
  )
}
