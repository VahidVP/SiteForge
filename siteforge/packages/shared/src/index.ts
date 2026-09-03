export type Backend = 'django' | 'dotnet';
export type SiteType = 'personal' | 'business' | 'shop';
export type ModuleStatus = 'available' | 'soon';
export type TemplateId = 'midnight' | 'paper' | 'sunset' | 'forest' | 'mono' | 'ocean' | 'blossom' | 'citrus' | 'obsidian';
export type Language = 'en' | 'fa';

export type CardStyle = 'rounded' | 'soft' | 'sharp';
export type ContentWidth = 'cozy' | 'wide';

export interface SiteContent {
  ctaLabel?: string;
  ctaLabelFa?: string;
  cardsTitle?: string;
  cardsTitleFa?: string;
}

export type LogoMode = 'text' | 'image' | 'both';

export interface Branding {
  title: string;
  tagline?: string;
  titleFa?: string;
  taglineFa?: string;
  logo?: string;
  logoMode?: LogoMode;
}

export type HeaderStyle = 'classic' | 'centered' | 'minimal' | 'glass' | 'bordered';
export type FooterStyle = 'columns' | 'simple' | 'centered' | 'brandmark' | 'split';
export type HeroStyle = 'glow-center' | 'split' | 'spotlight' | 'waves' | 'grid';

export interface Blueprint {
  projectName: string;
  siteType: SiteType;
  backend: Backend;
  database: 'sqlite';
  template: TemplateId;
  language: Language;
  bilingual?: boolean;
  modules: string[];
  uiModules: string[];
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  heroStyle: HeroStyle;
  heroImage?: string;
  cardStyle?: CardStyle;
  contentWidth?: ContentWidth;
  content?: SiteContent;
  branding: Branding;
  adminAccessCode?: string;
}

export interface ModuleInfo {
  id: string;
  label: string;
  description: string;
  status: ModuleStatus;
  locked?: boolean;
}

export interface UiModuleInfo {
  id: string;
  label: string;
  description: string;
}

export interface TemplateTheme {
  bg: string;
  bgSoft: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  accentContrast: string;
  fontHead: string;
  fontBody: string;
  glowOpacity: number;
}

export interface TemplateInfo {
  id: TemplateId;
  label: string;
  description: string;
  swatchBg: string;
  swatchAccent: string;
  /** Exact CSS-variable palette emitted into the generated site's themes.css — single source of truth. */
  theme: TemplateTheme;
}

export interface StyleOption {
  id: string;
  label: string;
  description: string;
  image?: boolean;
}

export interface PresetInfo {
  modules: string[];
  uiModules: string[];
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  heroStyle: HeroStyle;
  defaultTemplate: TemplateId;
  defaultTitle: string;
  defaultTagline: string;
}

export interface Catalog {
  siteTypes: { id: SiteType; label: string; description: string }[];
  backends: { id: Backend; label: string; description: string }[];
  templates: TemplateInfo[];
  headerStyles: StyleOption[];
  footerStyles: StyleOption[];
  heroStyles: StyleOption[];
  languages: { id: Language; label: string; native: string }[];
  modules: ModuleInfo[];
  uiModules: UiModuleInfo[];
  presets: Record<SiteType, PresetInfo>;
}
