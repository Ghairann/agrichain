import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { X, Clock, User } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS_LABEL, STATUS_ICON, STATUS_COLOR } from '../constants.js'
import Spinner from './Spinner.jsx'

function timeStr(ts) {
  return new Date(Number(ts) * 1000).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '-'
}

export default function TraceabilityModal({ product, onClose }) {
  const { contract } = useWeb3()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contract || !product) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await contract.getRiwayatProduk(product.id)
        if (!cancelled) setHistory([...data])
      } catch {
        if (!cancelled) setHistory([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [contract, product])

  if (!product) return null

  const qrData = JSON.stringify({
    id: product.id.toString(),
    nama: product.nama,
    lokasi: product.lokasi,
    status: STATUS_LABEL[Number(product.status)],
    petani: product.petani,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-mono mb-0.5">Produk #{product.id.toString()}</p>
            <h2 className="text-xl font-bold text-slate-800">{product.nama}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{product.lokasi}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl p-2 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-inner">
              <QRCode value={qrData} size={160} />
            </div>
            <p className="text-xs text-slate-400 text-center">Scan QR untuk info produk</p>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Clock size={15} /> Riwayat Perjalanan
            </h3>
            {loading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat</p>
            ) : (
              <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
                {history.map((r, i) => {
                  const n = Number(r.status)
                  return (
                    <li key={i} className="ml-5">
                      <span className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full text-xs
                                        ring-4 ring-white ${STATUS_COLOR[n]}`}>
                        {STATUS_ICON[n]}
                      </span>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[n]}`}>
                            {STATUS_LABEL[n]}
                          </span>
                          <span className="text-xs text-slate-400">{timeStr(r.waktu)}</span>
                        </div>
                        <p className="text-sm text-slate-700">{r.keterangan}</p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                          <User size={11} />
                          <span className="font-mono">{short(r.pelaku)}</span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
