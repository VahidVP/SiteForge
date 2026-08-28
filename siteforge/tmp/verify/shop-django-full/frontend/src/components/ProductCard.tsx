import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductGallery, getProductImageUrl, resolveImageUrl, type Product } from '../api/client'
import TiltCard from './TiltCard'
import Magnetic from './Magnetic'
import { addItem } from '../lib/cart'
import { site } from '../lib/site'
import { formatPrice } from '../lib/format'
import { useI18n } from '../context/LangContext'

export default function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useI18n()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product.id)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  const name = lang === 'fa' && product.nameFa ? product.nameFa : product.name
  const description =
    lang === 'fa' && product.descriptionFa ? product.descriptionFa : product.description
  const gallery = getProductGallery(product)
  const rawImage = gallery.length > 0 ? gallery[0] : getProductImageUrl(product)
  const src = resolveImageUrl(rawImage)

  const cardInner = (
    <article className={'card product-card' + (site.hoverLift && !site.tilt ? ' lift' : '')}>
      <Link to={`/products/${product.id}`} style={{ display: 'block' }}>
        {src ? (
          <img className="product-image" src={src} alt={name} loading="lazy" />
        ) : (
          <div className="img-fallback">{name.charAt(0)}</div>
        )}
      </Link>
      {product.featured ? <span className="featured-badge">{t('products.featured')}</span> : null}
      <div className="product-body">
        <Link to={`/products/${product.id}`}>
          <h3>{name}</h3>
        </Link>
        <p className="muted">{description}</p>
        <div className="product-row">
          <span className="price">{formatPrice(product.price, lang)}</span>
          <Magnetic>
            <button
              type="button"
              className={added ? 'btn btn-sm btn-added' : 'btn btn-sm btn-primary'}
              onClick={handleAdd}
            >
              {added ? t('common.added') : t('common.add')}
            </button>
          </Magnetic>
        </div>
      </div>
    </article>
  )

  if (site.tilt) {
    return (
      <TiltCard className={'card product-card' + (site.hoverLift ? ' lift' : '')} >
        <Link to={`/products/${product.id}`} style={{ display: 'block', width: '100%' }}>
          {src ? (
            <img className="product-image" src={src} alt={name} loading="lazy" />
          ) : (
            <div className="img-fallback">{name.charAt(0)}</div>
          )}
        </Link>
        {product.featured ? <span className="featured-badge">{t('products.featured')}</span> : null}
        <div className="product-body">
          <Link to={`/products/${product.id}`}>
            <h3>{name}</h3>
          </Link>
          <p className="muted">{description}</p>
          <div className="product-row">
            <span className="price">{formatPrice(product.price, lang)}</span>
            <Magnetic>
              <button
                type="button"
                className={added ? 'btn btn-sm btn-added' : 'btn btn-sm btn-primary'}
                onClick={handleAdd}
              >
                {added ? t('common.added') : t('common.add')}
              </button>
            </Magnetic>
          </div>
        </div>
      </TiltCard>
    )
  }

  return cardInner
}
