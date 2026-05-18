import { STATUS_LABEL, STATUS_COLOR, STATUS_ICON } from '../constants.js'

export default function StatusBadge({ status }) {
  const n = Number(status)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[n]}`}>
      <span>{STATUS_ICON[n]}</span>
      {STATUS_LABEL[n]}
    </span>
  )
}
