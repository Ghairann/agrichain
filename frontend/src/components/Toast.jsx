import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-500 shrink-0" />,
  info:    <Info       size={18} className="text-blue-500 shrink-0" />,
}

const BG = {
  success: 'bg-white border-green-200',
  error:   'bg-white border-red-200',
  info:    'bg-white border-blue-200',
}

export default function Toast({ toast, onClose }) {
  if (!toast) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
      <div className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${BG[toast.type]}`}>
        {ICONS[toast.type]}
        <p className="text-sm text-slate-700 flex-1 leading-snug">{toast.message}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
