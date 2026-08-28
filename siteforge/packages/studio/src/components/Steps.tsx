export function Steps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="steps">
      {labels.map((label, index) => (
        <li
          key={label}
          className={index === current ? 'step current' : index < current ? 'step done' : 'step'}
        >
          <span className="step-num">{index < current ? '✓' : index + 1}</span>
          <span className="step-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}
