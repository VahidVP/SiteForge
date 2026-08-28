import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Product, getProductGallery, getProductDetails, getProductImageUrl, resolveImageUrl } from '../api/client'
import { addItem } from '../lib/cart'
import { formatPrice } from '../lib/format'
import { useI18n } from '../context/LangContext'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useI18n()
  const [product, setProduct] = useState<Product | null>(null)
  const [failed, setFailed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    setFailed(false)
    setProduct(null)
    api
      .getProduct(Number(id), lang)
      .then(p => {
        setProduct(p)
        setActiveIndex(0)
      })
      .catch(() => setFailed(true))
  }, [id, lang])

  if (failed) {
    return (
      <main className="container page page-narrow">
        <p className="muted">Product not found.</p>
        <Link to="/products" className="btn btn-ghost">← Back to shop</Link>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="container page">
        <div className="skeleton" style={{ height: 420 }} />
      </main>
    )
  }

  const name = lang === 'fa' && (product.nameFa || product.name_fa) ? (product.nameFa || product.name_fa) as string : product.name
  const description = lang === 'fa' && (product.descriptionFa || product.description_fa) ? (product.descriptionFa || product.description_fa) as string : product.description
  const gallery = getProductGallery(product)
  const details = getProductDetails(product)
  const rawImage = gallery.length > 0 ? gallery[activeIndex] || gallery[0] : getProductImageUrl(product)
  const mainSrc = resolveImageUrl(rawImage)
  const allImages = gallery.length > 0 ? gallery : (rawImage ? [rawImage] : [])

  function handleAdd() {
    addItem(product!.id)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  return (
    <main className="container page">
      <Link to="/products" className="btn btn-ghost" style={{ marginBottom: 18, display: 'inline-flex' }}>← {lang === 'fa' ? 'بازگشت' : 'Back to shop'}</Link>
      <div className="grid grid-2" style={{ gap: 28, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {mainSrc ? (
              <img src={mainSrc} alt={name} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: 340, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>No image</div>
            )}
          </div>
          {allImages.length > 1 ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {allImages.slice(0, 6).map((src, idx) => {
                const thumb = resolveImageUrl(src)
                const isActive = idx === activeIndex
                return (
                  <button
                    key={src + idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 0,
                      overflow: 'hidden',
                      width: 72,
                      height: 72,
                      cursor: 'pointer',
                      opacity: isActive ? 1 : 0.86
                    }}
                    aria-label={`Thumbnail ${idx + 1}`}
                  >
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.9rem' }}>{name}</h1>
            {product.featured ? <span className="tag" style={{ marginTop: 8, display: 'inline-block' }}>{t('products.featured')}</span> : null}
            <p className="muted" style={{ marginTop: 12, whiteSpace: 'pre-line' }}>{description}</p>
          </div>

          <div className="price" style={{ fontSize: '1.6rem' }}>{formatPrice(product.price, lang)}</div>

          {details.length > 0 ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data">
                <tbody>
                  {details.map((row, idx) => (
                    <tr key={idx}>
                      <td className="muted" style={{ width: '40%', fontWeight: 600 }}>{lang === 'fa' && row.keyFa ? row.keyFa : row.key}</td>
                      <td>{lang === 'fa' && row.valueFa ? row.valueFa : row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className={added ? 'btn btn-added' : 'btn btn-primary'} onClick={handleAdd} style={{ flex: 1 }}>
              {added ? t('common.added') : t('common.add')}
            </button>
            <Link to="/cart" className="btn btn-ghost">{t('nav.cart')}</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
