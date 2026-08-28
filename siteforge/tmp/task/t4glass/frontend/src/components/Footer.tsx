import { Link } from 'react-router-dom'
import { site, siteTagline, siteTitle } from '../lib/site'
import { useI18n } from '../context/LangContext'

export default function Footer() {
  const year = new Date().getFullYear()
  const { t, lang } = useI18n()
  const name = siteTitle(lang)
  const tagline = siteTagline(lang)
  const showLogo = site.logo && (site.logoMode === 'image' || site.logoMode === 'both')

  return (
    <footer className="footer" data-footer={site.footerStyle}>
      <div className="container">
        <div className="footer-cols">
          <div className="footer-col">
            {showLogo && <img src={site.logo} alt="" className="footer-logo" />}
            {site.footerStyle === 'brandmark' ? (
              <div className="footer-brand">{name}</div>
            ) : (
              <h4>{name}</h4>
            )}
            <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
              {tagline}
            </p>
          </div>

          <div className="footer-col">
            <h4>{t('footer.explore')}</h4>
            <Link to="/">{t('nav.home')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
            {site.isPersonal && <Link to="/portfolio">{t('nav.portfolio')}</Link>}
            {site.isBusiness && <Link to="/services">{t('nav.services')}</Link>}
            {site.shop && <Link to="/products">{t('nav.shop')}</Link>}
            {site.contact && <Link to="/contact">{t('nav.contact')}</Link>}
          </div>

          <div className="footer-col">
            <h4>{t('footer.account')}</h4>
            {site.auth ? (
              <>
                <Link to="/login">{t('nav.signin')} / {t('nav.signup')}</Link>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </>
            ) : null}
            {!site.auth && site.hasOwnerCode ? (
              <Link to="/owner">🔑 {t('owner.footerLink')}</Link>
            ) : null}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} {name}</span>
          <span>{t('footer.builtWith')}</span>
        </div>
      </div>
    </footer>
  )
}
