import { ROLE_LABEL, ROLE_COLOR, ROLE_EMOJI } from '../constants.js'

export default function RoleBadge({ role, size = 'sm' }) {
  const n = Number(role)
  const padding = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${padding} ${ROLE_COLOR[n]}`}>
      <span>{ROLE_EMOJI[n]}</span>
      {ROLE_LABEL[n]}
    </span>
  )
}
