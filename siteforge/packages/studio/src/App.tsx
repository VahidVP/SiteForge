import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Backend, Blueprint, CardStyle, ContentWidth, SiteType } from '@siteforge/shared'
import type { FooterStyle, HeaderStyle, HeroStyle, TemplateId } from '@siteforge/shared'

type HeaderId = HeaderStyle
type FooterId = FooterStyle
type HeroId = HeroStyle
import { fetchCatalog, generateSite } from './api'
import { Steps } from './components/Steps'
import { Toggle } from './components/Toggle'
import { LivePreview } from './components/LivePreview'
import { studioT } from './studioI18n'

const SITE_ICONS: Record<SiteType, string> = { personal: '👤', business: '🏢', shop: '🛍️' }
const STACK_ICONS: Record<Backend, string> = { django: '🐍', dotnet: '⚙️' }

// Transliterate Persian/Arabic (plus common diacritics) to ASCII so a Farsi
// site title still yields a usable latin folder name. Farsi digits become
// latin digits; the zero-width non-joiner becomes a dash.
const FA_TRANSMAP: Record<string, string> = {
  'آ': 'a', 'ا': 'a', 'أ': 'a', 'إ': 'e', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
  'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'ك': 'k', 'گ': 'g',
  'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ؤ': 'o', 'ه': 'h', 'ة': 'h',
  'ی': 'y', 'ي': 'y', 'ئ': 'e', 'ء': '',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '‌': '-', '‍': ''
}

function transliterateFa(value: string): string {
  return value.split('').map(ch => FA_TRANSMAP[ch] ?? ch).join('')
}

