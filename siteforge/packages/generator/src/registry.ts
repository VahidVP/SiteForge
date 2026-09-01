import type {
  Backend,
  Catalog,
  Language,
  ModuleInfo,
  PresetInfo,
  SiteType,
  TemplateId,
  UiModuleInfo
} from '@siteforge/shared';

export const MODULES: ModuleInfo[] = [
  { id: 'pages', label: 'Content Pages', description: 'Editable Home and About pages with a hero section.', status: 'available', locked: true },
  { id: 'contact-form', label: 'Contact Form', description: 'Visitors can send messages; the owner reads them in the admin panel.', status: 'available' },
  { id: 'auth', label: 'User Accounts', description: 'Sign up, sign in, dashboards and the admin panel.', status: 'available' },
  { id: 'shop-catalog', label: 'Product Catalog + Cart', description: 'Products, cart, checkout and support tickets.', status: 'available' },
  { id: 'blog', label: 'Blog', description: 'Posts with rich text and tags.', status: 'soon' }
];

export const UI_MODULES: UiModuleInfo[] = [
  { id: 'anim.reveal', label: 'Scroll Reveal', description: 'Sections fade and rise into view while scrolling.' },
  { id: 'anim.hover-lift', label: 'Hover Lift Cards', description: 'Cards gently float up on hover.' },
  { id: 'anim.text-reveal', label: 'Word Cascade', description: 'Hero title words cascade in one by one (Apple-style).' },
  { id: 'anim.tilt', label: '3D Tilt Cards', description: 'Cards tilt toward the cursor in 3D like high-end portfolios.' },
  { id: 'anim.magnetic', label: 'Magnetic Buttons', description: 'Buttons are gently pulled toward the cursor.' },
  { id: 'anim.aurora', label: 'Aurora Glow', description: 'Slow-moving gradient aurora behind the hero (Stripe-style).' },
  { id: 'anim.marquee', label: 'Ticker Strip', description: 'Infinite scrolling text ribbon under the hero.' }
];

/**
 * Single source of truth for template palettes.
 * The generated site's `themes.css` is rendered from these values (see themes.css.hbs)
 * and the Studio's live preview consumes them via /api/catalog — keep them identical.
 */
export const TEMPLATES: Catalog['templates'] = [
  {
    id: 'midnight', label: 'Midnight', description: 'Deep dark with violet glow — tech and startups.', swatchBg: '#0b1020', swatchAccent: '#7c5cff',
    theme: {
      bg: '#0b1020', bgSoft: '#111731', surface: 'rgba(255,255,255,0.045)', surfaceStrong: 'rgba(255,255,255,0.09)', border: 'rgba(255,255,255,0.09)',
      text: '#e8ebf5', muted: '#9aa3bd', accent: '#7c5cff', accent2: '#22d3ee', accentContrast: '#fff',
      fontHead: "'Sora', system-ui, sans-serif", fontBody: "'Inter', system-ui, sans-serif", glowOpacity: 0.32
    }
  },
  {
    id: 'paper', label: 'Paper', description: 'Warm light, editorial serif — writers and portfolios.', swatchBg: '#faf6ef', swatchAccent: '#c2410c',
    theme: {
      bg: '#faf6ef', bgSoft: '#f1eadd', surface: 'rgba(28,25,23,0.035)', surfaceStrong: 'rgba(28,25,23,0.07)', border: 'rgba(28,25,23,0.12)',
      text: '#1c1917', muted: '#6b6157', accent: '#c2410c', accent2: '#a16207', accentContrast: '#fff',
      fontHead: "'Lora', Georgia, serif", fontBody: "'Nunito', system-ui, sans-serif", glowOpacity: 0.16
    }
  },
  {
    id: 'sunset', label: 'Sunset', description: 'Colorful purple with orange-pink energy — bold brands.', swatchBg: '#170f2b', swatchAccent: '#ff7a59',
    theme: {
      bg: '#170f2b', bgSoft: '#221540', surface: 'rgba(255,255,255,0.05)', surfaceStrong: 'rgba(255,255,255,0.1)', border: 'rgba(255,160,120,0.18)',
      text: '#fdf3ec', muted: '#c4a8c9', accent: '#ff7a59', accent2: '#ff4d9d', accentContrast: '#2b0f05',
      fontHead: "'Manrope', system-ui, sans-serif", fontBody: "'Manrope', system-ui, sans-serif", glowOpacity: 0.42
    }
  },
  {
    id: 'forest', label: 'Forest', description: 'Calm deep green — organic shops and wellness.', swatchBg: '#0c1512', swatchAccent: '#34d399',
    theme: {
      bg: '#0c1512', bgSoft: '#12211c', surface: 'rgba(180,240,210,0.05)', surfaceStrong: 'rgba(180,240,210,0.1)', border: 'rgba(140,220,180,0.14)',
      text: '#e7f3ec', muted: '#93ab9f', accent: '#34d399', accent2: '#a3e635', accentContrast: '#04281a',
      fontHead: "'Sora', system-ui, sans-serif", fontBody: "'Inter', system-ui, sans-serif", glowOpacity: 0.26
    }
  },
  {
    id: 'mono', label: 'Mono', description: 'Stark black on white minimalism — designers.', swatchBg: '#ffffff', swatchAccent: '#111111',
    theme: {
      bg: '#ffffff', bgSoft: '#f4f4f5', surface: 'rgba(0,0,0,0.03)', surfaceStrong: 'rgba(0,0,0,0.06)', border: 'rgba(0,0,0,0.14)',
      text: '#111111', muted: '#6d6d72', accent: '#111111', accent2: '#6d6d72', accentContrast: '#ffffff',
      fontHead: "'Space Grotesk', system-ui, sans-serif", fontBody: "'Space Grotesk', system-ui, sans-serif", glowOpacity: 0.07
    }
  },
  {
    id: 'ocean', label: 'Ocean', description: 'Friendly light blue — corporate and business.', swatchBg: '#eaf4fb', swatchAccent: '#0369a1',
    theme: {
      bg: '#eaf4fb', bgSoft: '#dcecf7', surface: 'rgba(3,60,98,0.05)', surfaceStrong: 'rgba(3,60,98,0.09)', border: 'rgba(3,60,98,0.15)',
      text: '#0b2439', muted: '#4a6e88', accent: '#0369a1', accent2: '#f59e0b', accentContrast: '#ffffff',
      fontHead: "'Lora', Georgia, serif", fontBody: "'Nunito', system-ui, sans-serif", glowOpacity: 0.2
    }
  }
];

