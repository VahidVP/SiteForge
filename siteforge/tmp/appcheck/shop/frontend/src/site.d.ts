import type { SiteFlags } from './site'

declare global {
  interface Window {
    __SITE__?: SiteFlags
  }
}

export {}