function smartSlug(value: string): string {
  const latin = transliterateFa(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
  return latin.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
}

export default function App() {
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchCatalog>> | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [step, setStep] = useState(0)
  const [siteType, setSiteType] = useState<SiteType | null>(null)
  const [template, setTemplate] = useState<TemplateId>('midnight')
  const [language, setLanguage] = useState<'en' | 'fa'>('en')
  const [bilingual, setBilingual] = useState(true)
  const [studioLang, setStudioLang] = useState<'en' | 'fa'>('en')
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('classic')
  const [footerStyle, setFooterStyle] = useState<FooterStyle>('columns')
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('glow-center')
  const [cardStyle, setCardStyle] = useState<CardStyle>('rounded')
  const [contentWidth, setContentWidth] = useState<ContentWidth>('cozy')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaLabelFa, setCtaLabelFa] = useState('')
  const [cardsTitle, setCardsTitle] = useState('')
  const [cardsTitleFa, setCardsTitleFa] = useState('')
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [heroError, setHeroError] = useState<string | null>(null)
  const [backend, setBackend] = useState<Backend>('django')
  const [modules, setModules] = useState<string[]>([])
  const [uiModules, setUiModules] = useState<string[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectTouched, setProjectTouched] = useState(false)
  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [titleFa, setTitleFa] = useState('')
  const [taglineFa, setTaglineFa] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [logoMode, setLogoMode] = useState<'text' | 'image' | 'both'>('text')
  const [accessCode, setAccessCode] = useState('')

  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const t = (key: string): string => studioT(studioLang, key) || key

  const cat = (category: string, item?: { id: string; label: string; description: string }) => {
    if (!item) return { label: '', description: '' }
    const base = `w.cat.${category}.${item.id}`
    return { label: studioT(studioLang, base) || item.label, description: studioT(studioLang, `${base}.desc`) || item.description }
  }

  const STEP_LABELS = [t('w.template'), t('w.design'), t('w.stack'), t('w.identity'), t('w.create')]

  // Loading the catalog retries with backoff: the generator API (vite-proxied to :4000)
  // can briefly reset connections while it restarts (ECONNRESET), and a single-shot
  // fetch used to leave the whole studio on a dead-end error screen with no way back.
  const retries = useRef(0)
  const loadCatalog = useCallback(async () => {
    try {
      const c = await fetchCatalog()
      setCatalog(c)
    } catch (err) {
      if (retries.current < 4) {
        retries.current += 1
        window.setTimeout(() => void loadCatalog(), 350 * retries.current)
      } else {
        setLoadError(err instanceof Error ? err.message : String(err))
      }
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    document.documentElement.lang = studioLang
    document.documentElement.dir = studioLang === 'fa' ? 'rtl' : 'ltr'
  }, [studioLang])

  function chooseSiteType(type: SiteType) {
    if (!catalog) return
    const preset = catalog.presets[type]
    setSiteType(type)
    setModules(preset.modules)
    setUiModules(preset.uiModules)
    setTemplate(preset.defaultTemplate)
    setHeaderStyle(preset.headerStyle)
    setFooterStyle(preset.footerStyle)
    setHeroStyle(preset.heroStyle)
    if (!title.trim()) setTitle(preset.defaultTitle)
    if (!tagline.trim()) setTagline(preset.defaultTagline)
  }

  function toggleModule(id: string, value: boolean) {
    setModules(current => (value ? [...current, id] : current.filter(m => m !== id)))
  }

  function toggleUi(id: string, value: boolean) {
    setUiModules(current => (value ? [...current, id] : current.filter(m => m !== id)))
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    // Only auto-fill the folder until the user edits it by hand — otherwise
    // every keystroke would clobber their manual choice. Prefer the English
    // title; fall back to the Farsi title transliterated to latin.
    if (!projectTouched) {
      const next = smartSlug(value) || (titleFa.trim() ? smartSlug(titleFa) : '')
      setProjectName(next)
    }
  }

  function handleTitleFaChange(value: string) {
    setTitleFa(value)
    // Bilingual Farsi-primary sites often fill the Farsi name first while the
    // English name is still empty — transliterate it so the folder is not blank.
    if (!projectTouched && !title.trim()) {
      setProjectName(smartSlug(value))
    }
  }

  function handleProjectNameChange(value: string) {
    setProjectName(value)
    setProjectTouched(true)
  }

  function handleLogoFile(file: File | undefined) {
    setLogo(null)
    if (!file) return
    if (file.type !== 'image/png') {
      setLogoError(t('w.logoPngOnly'))
      return
    }
    if (file.size > 450 * 1024) {
      setLogoError(t('w.logoTooBig'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setLogo(String(reader.result ?? ''))
      setLogoError(null)
      setLogoMode(mode => (mode === 'text' ? 'both' : mode))
    }
    reader.readAsDataURL(file)
  }

  function handleHeroFile(file: File | undefined) {
    setHeroImage(null)
    if (!file) return
    if (file.size > 450 * 1024) {
      setHeroError(t('w.logoTooBig'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setHeroImage(String(reader.result ?? ''))
      setHeroError(null)
    }
    reader.readAsDataURL(file)
  }

  // Recommended folder when the title can't slugify (e.g. Farsi-only):
  // transliterate first, then fall back to "<siteType>-site" so the field — and
  // the Next button — are never stuck empty with no hint of what to type.
  const folderSuggestion =
    smartSlug(title) || (titleFa.trim() ? smartSlug(titleFa) : '') || (siteType ? `${siteType}-site` : 'my-website')
  const folderValid = /^[a-z][a-z0-9-]{1,49}$/.test(projectName)

  async function runGenerate() {
    if (!siteType || !catalog) return
    setGenerating(true)
    setError(null)
    try {
      await generateSite({
        projectName: folderValid ? projectName : folderSuggestion,
        siteType,
        backend,
        database: 'sqlite',
        template,
        language,
        bilingual,
        headerStyle,
        footerStyle,
        heroStyle,
        ...(heroImage ? { heroImage } : {}),
        cardStyle,
        contentWidth,
        content: {
          ctaLabel: ctaLabel.trim(),
          ctaLabelFa: ctaLabelFa.trim(),
          cardsTitle: cardsTitle.trim(),
          cardsTitleFa: cardsTitleFa.trim()
        },
        modules,
        uiModules,
        branding: {
          title: title.trim(),
          tagline: tagline.trim(),
          ...(bilingual && titleFa.trim() ? { titleFa: titleFa.trim() } : {}),
          ...(bilingual && taglineFa.trim() ? { taglineFa: taglineFa.trim() } : {}),
          ...(logo ? { logo } : {}),
          logoMode
        },
        adminAccessCode: modules.includes('auth') ? undefined : accessCode || undefined
      } as Blueprint)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  function reset() {
    setStep(0); setSiteType(null); setTemplate('midnight'); setLanguage('en'); setBilingual(true); setBackend('django')
    setModules([]); setUiModules([]); setProjectName(''); setProjectTouched(false); setTitle(''); setTagline('')
    setCardStyle('rounded'); setContentWidth('cozy')
    setCtaLabel(''); setCtaLabelFa(''); setCardsTitle(''); setCardsTitleFa('')
    setTitleFa(''); setTaglineFa(''); setLogo(null); setLogoMode('text')
    setHeroImage(null); setHeroError(null)
    setAccessCode(''); setDone(false); setError(null)
  }

  if (loadError) {
    return (
      <div className="shell">
        <header className="topbar">
          <span className="logo">⚒️</span>
          <div><h1>SiteForge Studio</h1><p>{t('w.buildSubtitle')}</p></div>
          <button type="button" className="lang-toggle" style={{ marginLeft: 'auto' }} onClick={() => setStudioLang(s => s === 'en' ? 'fa' : 'en')}>
            {studioLang === 'en' ? 'فا' : 'EN'}
          </button>
        </header>
        <main className="container">
          <div className="card error-card">
            {loadError}
            <div className="error-retry">
              <button type="button" className="btn btn-primary" onClick={() => { retries.current = 0; setLoadError(null); void loadCatalog() }}>
                {t('w.retry')}
              </button>
              <span className="muted">{t('w.retryHint')}</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!catalog) {
    return <main className="container center"><p className="muted">{t('w.loadingStudio')}</p></main>
  }

  if (done) {
    return (
      <div className="shell">
        <header className="topbar">
          <span className="logo">⚒️</span>
          <div><h1>SiteForge Studio</h1><p>{t('w.readySubtitle')}</p></div>
          <button type="button" className="lang-toggle" style={{ marginLeft: 'auto' }} onClick={() => setStudioLang(s => s === 'en' ? 'fa' : 'en')}>
            {studioLang === 'en' ? 'فا' : 'EN'}
          </button>
        </header>
        <main className="container page-narrow">
          <div className="card success-card">
            <span className="success-icon">🎉</span>
            <h2>{title} {t('w.generated')}</h2>
            <p className="muted">
              {t('w.zipNote')} {t('w.frontendNote')}
              {backend === 'django'
                ? t('w.backendDjango')
                : t('w.backendDotnet')}
            </p>
            {!modules.includes('auth') && accessCode ? (
              <p className="muted tip">🔑 {t('w.ownerCodeTip')} <strong>{accessCode}</strong></p>
            ) : null}
            {modules.includes('shop-catalog') ? (
              <p className="muted tip">💳 {t('w.paymentsTip')}</p>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={reset}>{t('w.buildAnother')}</button>
          </div>
        </main>
      </div>
    )
  }

  const shopOn = modules.includes('shop-catalog')
  const authOn = modules.includes('auth')
  // The owner access code is mandatory whenever User Accounts is off — it is the
  // only key to /owner, so it can never be empty or weaker than the backend allows.
  const accessCodeOk = authOn || /^[A-Za-z0-9@#$_-]{4,64}$/.test(accessCode.trim())
  const canNext =
    (step === 0 && siteType !== null) ||
    step === 1 || step === 2 ||
    (step === 3 && title.trim().length > 1 && /^[a-z][a-z0-9-]{1,49}$/.test(projectName) && accessCodeOk)

  return (
    <div className="shell">
      <header className="topbar">
        <span className="logo">⚒️</span>
        <div><h1>SiteForge Studio</h1><p>{t('w.buildSubtitle')}</p></div>
        <button type="button" className="lang-toggle" style={{ marginLeft: 'auto' }} onClick={() => setStudioLang(s => s === 'en' ? 'fa' : 'en')}>
          {studioLang === 'en' ? 'فا' : 'EN'}
        </button>
      </header>

      <main className="container">
        <Steps labels={STEP_LABELS} current={step} />

        <div className="wizard-grid">
          <aside className="wizard-aside">
            <LivePreview
              catalog={catalog}
              siteType={siteType}
              template={template}
              language={language}
              bilingual={bilingual}
              headerStyle={headerStyle}
              footerStyle={footerStyle}
              heroStyle={heroStyle}
              heroImage={heroImage}
              cardStyle={cardStyle}
              contentWidth={contentWidth}
              ctaLabel={ctaLabel}
              ctaLabelFa={ctaLabelFa}
              cardsTitle={cardsTitle}
              cardsTitleFa={cardsTitleFa}
              modules={modules}
              uiModules={uiModules}
              title={title}
              tagline={tagline}
              titleFa={titleFa}
              taglineFa={taglineFa}
              logo={logo}
              logoMode={logoMode}
              eyebrow={t('w.livePreview')}
              hint={t('w.livePreviewHint')}
            />
          </aside>

          <div className="wizard-main">
        {step === 0 && (
          <section>
            <h2>{t('w.whatKind')}</h2>
            <div className="grid grid-3">
              {catalog.siteTypes.map(type => (
                <button key={type.id} type="button"
                  className={siteType === type.id ? 'card option selected' : 'card option lift'}
                  onClick={() => chooseSiteType(type.id)}>
                  <span className="option-icon">{SITE_ICONS[type.id]}</span>
                  <span className="option-label">{cat('siteTypes', type).label}</span>
                  <span className="option-desc muted">{cat('siteTypes', type).description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h2>{t('w.pickDesign')}</h2>

            <h3 className="subsection">{t('w.colorTemplate')}</h3>
            <div className="grid grid-3">
              {catalog.templates.map(tpl => (
                <button key={tpl.id} type="button"
                  className={template === tpl.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setTemplate(tpl.id)}>
                  <span className="swatch" style={{ background: tpl.swatchBg }}>
                    <span className="swatch-dot" style={{ background: tpl.swatchAccent }} />
                    <span className="swatch-bar" style={{ background: tpl.swatchAccent }} />
                    <span className="swatch-line" />
                  </span>
                  <span className="option-label">{cat('templates', tpl).label}</span>
                  <span className="option-desc muted">{cat('templates', tpl).description}</span>
                </button>
              ))}
            </div>

            <h3 className="subsection">{t('w.headerDesign')}</h3>
            <div className="grid grid-3">
              {catalog.headerStyles.map(hs => (
                <button key={hs.id} type="button"
                  className={headerStyle === hs.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setHeaderStyle(hs.id as HeaderId)}>
                  <MiniHeader id={hs.id} />
                  <span className="option-label">{cat('headerStyles', hs).label}</span>
                  <span className="option-desc muted">{cat('headerStyles', hs).description}</span>
                </button>
              ))}
            </div>

            <h3 className="subsection">{t('w.heroDesign')}</h3>
            <div className="grid grid-3">
              {catalog.heroStyles.map(hero => (
                <button key={hero.id} type="button"
                  className={heroStyle === hero.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setHeroStyle(hero.id as HeroId)}>
                  <MiniHero id={hero.id} accent="#7c5cff" accent2="#22d3ee" />
                  <span className="option-label">{cat('heroStyles', hero).label}</span>
                  <span className="option-desc muted">{cat('heroStyles', hero).description}</span>
                </button>
              ))}
            </div>

            {catalog.heroStyles.find(h => h.id === heroStyle)?.image ? (
              <div className="field" style={{ marginTop: 14, maxWidth: 460 }}>
                <span>{t('w.heroImage')}</span>
                <div className="logo-row">
                  {heroImage ? (
                    <img src={heroImage} alt="" className="logo-preview" style={{ width: 88, height: 88, objectFit: 'cover' }} />
                  ) : (
                    <span className="logo-placeholder">IMG</span>
                  )}
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    {t('w.uploadHero')}
                    <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => handleHeroFile(event.target.files?.[0])} />
                  </label>
                  {heroImage ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHeroImage(null)}>
                      {t('w.removeLogo')}
                    </button>
                  ) : null}
                </div>
                <span className="muted" style={{ fontSize: '0.8rem' }}>{t('w.heroImageHint')}</span>
                {heroError ? <p className="hint-error">{heroError}</p> : null}
              </div>
            ) : null}

            <h3 className="subsection">{t('w.primaryLang')}</h3>
            <div className="grid grid-2" style={{ maxWidth: 460 }}>
              {catalog.languages.map(l => (
                <button key={l.id} type="button"
                  className={language === l.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setLanguage(l.id)}>
                  <span className="option-label" style={{ fontFamily: l.id === 'fa' ? 'Vazirmatn, sans-serif' : undefined }}>{l.native}</span>
                  <span className="option-desc muted">
                    {l.id === 'fa' ? t('w.langFaHint') : t('w.langEnHint')} {bilingual ? t('w.visitorsCanSwitch') : t('w.singleLang')}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16, maxWidth: 460 }}>
              <Toggle label={t('w.bilingual')} description={t('w.bilingualDesc')} checked={bilingual} onChange={setBilingual} />
            </div>

            <h3 className="subsection">{t('w.animModule')}</h3>
            <p className="muted" style={{ margin: '4px 0 0' }}>{t('w.animDesc')}</p>
            <div className="anim-picker">
              {catalog.uiModules.map(ui => {
                const on = uiModules.includes(ui.id)
                const anim = cat('ui', ui)
                return (
                  <label key={ui.id} className={on ? 'card anim-pick selected' : 'card anim-pick'}>
                    <LiveAnimation id={ui.id} lang={studioLang} />
                    <span className="anim-pick-title">
                      <input type="checkbox" checked={on} onChange={event => toggleUi(ui.id, event.target.checked)} />
                      {anim.label}
                    </span>
                    <span className="muted anim-pick-desc">{anim.description}</span>
                  </label>
                )
              })}
            </div>

            <h3 className="subsection">{t('w.footerDesign')}</h3>
            <div className="grid grid-3">
              {catalog.footerStyles.map(fs => (
                <button key={fs.id} type="button"
                  className={footerStyle === fs.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setFooterStyle(fs.id as FooterId)}>
                  <MiniFooter id={fs.id} />
                  <span className="option-label">{cat('footerStyles', fs).label}</span>
                  <span className="option-desc muted">{cat('footerStyles', fs).description}</span>
                </button>
              ))}
            </div>

            <h3 className="subsection">{t('w.cardStyle')}</h3>
            <p className="muted" style={{ margin: '4px 0 0' }}>{t('w.cardStyleDesc')}</p>
            <div className="grid grid-3" style={{ maxWidth: 560 }}>
              {(['rounded', 'soft', 'sharp'] as const).map(id => (
                <button key={id} type="button"
                  className={cardStyle === id ? 'card option selected' : 'card option lift'}
                  onClick={() => setCardStyle(id)}>
                  <span className="mini-preview" style={{ justifyContent: 'center' }}>
                    <span style={{
                      width: 72, height: 40,
                      borderRadius: id === 'soft' ? 20 : id === 'sharp' ? 4 : 12,
                      background: 'rgba(255,255,255,.10)',
                      border: '1px solid rgba(255,255,255,.18)'
                    }} />
                  </span>
                  <span className="option-label">{id === 'rounded' ? t('w.cardRounded') : id === 'soft' ? t('w.cardSoft') : t('w.cardSharp')}</span>
                </button>
              ))}
            </div>

            <h3 className="subsection">{t('w.pageWidth')}</h3>
            <p className="muted" style={{ margin: '4px 0 0' }}>{t('w.pageWidthDesc')}</p>
            <div className="grid grid-2" style={{ maxWidth: 460 }}>
              {(['cozy', 'wide'] as const).map(id => (
                <button key={id} type="button"
                  className={contentWidth === id ? 'card option selected' : 'card option lift'}
                  onClick={() => setContentWidth(id)}>
                  <span className="mini-preview" style={{ justifyContent: 'center' }}>
                    <span style={{
                      width: id === 'wide' ? 88 : 56, height: 30,
                      borderRadius: 6, background: 'rgba(255,255,255,.10)',
                      border: '1px solid rgba(255,255,255,.18)'
                    }} />
                  </span>
                  <span className="option-label">{id === 'cozy' ? t('w.widthCozy') : t('w.widthWide')}</span>
                </button>
              ))}
            </div>

            <h3 className="subsection">{t('w.siteText')}</h3>
            <p className="muted" style={{ margin: '4px 0 0' }}>{t('w.siteTextDesc')}</p>
            <div className="card form-card" style={{ marginTop: 10, maxWidth: 640 }}>
              {(bilingual
                ? [
                    { value: ctaLabel, set: setCtaLabel, label: `${t('w.ctaLabel')} (EN)`, dir: 'ltr', ph: t('w.ctaLabelPh') },
                    { value: ctaLabelFa, set: setCtaLabelFa, label: `${t('w.ctaLabel')} (FA)`, dir: 'rtl', ph: t('w.ctaLabelPh') },
                    { value: cardsTitle, set: setCardsTitle, label: `${t('w.cardsTitle')} (EN)`, dir: 'ltr', ph: t('w.cardsTitlePh') },
                    { value: cardsTitleFa, set: setCardsTitleFa, label: `${t('w.cardsTitle')} (FA)`, dir: 'rtl', ph: t('w.cardsTitlePh') }
                  ]
                : [
                    { value: language === 'fa' ? ctaLabelFa : ctaLabel, set: language === 'fa' ? setCtaLabelFa : setCtaLabel, label: t('w.ctaLabel'), dir: language === 'fa' ? 'rtl' : 'ltr', ph: t('w.ctaLabelPh') },
                    { value: language === 'fa' ? cardsTitleFa : cardsTitle, set: language === 'fa' ? setCardsTitleFa : setCardsTitle, label: t('w.cardsTitle'), dir: language === 'fa' ? 'rtl' : 'ltr', ph: t('w.cardsTitlePh') }
                  ]
              ).map(field => (
                <label className="field" key={field.label}><span>{field.label}</span>
                  <input value={field.value} dir={field.dir as 'ltr' | 'rtl'} placeholder={field.ph} onChange={event => field.set(event.target.value)} /></label>
              ))}
            </div>

            <h3 className="subsection">{t('w.chooseFeatures')}</h3>
            <div className="stack">
              {catalog.modules.map(module => {
                const mod = cat('modules', module)
                return (
                  <Toggle
                    key={module.id}
                    label={mod.label}
                    description={mod.description}
                    checked={module.locked ? true : modules.includes(module.id)}
                    disabled={Boolean(module.locked) || (module.id === 'auth' && shopOn)}
                    soon={module.status === 'soon'}
                    includedText={t('w.included')}
                    comingSoonText={t('w.comingSoon')}
                    onChange={value => toggleModule(module.id, value)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>{t('w.whichTech')}</h2>
            <div className="grid grid-2">
              {catalog.backends.map(item => (
                <button key={item.id} type="button"
                  className={backend === item.id ? 'card option selected' : 'card option lift'}
                  onClick={() => setBackend(item.id)}>
                  <span className="option-icon">{STACK_ICONS[item.id]}</span>
                  <span className="option-label">{cat('backends', item).label}</span>
                  <span className="option-desc muted">{cat('backends', item).description}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>{t('w.identityAccess')}</h2>
            <div className="card form-card">
              {bilingual ? (
                <>
                  {/* Primary language fields come first so the Farsi fields are not
                      mistaken for the English ones (and vice versa) when the site's
                      primary language is Farsi. */}
                  {(language === 'fa'
                    ? [
                        { value: titleFa, set: handleTitleFaChange, label: t('w.siteNameFa'), dir: 'rtl' },
                        { value: title, set: handleTitleChange, label: t('w.siteNameEn'), dir: 'ltr' },
                        { value: taglineFa, set: setTaglineFa, label: t('w.taglineFa'), dir: 'rtl' },
                        { value: tagline, set: setTagline, label: t('w.taglineEn'), dir: 'ltr' }
                      ]
                    : [
                        { value: title, set: handleTitleChange, label: t('w.siteNameEn'), dir: 'ltr' },
                        { value: titleFa, set: handleTitleFaChange, label: t('w.siteNameFa'), dir: 'rtl' },
                        { value: tagline, set: setTagline, label: t('w.taglineEn'), dir: 'ltr' },
                        { value: taglineFa, set: setTaglineFa, label: t('w.taglineFa'), dir: 'rtl' }
                      ]
                  ).map(field => (
                    <label className="field" key={field.label}><span>{field.label}</span>
                      <input value={field.value} dir={field.dir} onChange={event => field.set(event.target.value)} /></label>
                  ))}
                </>
              ) : (
                <>
                  <label className="field"><span>{language === 'fa' ? t('w.siteNameFa') : t('w.siteNameEn')}</span>
                    <input value={title} dir={language === 'fa' ? 'rtl' : 'ltr'} onChange={event => handleTitleChange(event.target.value)} /></label>
                  <label className="field"><span>{language === 'fa' ? t('w.taglineFa') : t('w.taglineEn')}</span>
                    <input value={tagline} dir={language === 'fa' ? 'rtl' : 'ltr'} onChange={event => setTagline(event.target.value)} /></label>
                </>
              )}
              <label className="field"><span>{t('w.folder')}</span>
                <input value={projectName} dir="ltr" placeholder={folderSuggestion} onChange={event => handleProjectNameChange(event.target.value)} />
                <span className="muted" style={{ fontSize: '0.8rem' }}>
                  {language === 'fa' || !/^[a-z0-9-]*$/.test(title) ? t('w.folderFaHint') : t('w.folderHint')}
                </span>
                {!folderValid && (title.trim() || titleFa.trim()) ? (
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className="muted" style={{ fontSize: '0.8rem' }} dir="ltr">{folderSuggestion}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setProjectName(folderSuggestion); setProjectTouched(true) }}
                    >
                      {t('w.useSuggestion')}
                    </button>
                  </span>
                ) : null}
              </label>

              <div className="field">
                <span>{t('w.logoTitle')}</span>
                <div className="logo-row">
                  {logo ? (
                    <img src={logo} alt="" className="logo-preview" />
                  ) : (
                    <span className="logo-placeholder">PNG</span>
                  )}
                  <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                    {t('w.uploadLogo')}
                    <input type="file" accept="image/png" hidden onChange={event => handleLogoFile(event.target.files?.[0])} />
                  </label>
                  {logo ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLogo(null)}>
                      {t('w.removeLogo')}
                    </button>
                  ) : null}
                </div>
                <span className="muted" style={{ fontSize: '0.8rem' }}>{t('w.logoHint')}</span>
                {logoError ? <p className="hint-error">{logoError}</p> : null}
              </div>

              <div className="field">
                <span>{t('w.logoMode')}</span>
                <div className="mode-row">
                  {(['text', 'image', 'both'] as const).map(mode => (
                    <label key={mode} className="chip-pick">
                      <input type="radio" name="logoMode" checked={logoMode === mode}
                        onChange={() => setLogoMode(mode)} disabled={!logo && mode !== 'text'} />
                      <span>{mode === 'text' ? t('w.logoText') : mode === 'image' ? t('w.logoImage') : t('w.logoBoth')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {!authOn ? (
                <label className="field">
                  <span>{t('w.ownerCode')}</span>
                  <input value={accessCode} minLength={4} required
                    onChange={event => setAccessCode(event.target.value)} />
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {t('w.ownerHint')}
                  </span>
                  {!accessCodeOk ? (
                    <p className="hint-error">{t('w.ownerCodeRequired')}</p>
                  ) : null}
                </label>
              ) : null}
              {!/^[a-z][a-z0-9-]*$/.test(projectName) && projectName.length > 0 ? (
                <p className="hint-error">{t('w.folderHint')}</p>
              ) : null}
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2>{t('w.ready')}</h2>
            <div className="summary card">
              <div className="summary-row"><span className="muted">{t('w.designSummary')}</span>
                <span>{cat('templates', catalog.templates.find(x => x.id === template)).label} · {cat('headerStyles', catalog.headerStyles.find(x => x.id === headerStyle)).label} {t('w.summaryHeader')} · {cat('heroStyles', catalog.heroStyles.find(x => x.id === heroStyle)).label} {t('w.summaryHero')} · {(cardStyle === 'soft' ? t('w.cardSoft') : cardStyle === 'sharp' ? t('w.cardSharp') : t('w.cardRounded'))} · {(contentWidth === 'wide' ? t('w.widthWide') : t('w.widthCozy'))}</span></div>
              <div className="summary-row"><span className="muted">{t('w.langSummary')}</span>
                <span>{language === 'fa' ? t('w.farsiFirst') : t('w.englishFirst')} {bilingual ? t('w.switchable') : t('w.singleLang')}</span></div>
              <div className="summary-row"><span className="muted">{t('w.stackSummary')}</span>
                <span>{STACK_ICONS[backend]} {cat('backends', catalog.backends.find(b => b.id === backend)).label} {t('w.plusReact')}</span></div>
              <div className="summary-row"><span className="muted">{t('w.animSummary')}</span>
                <span>{uiModules.map(id => cat('ui', catalog.uiModules.find(u => u.id === id)).label).join(' · ') || `0 ${t('w.summarySelected')}`}</span></div>
              <div className="summary-row"><span className="muted">{t('w.nameSummary')}</span><span>{title}</span></div>
            </div>
            {error ? <div className="card error-card">{error}</div> : null}
            <button type="button" className="btn btn-primary btn-lg" onClick={runGenerate} disabled={generating}>
              {generating ? t('w.building') : t('w.generate')}
            </button>
          </section>
        )}

        <footer className="wizard-footer">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>{t('w.back')}</button>
          {step < 4 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext}>{t('w.next')}</button>
          ) : null}
        </footer>
          </div>
        </div>
      </main>
    </div>
  )
}

function MiniHeader({ id }: { id: string }) {
  const bar = '#1e2438'
  if (id === 'glass') {
    return (
      <span className="mini-preview" style={{ background: '#0b1020', padding: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ background: 'color-mix(in srgb, #0b1020 72%, transparent)', backgroundColor: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 999, padding: '5px 10px', display: 'flex', gap: 5, alignItems: 'center', width: '88%', justifyContent: 'space-between', boxShadow: '0 6px 24px rgba(0,0,0,.35)', backdropFilter: 'blur(10px)' }}>
          <i style={{ width: 12 }} /><span style={{ display: 'flex', gap: 4 }}><i style={{ width: 10 }} /><i style={{ width: 10 }} /><i style={{ width: 10 }} /></span><b style={{ width: 16 }} />
        </span>
      </span>
    )
  }
  if (id === 'bordered') {
    return (
      <span className="mini-preview" style={{ background: bar, position: 'relative', borderBottom: '3px solid #7c5cff' }}>
        <span style={{ flex: 1, display: 'flex', gap: 4 }}><i /><i /><i /></span>
        <b style={{ width: 14 }} />
      </span>
    )
  }
  if (id === 'minimal') {
    return (
      <span className="mini-preview" style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,.15)' }}>
        <span style={{ opacity: .5, display: 'flex', gap: 6, alignItems: 'center' }}><i style={{ width: 14 }} /><i /><i /></span><b style={{ opacity: .6 }} />
      </span>
    )
  }
  if (id === 'centered') {
    return (
      <span className="mini-preview" style={{ background: bar }}>
        <i style={{ width: 12 }} /><span style={{ display: 'flex', gap: 4, marginInline: 'auto' }}><i /><i /><i /></span><b style={{ width: 14 }} />
      </span>
    )
  }
  return (
    <span className="mini-preview" style={{ background: bar }}>
      <i style={{ width: 12 }} /><span style={{ display: 'flex', gap: 4, marginInline: 'auto' }}><i /><i /></span><b style={{ width: 14 }} />
    </span>
  )
}

function MiniFooter({ id }: { id: string }) {
  const bg = '#1a2036'
  if (id === 'brandmark') {
    return (
      <span className="mini-preview" style={{ background: bg, flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>BRAND</span>
        <span style={{ display: 'flex', gap: 6 }}><i /><i /><i /></span>
      </span>
    )
  }
  if (id === 'centered') {
    return (
      <span className="mini-preview" style={{ background: bg, flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <b /><i /><i />
      </span>
    )
  }
  if (id === 'simple') {
    return <span className="mini-preview" style={{ background: bg }}><i /><b /><i /></span>
  }
  if (id === 'split') {
    return <span className="mini-preview" style={{ background: bg }}><b style={{ marginInlineEnd: 'auto' }} /><i /><i /></span>
  }
  return (
    <span className="mini-preview" style={{ background: bg, alignItems: 'stretch' }}>
      <span style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}><b /><i /><i /></span>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}><i /><i /></span>
    </span>
  )
}

function MiniHero({ id, accent, accent2 }: { id: string; accent: string; accent2: string }) {
  const [spot, setSpot] = useState({ x: 65, y: 40 })
  function trackSpot(e: React.MouseEvent<HTMLSpanElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setSpot({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  if (id === 'split') {
    return (
      <span className="mini-preview" style={{ gap: 8, textAlign: 'start', padding: 8 }}>
        <span style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}><b style={{ width: 48 }} /><i style={{ width: 60 }} /><i style={{ width: 34, height: 8, background: accent, borderRadius: 6, marginTop: 2 }} /></span>
        <span style={{ flex: .9, height: '100%', borderRadius: 8, background: `radial-gradient(40px 40px at 30% 30%, ${accent} 0%, transparent 70%), radial-gradient(44px 44px at 70% 70%, ${accent2} 45%, transparent 70%), #111731`, border: `1px solid ${accent}66`, position: 'relative', overflow: 'hidden' }} />
      </span>
    )
  }
  if (id === 'spotlight') {
    return (
      <span className="mini-preview" onMouseMove={trackSpot} style={{ background: `radial-gradient(52px circle at ${spot.x}% ${spot.y}%, ${accent}44, transparent 68%)`, cursor: 'crosshair', position: 'relative', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <b style={{ width: 56 }} /><i style={{ width: 68 }} /><i style={{ width: 28, height: 6, background: accent, borderRadius: 999 }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 8, pointerEvents: 'none', border: '1px solid transparent' }} />
      </span>
    )
  }
  if (id === 'waves') {
    return (
      <span className="mini-preview" style={{ position: 'relative', overflow: 'hidden', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ position: 'absolute', insetInline: '-25%', bottom: -18, height: 22, borderRadius: '45%', background: `${accent}3d`, animation: 'wave-spin 11s linear infinite' }} />
        <span style={{ position: 'absolute', insetInline: '-25%', bottom: -24, height: 26, borderRadius: '45%', background: `${accent2}22`, animation: 'wave-spin 17s linear reverse infinite', opacity: .55 }} />
        <b style={{ zIndex: 1, width: 54 }} /><i style={{ zIndex: 1, width: 62 }} />
      </span>
    )
  }
  if (id === 'grid') {
    return (
      <span className="mini-preview mini-grid" style={{ background: `repeating-linear-gradient(0deg, ${accent}26 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, ${accent}26 0 1px, transparent 1px 9px)`, position: 'relative', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden' }}>
        <span style={{ position: 'absolute', insetInline: '-40%', top: '-30%', bottom: '-10%', backgroundImage: `linear-gradient(${accent}26 1px, transparent 1px), linear-gradient(90deg, ${accent}26 1px, transparent 1px)`, backgroundSize: '10px 10px', transform: 'perspective(60px) rotateX(58deg)', opacity: .7, pointerEvents: 'none' }} />
        <b style={{ zIndex: 1, width: 48 }} /><i style={{ zIndex: 1, width: 62 }} />
      </span>
    )
  }
  return (
    <span className="mini-preview" style={{ background: `radial-gradient(60px 30px at 30% 20%, ${accent}66, transparent), radial-gradient(50px 26px at 75% 75%, ${accent2}55, transparent)` }}>
      <b style={{ width: 54 }} /><i style={{ width: 64 }} /><i style={{ width: 28, height: 6, background: accent, borderRadius: 999 }} />
    </span>
  )
}

function useVisible(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function RevealDemo({ lang }: { lang: 'en' | 'fa' }) {
  const { ref, visible } = useVisible()
  return (
    <div className="anim-demo" ref={ref}>
      <span className="demo-chips" key={visible ? 'on' : 'off'}>
        {[0, 1, 2].map(i => (
          <span key={i} className="demo-chip" style={{ animation: visible ? `fade-up 0.55s cubic-bezier(0.22,0.61,0.36,1) ${i * 90}ms both` : 'none' }} />
        ))}
      </span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.reveal')}</div>
    </div>
  )
}

function LiftDemo({ lang }: { lang: 'en' | 'fa' }) {
  return (
    <div className="anim-demo anim-hover-lift-demo">
      <span className="demo-lift-card" />
      <div className="demo-note">{studioT(lang, 'w.demoNote.lift')}</div>
    </div>
  )
}

function CascadeDemo({ lang }: { lang: 'en' | 'fa' }) {
  const { ref, visible } = useVisible()
  const words = (lang === 'fa' ? 'آبشار کلمات' : 'Word Cascade').split(' ')
  return (
    <div className="anim-demo" ref={ref}>
      <span className="word-cascade" key={visible ? 'on' : 'off'}>
        {words.map((w, i) => (
          <span
            key={i}
            className="word"
            style={{ animation: visible ? `word-in 0.5s cubic-bezier(0.22,0.61,0.36,1) ${120 + i * 110}ms forwards` : 'none' }}
          >
            {w}
          </span>
        ))}
      </span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.textReveal')}</div>
    </div>
  )
}

function TiltDemo({ lang }: { lang: 'en' | 'fa' }) {
  const { ref } = useVisible()
  function handleTiltMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = e.currentTarget.querySelector('.demo-tilt-card') as HTMLElement | null
    if (!card) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    card.style.transform = `rotateY(${px * 14}deg) rotateX(${py * -14}deg)`
  }
  function handleTiltLeave(e: React.MouseEvent<HTMLDivElement>) {
    const card = e.currentTarget.querySelector('.demo-tilt-card') as HTMLElement | null
    if (card) card.style.transform = ''
  }
  return (
    <div className="anim-demo tilt-stage" ref={ref} onMouseMove={handleTiltMove} onMouseLeave={handleTiltLeave}>
      <span className="demo-tilt-outer">
        <b className="demo-tilt-card" />
      </span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.tilt')}</div>
    </div>
  )
}

function MagneticDemo({ lang }: { lang: 'en' | 'fa' }) {
  function handleMagMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const inner = e.currentTarget.querySelector('.demo-magnetic-pill') as HTMLElement | null
    if (inner) inner.style.transform = `translate(${dx * 0.18}px, ${dy * 0.18}px)`
  }
  function handleMagLeave(e: React.MouseEvent<HTMLDivElement>) {
    const inner = e.currentTarget.querySelector('.demo-magnetic-pill') as HTMLElement | null
    if (inner) inner.style.transform = 'translate(0,0)'
  }
  return (
    <div className="anim-demo demo-magnetic" onMouseMove={handleMagMove} onMouseLeave={handleMagLeave}>
      <span className="demo-magnetic-pill">✦</span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.magnetic')}</div>
    </div>
  )
}

function AuroraDemo({ lang }: { lang: 'en' | 'fa' }) {
  return (
    <div className="anim-demo aurora-demo">
      <span className="aurora-blob aurora-a" style={{ opacity: 0.55 }} />
      <span className="aurora-blob aurora-b" style={{ opacity: 0.45 }} />
      <span className="aurora-center" />
      <div className="demo-note">{studioT(lang, 'w.demoNote.aurora')}</div>
    </div>
  )
}

function MarqueeDemo({ lang }: { lang: 'en' | 'fa' }) {
  const words = [studioT(lang, 'w.marquee1'), studioT(lang, 'w.marquee2'), studioT(lang, 'w.marquee3'), studioT(lang, 'w.marquee4')]
  return (
    <div className="marquee-strip" style={{ borderRadius: 10, marginTop: 0 }}>
      <div className="marquee-track">
        {[...Array(2)].flatMap((_, r) =>
          words.map((txt, i) => (
            <span key={`${r}-${i}`} className="marquee-item" style={{ fontSize: '.85rem' }}>{txt} ✦</span>
          ))
        )}
      </div>
      <div className="demo-note">{studioT(lang, 'w.demoNote.marquee')}</div>
    </div>
  )
}

function LiveAnimation({ id, lang }: { id: string; lang: 'en' | 'fa' }) {
  switch (id) {
    case 'anim.reveal': return <RevealDemo lang={lang} />
    case 'anim.hover-lift': return <LiftDemo lang={lang} />
    case 'anim.text-reveal': return <CascadeDemo lang={lang} />
    case 'anim.tilt': return <TiltDemo lang={lang} />
    case 'anim.magnetic': return <MagneticDemo lang={lang} />
    case 'anim.aurora': return <AuroraDemo lang={lang} />
    case 'anim.marquee': return <MarqueeDemo lang={lang} />
    case 'anim.float': return <FloatDemo lang={lang} />
    case 'anim.zoom': return <ZoomDemo lang={lang} />
    case 'anim.shine': return <ShineDemo lang={lang} />
    default: return null
  }
}

function FloatDemo({ lang }: { lang: 'en' | 'fa' }) {
  return (
    <div className="anim-demo" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0, 1].map(i => (
        <span key={i} className="demo-lift-card" style={{ animation: `float-y 5s ease-in-out ${i * 0.6}s infinite` }} />
      ))}
      <div className="demo-note">{studioT(lang, 'w.demoNote.float')}</div>
    </div>
  )
}

function ZoomDemo({ lang }: { lang: 'en' | 'fa' }) {
  return (
    <div className="anim-demo anim-hover-lift-demo">
      <span className="demo-lift-card" style={{ overflow: 'hidden' }}>
        <span style={{ display: 'block', width: '100%', height: '100%', background: 'linear-gradient(135deg,#7c5cff,#22d3ee)', transition: 'transform .5s ease' }} className="demo-zoom-inner" />
      </span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.zoom')}</div>
    </div>
  )
}

function ShineDemo({ lang }: { lang: 'en' | 'fa' }) {
  return (
    <div className="anim-demo" style={{ display: 'flex', justifyContent: 'center' }}>
      <span className="demo-magnetic-pill" style={{ position: 'relative', overflow: 'hidden' }}>
        ✦
        <span style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', left: '-60%', background: 'linear-gradient(105deg, transparent, rgba(255,255,255,.55), transparent)', transform: 'skewX(-20deg)', animation: 'shine-sweep 2.2s ease infinite' }} />
      </span>
      <div className="demo-note">{studioT(lang, 'w.demoNote.shine')}</div>
    </div>
  )
}
