import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { Blueprint, TemplateTheme } from '@siteforge/shared';
import { TEMPLATES } from './registry.js';

const hb = Handlebars.create();
hb.registerHelper('json', (v: unknown) => JSON.stringify(v ?? null));
hb.registerHelper('bool', (v: unknown) => String(Boolean(v)));

export interface Ctx {
  projectName: string;
  title: string;
  tagline: string;
  titleFa: string;
  taglineFa: string;
  logo: string;
  logoMode: 'text' | 'image' | 'both';
  siteType: string;
  backend: string;
  template: string;
  language: string;
  bilingual: boolean;
  headerStyle: string;
  footerStyle: string;
  heroStyle: string;
  heroImage: string;
  cardStyle: string;
  contentWidth: string;
  ctaLabel: string;
  ctaLabelFa: string;
  cardsTitle: string;
  cardsTitleFa: string;
  isFa: boolean;
  django: boolean;
  dotnet: boolean;
  isPersonal: boolean;
  isBusiness: boolean;
  isShop: boolean;
  authScheme: 'Token' | 'Bearer';
  auth: boolean;
  shop: boolean;
  contact: boolean;
  adminAccessCode: string;
  fReveal: boolean;
  fLift: boolean;
  fTextReveal: boolean;
  fTilt: boolean;
  fMagnetic: boolean;
  fAurora: boolean;
  fMarquee: boolean;
  fFloat: boolean;
  fZoom: boolean;
  fShine: boolean;
  /** All template palettes — consumed by themes.css.hbs so emitted CSS matches the registry. */
  templates: Array<{ id: string; theme: TemplateTheme }>;
}

export function buildCtx(bp: Blueprint): Ctx {
  const has = (id: string) => bp.modules.includes(id);
  const ui = (id: string) => bp.uiModules.includes(id);
  return {
    projectName: bp.projectName,
    title: bp.branding.title,
    tagline: bp.branding.tagline ?? '',
    titleFa: bp.branding.titleFa ?? '',
    taglineFa: bp.branding.taglineFa ?? '',
    logo: bp.branding.logo ?? '',
    logoMode: bp.branding.logoMode ?? (bp.branding.logo ? 'both' : 'text'),
    siteType: bp.siteType,
    backend: bp.backend,
    template: bp.template,
    language: bp.language,
    bilingual: bp.bilingual ?? true,
    headerStyle: bp.headerStyle ?? 'classic',
    footerStyle: bp.footerStyle ?? 'columns',
    heroStyle: bp.heroStyle ?? 'glow-center',
    heroImage: bp.heroImage ?? '',
    cardStyle: bp.cardStyle ?? 'rounded',
    contentWidth: bp.contentWidth ?? 'cozy',
    ctaLabel: bp.content?.ctaLabel ?? '',
    ctaLabelFa: bp.content?.ctaLabelFa ?? '',
    cardsTitle: bp.content?.cardsTitle ?? '',
    cardsTitleFa: bp.content?.cardsTitleFa ?? '',
    isFa: bp.language === 'fa',
    django: bp.backend === 'django',
    dotnet: bp.backend === 'dotnet',
    isPersonal: bp.siteType === 'personal',
    isBusiness: bp.siteType === 'business',
    isShop: bp.siteType === 'shop',
    authScheme: bp.backend === 'django' ? 'Token' : 'Bearer',
    auth: has('auth'),
    shop: has('shop-catalog'),
    contact: has('contact-form'),
    adminAccessCode: !has('auth') ? (bp.adminAccessCode ?? '') : '',
    fReveal: ui('anim.reveal'),
    fLift: ui('anim.hover-lift'),
    fTextReveal: ui('anim.text-reveal'),
    fTilt: ui('anim.tilt'),
    fMagnetic: ui('anim.magnetic'),
    fAurora: ui('anim.aurora'),
    fMarquee: ui('anim.marquee'),
    fFloat: ui('anim.float'),
    fZoom: ui('anim.zoom'),
    fShine: ui('anim.shine'),
    templates: TEMPLATES.map(t => ({ id: t.id, theme: t.theme }))
  };
}

const TEMPLATE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates');

function compile(raw: string): HandlebarsTemplateDelegate {
  return hb.compile(raw, { noEscape: true });
}

async function emit(srcDir: string, destDir: string, ctx: Ctx): Promise<void> {
  await fs.promises.mkdir(destDir, { recursive: true });
  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });

  const hbsBaseNames = new Set(
    entries
      .filter((e) => !e.isDirectory() && e.name.endsWith('.hbs'))
      .map((e) => e.name.slice(0, -4))
  );

  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      await emit(src, path.join(destDir, entry.name), ctx);
    } else if (entry.name.endsWith('.hbs')) {
      const raw = await fs.promises.readFile(src, 'utf8');
      const rendered = compile(raw)(ctx);
      await fs.promises.writeFile(path.join(destDir, entry.name.slice(0, -4)), rendered, 'utf8');
    } else {
      if (hbsBaseNames.has(entry.name)) {
        continue;
      }
      await fs.promises.copyFile(src, path.join(destDir, entry.name));
    }
  }
}

export async function generateToDir(bp: Blueprint, outDir: string): Promise<void> {
  const ctx = buildCtx(bp);
  await fs.promises.rm(outDir, { recursive: true, force: true });
  await fs.promises.mkdir(outDir, { recursive: true });

  const frontendTpl = path.join(TEMPLATE_ROOT, 'frontend');
  const backendTpl = path.join(TEMPLATE_ROOT, bp.backend);

  await emit(path.join(frontendTpl, 'base'), path.join(outDir, 'frontend'), ctx);
  for (const moduleId of bp.modules) {
    const moduleDir = path.join(frontendTpl, 'modules', moduleId);
    if (fs.existsSync(moduleDir)) await emit(moduleDir, path.join(outDir, 'frontend'), ctx);
  }

  await emit(path.join(backendTpl, 'base'), path.join(outDir, 'backend'), ctx);
  for (const moduleId of bp.modules) {
    const moduleDir = path.join(backendTpl, 'modules', moduleId);
    if (fs.existsSync(moduleDir)) await emit(moduleDir, path.join(outDir, 'backend'), ctx);
  }

  const rootDir = path.join(TEMPLATE_ROOT, 'root');
  if (fs.existsSync(rootDir)) await emit(rootDir, outDir, ctx);
}
