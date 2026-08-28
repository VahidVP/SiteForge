import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type ServiceItem, getItemGallery, resolveImageUrl } from '../api/client'
import Lightbox from '../components/Lightbox'
import { useI18n } from '../context/LangContext'

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useI18n()
  const [service, setService] = useState<ServiceItem | null>(null)
  const [failed, setFailed] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setFailed(false)
    setService(null)
    api.service(Number(id)).then(setService).catch(() => setFailed(true))
  }, [id])

  const title = lang === 'fa' && service?.titleFa ? service.titleFa : service?.title ?? ''
  const text = lang === 'fa' && service?.textFa ? service.textFa : (service?.text ?? '')
  const gallery = service ? getItemGallery(service) : []

  return (
    <main className="container page page-narrow">
      {failed ? (
        <div className="card muted">
          {t('content.notFound')}{' '}
          <Link to="/services" className="btn btn-ghost btn-sm" style={{ marginInlineStart: 8 }}>← {t('common.back')}</Link>
        </div>
      ) : !service ? (
        <div className="skeleton" style={{ height: 380 }} />
      ) : (
        <>
          <Link to="/services" className="btn btn-ghost" style={{ marginBottom: 18, display: 'inline-flex' }}>← {t('common.back')}</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {service.icon ? <span className="service-icon" style={{ fontSize: '2rem' }}>{service.icon}</span> : null}
            <h1 style={{ margin: 0 }}>{title}</h1>
          </div>

          {text ? <p style={{ whiteSpace: 'pre-line', marginTop: 20 }}>{text}</p> : null}

          {gallery.length > 0 ? (
            <div className="detail-gallery" style={{ marginTop: 20 }}>
              {gallery.map((raw, idx) => {
                const src = resolveImageUrl(raw)
                if (!src) return null
                return (
                  <button key={idx} type="button" className="detail-gallery-item" onClick={() => setZoom(src)}>
                    <img src={src} alt={`${title} ${idx + 1}`} loading="lazy" />
                  </button>
                )
              })}
            </div>
          ) : null}

          {zoom ? <Lightbox src={zoom} alt={title} onClose={() => setZoom(null)} /> : null}
        </>
      )}
    </main>
  )
}