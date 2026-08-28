import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { site } from '../lib/site'
import { addCartListener, cartCount } from '../lib/cart'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/LangContext'

export default function Navbar() {
  const { email, isAdmin, signOut } = useAuth()
  const { t, lang, switchTo } = useI18n()
  const [count, setCount] = useState(cartCount())

  useEffect(() => addCartListener(() => setCount(cartCount())), [])

  return (
    <header className="nav" data-header={site.headerStyle}>
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-dot" />
          {site.title}
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/about">{t('nav.about')}</NavLink>
          {site.isPersonal && <NavLink to="/portfolio">{t('nav.portfolio')}</NavLink>}
          {site.isBusiness && <NavLink to="/services">{t('nav.services')}</NavLink>}
          {site.shop && <NavLink to="/products">{t('nav.shop')}</NavLink>}
          {site.contact && <NavLink to="/contact">{t('nav.contact')}</NavLink>}
        </nav>

        <div className="nav-actions">
          {site.bilingual && (
            <button type="button" className="lang-toggle" onClick={() => switchTo(lang === 'en' ? 'fa' : 'en')}>
              {lang === 'en' ? 'فا' : 'EN'}
            </button>
          )}

          {site.shop && (
            <Link to="/cart" className="cart-chip">
              🛒 {count > 0 ? count : ''}
            </Link>
          )}

          {site.auth && email ? (
            <div className="user-menu">
              {isAdmin && (
                <Link to="/admin" className="btn btn-ghost btn-sm">
                  {t('nav.admin')}
                </Link>
              )}
              <Link to="/dashboard" title={t('nav.dashboard')}>
                <span className="avatar">{email.charAt(0).toUpperCase()}</span>
              </Link>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
                {t('nav.signout')}
              </button>
            </div>
          ) : null}

          {site.auth && !email ? (
            <>
              <Link to="/login?mode=signin" className="btn btn-ghost btn-sm">
                {t('nav.signin')}
              </Link>
              <Link to="/login?mode=signup" className="btn btn-primary btn-sm">
                {t('nav.signup')}
              </Link>
            </>
          ) : null}

          {!site.auth && site.hasOwnerCode ? (
            <Link to="/owner" className="btn btn-ghost btn-sm">🔑</Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
