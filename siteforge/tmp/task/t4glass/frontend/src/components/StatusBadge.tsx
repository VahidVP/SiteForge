import { useI18n } from '../context/LangContext'

const STATUS_KEY: Record<string, string> = {
  paid: 'status.paid',
  pending: 'status.pending',
  failed: 'status.failed',
  canceled: 'status.canceled',
  open: 'status.open',
  answered: 'status.answered',
  closed: 'status.closed'
}

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const key = STATUS_KEY[status]
  const label = key ? t(key) : status
  return <span className={`badge badge-${status}`}>{label}</span>
}
