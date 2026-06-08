import { ethers } from 'ethers'
import { MapPin, Weight, Leaf, Wallet, Eye } from 'lucide-react'
import { STATUS } from '../constants.js'
import StatusBadge from './StatusBadge.jsx'

export default function ProductCard({ product, onTrace, children }) {
  const p = product
  const belumAdaHarga = p.hargaFinalAuditor === 0n || p.hargaFinalAuditor == null
  const isMenunggu = Number(p.status) === STATUS.MenungguAudit

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400">#{p.id.toString()}</span>
            <StatusBadge status={p.status} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{p.nama}</h3>
        </div>
        <button
          onClick={() => onTrace?.(p)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-brand-600
                     hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Eye size={13} /> Lacak
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-slate-400 shrink-0" />
          <span className="truncate">{p.lokasi}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Weight size={13} className="text-slate-400 shrink-0" />
          <span>{p.berat.toString()} kg</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Leaf size={13} className="text-slate-400 shrink-0" />
          <span className="truncate">{p.metode}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet size={13} className={`shrink-0 ${belumAdaHarga ? 'text-slate-400' : 'text-amber-500'}`} />
          {belumAdaHarga ? (
            <span className={`text-xs ${isMenunggu ? 'text-yellow-600 font-medium' : 'text-slate-400'}`}>
              {isMenunggu ? 'Menunggu audit' : 'Belum ditetapkan'}
            </span>
          ) : (
            <span className="font-semibold text-amber-600">
              {ethers.formatEther(p.hargaFinalAuditor)} ETH
            </span>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-400 truncate font-mono">
        Petani: {p.petani}
      </div>

      {children && <div className="pt-2 border-t border-slate-100">{children}</div>}
    </div>
  )
}
