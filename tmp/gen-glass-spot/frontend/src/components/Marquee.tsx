import { site } from '../lib/site'
import { getCopy } from '../lib/copy'
import { getLang } from '../lib/i18n'

export default function Marquee() {
  if (!site.marquee) {
    return null
  }
  const items = getCopy(site.siteType, getLang()).marqueeItems
  if (items.length === 0) {
    return null
  }
  const doubled = [...items, ...items, ...items, ...items]
  return (
    <div className="marquee-strip">
      <div className="marquee-track">
        {doubled.map((item, index) => (
          <span key={index} className="marquee-item">
            {item} ✦
          </span>
        ))}
      </div>
    </div>
  )
}
