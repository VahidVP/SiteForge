import type { Blueprint } from '@siteforge/shared';
import { MODULES, isBackend, isLanguage, isSiteType, isTemplate } from './registry.js';

const HEADER_IDS = new Set(['classic', 'centered', 'minimal', 'glass', 'bordered']);
const FOOTER_IDS = new Set(['columns', 'simple', 'centered', 'brandmark', 'split']);
const HERO_IDS = new Set(['glow-center', 'split', 'spotlight', 'waves', 'grid']);

export function validateBlueprint(input: unknown): Blueprint {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Blueprint must be a JSON object.');
  }
  const raw = input as Record<string, unknown>;

  const projectName = String(raw.projectName ?? '').trim();
  if (!/^[a-z][a-z0-9-]{1,49}$/.test(projectName)) {
    throw new Error(
      'Project name must start with a letter and contain only lowercase letters, numbers and dashes (2-50 chars).'
    );
  }

  if (!isSiteType(raw.siteType)) throw new Error('siteType must be one of: personal, business, shop.');
  if (!isBackend(raw.backend)) throw new Error('backend must be one of: django, dotnet.');

  const template = raw.template === undefined || raw.template === null ? 'midnight' : raw.template;
  if (!isTemplate(template)) throw new Error('Unknown design template.');

  const language = raw.language === undefined || raw.language === null ? 'en' : raw.language;
  if (!isLanguage(language)) throw new Error('language must be "en" or "fa".');

  const bilingual = raw.bilingual === undefined || raw.bilingual === null ? true : Boolean(raw.bilingual);

  const headerStyle = HEADER_IDS.has(raw.headerStyle as string) ? (raw.headerStyle as Blueprint['headerStyle']) : 'classic';
  const footerStyle = FOOTER_IDS.has(raw.footerStyle as string) ? (raw.footerStyle as Blueprint['footerStyle']) : 'columns';
  const heroStyle = HERO_IDS.has(raw.heroStyle as string) ? (raw.heroStyle as Blueprint['heroStyle']) : 'glow-center';

  const available = new Set(MODULES.filter((m) => m.status === 'available').map((m) => m.id));
  const modules = Array.from(new Set(['pages', ...(Array.isArray(raw.modules) ? raw.modules : []) as string[]]));
  for (const id of modules) {
    if (!available.has(id)) throw new Error(`Unknown or unavailable module: ${id}`);
  }
  if (modules.includes('shop-catalog') && !modules.includes('auth')) {
    modules.push('auth');
  }

  const uiModules = Array.from(new Set((Array.isArray(raw.uiModules) ? raw.uiModules : []) as string[]));
  const knownUi = new Set(['anim.reveal', 'anim.hover-lift', 'anim.text-reveal', 'anim.tilt', 'anim.magnetic', 'anim.aurora', 'anim.marquee']);
  for (const id of uiModules) {
    if (!knownUi.has(id)) throw new Error(`Unknown UI module: ${id}`);
  }

  const branding = (typeof raw.branding === 'object' && raw.branding !== null ? raw.branding : {}) as Record<string, unknown>;
  const title = String(branding.title ?? '').trim().slice(0, 80);
  if (!title) throw new Error('branding.title is required.');
  const tagline = String(branding.tagline ?? '').trim().slice(0, 160);
  const titleFa = String(branding.titleFa ?? '').trim().slice(0, 80);
  const taglineFa = String(branding.taglineFa ?? '').trim().slice(0, 160);

  const logo = String(branding.logo ?? '').trim();
  if (logo && !logo.startsWith('data:image/')) {
    throw new Error('branding.logo must be a data:image/ PNG data URL.');
  }
  if (logo && logo.length > 600_000) {
    throw new Error('branding.logo is too large (PNG must be under ~450 KB).');
  }
  const LOGO_MODES = new Set(['text', 'image', 'both']);
  const logoMode = LOGO_MODES.has(branding.logoMode as string) ? (branding.logoMode as 'text' | 'image' | 'both') : logo ? 'both' : 'text';

  let adminAccessCode = String(raw.adminAccessCode ?? '').trim();
  if (adminAccessCode && !/^[A-Za-z0-9@#$_-]{4,64}$/.test(adminAccessCode)) {
    throw new Error('adminAccessCode may only contain letters, numbers and @ # $ _ - (4-64 chars).');
  }
  if (modules.includes('auth')) {
    adminAccessCode = '';
  }

  return {
    projectName,
    siteType: raw.siteType,
    backend: raw.backend,
    database: 'sqlite',
    template,
    language,
    bilingual,
    headerStyle,
    footerStyle,
    heroStyle,
    modules,
    uiModules,
    branding: { title, tagline, titleFa, taglineFa, logo, logoMode },
    adminAccessCode
  };
}
