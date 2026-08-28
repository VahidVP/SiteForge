export function Toggle({
  label,
  description,
  checked,
  disabled,
  soon,
  includedText = 'included',
  comingSoonText = 'coming soon',
  onChange
}: {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  soon?: boolean
  includedText?: string
  comingSoonText?: string
  onChange?: (value: boolean) => void
}) {
  if (soon) {
    return (
      <div className="toggle disabled">
        <div className="toggle-text">
          <span className="toggle-label">
            {label} <span className="badge-soon">{comingSoonText}</span>
          </span>
          <span className="toggle-desc">{description}</span>
        </div>
      </div>
    )
  }

  return (
    <label className={disabled ? 'toggle disabled' : 'toggle'}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange?.(event.target.checked)}
      />
      <span className="switch" aria-hidden="true" />
      <span className="toggle-text">
        <span className="toggle-label">
          {label}
          {disabled ? <span className="badge-included">{includedText}</span> : null}
        </span>
        <span className="toggle-desc">{description}</span>
      </span>
    </label>
  )
}