export const LANGUAGES: Catalog['languages'] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'fa', label: 'Farsi', native: 'فارسی' }
];


export const HEADER_STYLES: Catalog['headerStyles'] = [
  { id: 'classic', label: 'Classic', description: 'Logo left, links and actions right — the timeless bar.' },
  { id: 'centered', label: 'Centered', description: 'Links centered between logo and actions.' },
  { id: 'minimal', label: 'Minimal', description: 'Borderless transparent bar with quiet text links.' },
  { id: 'glass', label: 'Glass Pill', description: 'Floating rounded glass pill detached from the top edge.' },
  { id: 'bordered', label: 'Bold Border', description: 'Solid bar with a thick accent underline and spaced links.' }
];

export const FOOTER_STYLES: Catalog['footerStyles'] = [
  { id: 'columns', label: 'Columns', description: 'Three columns: brand, links, account.' },
  { id: 'simple', label: 'Simple Row', description: 'One row: brand, inline links, copyright.' },
  { id: 'centered', label: 'Centered Stack', description: 'Everything centered in a tidy vertical stack.' },
  { id: 'brandmark', label: 'Big Brandmark', description: 'Oversized brand wordmark above small links.' },
  { id: 'split', label: 'Split Bar', description: 'Brand on one side, links grouped on the other.' }
];

export const HERO_STYLES: Catalog['heroStyles'] = [
  { id: 'glow-center', label: 'Glow Center', description: 'Centered title over drifting color glows.' },
  { id: 'split', label: 'Split Screen', description: 'Text left, an image (or animated art) on the right.', image: true },
  { id: 'spotlight', label: 'Spotlight', description: 'A soft light follows the visitor cursor.' },
  { id: 'waves', label: 'Waves', description: 'Layered waves flow at the bottom of the hero.' },
  { id: 'grid', label: 'Tech Grid', description: 'Perspective grid fading into the horizon.' }
];
export const PRESETS: Record<SiteType, PresetInfo> = {
  personal: {
    modules: ['pages', 'contact-form'],
    uiModules: ['anim.reveal', 'anim.text-reveal'],
    defaultTemplate: 'midnight',
    headerStyle: 'classic',
    footerStyle: 'columns',
    heroStyle: 'glow-center',
    defaultTitle: 'My Portfolio',
    defaultTagline: 'Hi, I build things for the web.'
  },
  business: {
    modules: ['pages', 'contact-form'],
    uiModules: ['anim.reveal', 'anim.tilt', 'anim.marquee'],
    defaultTemplate: 'ocean',
    headerStyle: 'bordered',
    footerStyle: 'split',
    heroStyle: 'waves',
    defaultTitle: 'My Company',
    defaultTagline: 'Quality work, delivered on time.'
  },
  shop: {
    modules: ['pages', 'contact-form', 'auth', 'shop-catalog'],
    uiModules: ['anim.reveal', 'anim.hover-lift', 'anim.aurora'],
    defaultTemplate: 'sunset',
    headerStyle: 'centered',
    footerStyle: 'simple',
    heroStyle: 'split',
    defaultTitle: 'My Shop',
    defaultTagline: 'Great products, fair prices.'
  }
};

export const catalog: Catalog = {
  siteTypes: [
    { id: 'personal', label: 'Personal Site', description: 'Portfolio, bio and contact form.' },
    { id: 'business', label: 'Business Site', description: 'Company presence with services and leads.' },
    { id: 'shop', label: 'Shop', description: 'Products, cart, Iranian payment gateway and tickets.' }
  ],
  backends: [
    { id: 'django', label: 'Django (Python)', description: 'Python backend with SQLite and an admin panel at /admin.' },
    { id: 'dotnet', label: 'C# / ASP.NET Core', description: '.NET 8 minimal APIs with EF Core and SQLite.' }
  ],
  templates: TEMPLATES,
  headerStyles: HEADER_STYLES,
  footerStyles: FOOTER_STYLES,
  heroStyles: HERO_STYLES,
  languages: LANGUAGES,
  modules: MODULES,
  uiModules: UI_MODULES,
  presets: PRESETS
};

export function isBackend(v: unknown): v is Backend {
  return v === 'django' || v === 'dotnet';
}

export function isSiteType(v: unknown): v is SiteType {
  return v === 'personal' || v === 'business' || v === 'shop';
}

const TEMPLATE_IDS = new Set(TEMPLATES.map(t => t.id));

export function isTemplate(v: unknown): v is TemplateId {
  return typeof v === 'string' && TEMPLATE_IDS.has(v as TemplateId);
}

export function isLanguage(v: unknown): v is Language {
  return v === 'en' || v === 'fa';
}
