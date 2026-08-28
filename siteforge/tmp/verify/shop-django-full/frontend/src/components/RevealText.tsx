import { site } from '../lib/site'

export default function RevealText({ text }: { text: string }) {
  if (!site.textReveal) {
    return <>{text}</>
  }
  const words = text.split(' ')
  return (
    <span className="word-cascade">
      {words.map((word, index) => (
        <span key={index} className="word" style={{ animationDelay: `${120 + index * 90}ms` }}>
          {word}
        </span>
      ))}
    </span>
  )
}
