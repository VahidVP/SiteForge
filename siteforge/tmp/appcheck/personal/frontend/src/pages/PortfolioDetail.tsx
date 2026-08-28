import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Project, getItemGallery, resolveImageUrl } from '../api/client'
import Lightbox from '../components/Lightbox'
import { useI18n } from '../context/LangContext'

export default function PortfolioDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useI18n()
  const [project, setProject] = useState<Project | null>(null)
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setFailed(false)
    setProject(null)
    api.project(Number(id)).then(setProject).catch(() => setFailed(true))
  }, [id])

  const name = lang === 'fa' && project?.nameFa ? project.nameFa : project?.name ?? ''
  const summary = lang === 'fa' && project?.summaryFa ? project.summaryFa : (project?.summary ?? '')
  const description = lang === 'fa' && project?.descriptionFa ? project.descriptionFa : (project?.description ?? '')
  const gallery = project ? getItemGallery(project) : []
  const tags = project && Array.isArray(project.tags) && project.tags.length > 0 ? project.tags : (project?.Tags ?? [])

  return (
    <main className="container page page-narrow">
      {failed ? (
        <div className="card muted">
          {t('content.notFound')}{' '}
          <Link to="/portfolio" className="btn btn-ghost btn-sm" style={{ marginInlineStart: 8 }}>← {t('common.back')}</Link>
        </div>
      ) : !project ? (
        <div className="skeleton" style={{ height: 380 }} />
      ) : (
        <>
          <Link to="/portfolio" className="btn btn-ghost" style={{ marginBottom: 18, display: 'inline-flex' }}>← {t('common.back')}</Link>
          <h1 style={{ marginTop: 0 }}>{name}</h1>
          {summary ? <p className="muted" style={{ fontSize: '1.05rem' }}>{summary}</p> : null}

          {gallery.length > 0 ? (
            <div className="detail-gallery">
              {gallery.map((raw, idx) => {
                const src = resolveImageUrl(raw)
                if (!src) return null
                return (
                  <button key={idx} type="button" className="detail-gallery-item" onClick={() => setZoom(src)}>
                    <img src={src} alt={`${name} ${idx + 1}`} loading="lazy" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="img-fallback" style={{ height: 220, fontSize: '3rem' }}>{name.charAt(0)}</div>
          )}

          {description ? <p style={{ whiteSpace: 'pre-line', marginTop: 20 }}>{description}</p> : null}

          {tags.length > 0 ? (
            <div className="tags" style={{ marginTop: 16 }}>
              {tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          ) : null}

          {zoom ? <Lightbox src={zoom} alt={name} onClose={() => setZoom(null)} /> : null}
        </>
      )}
    </main>
  )
}