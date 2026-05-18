import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS } from '../constants.js'
import ProductCard from '../components/ProductCard.jsx'
import TraceabilityModal from '../components/TraceabilityModal.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth } from '../utils.js'

function ActionModal({ product, mode, onClose, onConfirm, loading }) {
  const [catatan, setCatatan] = useState('')
  const title = {
    verify: 'Verifikasi Produk',
    confirm: 'Konfirmasi Penerimaan',
    reject: 'Tolak Produk',
  }[mode]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">
          <strong>{product.nama}</strong> — #{product.id.toString()}
        </p>
        <label className="label">
          {mode === 'reject' ? 'Alasan Penolakan' : 'Catatan / Keterangan'}
        </label>
        <textarea
          className="input resize-none h-24"
          placeholder={mode === 'reject' ? 'Jelaskan alasan penolakan…' : 'Tambahkan catatan verifikasi…'}
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => onConfirm(catatan)}
            disabled={loading || (!catatan && mode === 'reject')}
            className={`flex-1 ${mode === 'reject' ? 'btn-danger' : 'btn-primary'}`}
          >
            {loading && <Spinner size={14} />}
            {mode === 'verify' && 'Verifikasi'}
            {mode === 'confirm' && 'Konfirmasi'}
            {mode === 'reject' && 'Tolak'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuditorDashboard() {
  const { contract, send, showToast, refreshBalance } = useWeb3()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [traceProduct, setTraceProduct] = useState(null)
  const [actionModal, setActionModal] = useState(null)
  const [activeTab, setActiveTab] = useState('verify')
  const [escrowTotal, setEscrowTotal] = useState(null)
  const [releasedTotal, setReleasedTotal] = useState(null)

  const loadProducts = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const total = Number(await contract.totalProduk())
      const all = await Promise.all(Array.from({ length: total }, (_, i) => contract.getProduk(i + 1)))

      // Compute escrow-locked and released totals
      let locked = 0n
      let released = 0n
      for (const p of all) {
        if (Number(p.status) === STATUS.DalamPengiriman) {
          const e = await contract.getEscrow(p.id)
          locked += e
        }
        if (Number(p.status) === STATUS.Terjual) {
          released += p.hargaWei
        }
      }

      setProducts(all)
      setEscrowTotal(locked)
      setReleasedTotal(released)
    } catch {
      showToast('Gagal memuat produk', 'error')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [contract])

  useEffect(() => { loadProducts() }, [loadProducts])

  const toVerify = products.filter(p => Number(p.status) === STATUS.Didaftarkan)
  const inTransit = products.filter(p => Number(p.status) === STATUS.DalamPengiriman)

  const handleAction = async (catatan) => {
    const { product, mode } = actionModal
    setSubmitting(true)
    let ok = false
    if (mode === 'verify')  ok = await send(contract.verifikasiProduk, product.id, catatan || 'Terverifikasi')
    if (mode === 'confirm') ok = await send(contract.konfirmasiPenerimaan, product.id, catatan || 'Diterima')
    if (mode === 'reject')  ok = await send(contract.tolakProduk, product.id, catatan)
    if (ok) { setActionModal(null); loadProducts(); refreshBalance() }
    setSubmitting(false)
  }

  const tabs = [
    { id: 'verify', label: 'Perlu Verifikasi', count: toVerify.length, color: 'text-blue-600' },
    { id: 'confirm', label: 'Dalam Pengiriman', count: inTransit.length, color: 'text-amber-600' },
  ]

  const displayed = activeTab === 'verify' ? toVerify : inTransit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Auditor 🔍</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verifikasi produk dan kelola escrow</p>
        </div>
        <button onClick={() => { loadProducts(); refreshBalance() }} disabled={loading} className="btn-secondary text-sm py-2">
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      {/* Wallet balance */}
      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon="📋" label="Menunggu Verifikasi" value={String(toVerify.length)} colorClass="text-blue-600" />
        <StatCard icon="🚚" label="Dalam Pengiriman" value={String(inTransit.length)} colorClass="text-amber-600" />
        <StatCard
          icon="✅"
          label="Terverifikasi"
          value={String(products.filter(p => Number(p.status) === STATUS.Terverifikasi).length)}
          colorClass="text-green-600"
        />
        <StatCard
          icon="💰"
          label="Terjual"
          value={String(products.filter(p => Number(p.status) === STATUS.Terjual).length)}
          colorClass="text-purple-600"
        />
        <StatCard
          icon="🔒"
          label="Escrow Terkunci"
          value={escrowTotal !== null ? `${formatEth(escrowTotal)} ETH` : null}
          colorClass="text-amber-600"
        />
        <StatCard
          icon="🏦"
          label="ETH Dicairkan"
          value={releasedTotal !== null ? `${formatEth(releasedTotal)} ETH` : null}
          colorClass="text-green-700"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === t.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-200 ${activeTab === t.id ? t.color : ''}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} className="text-brand-500" /></div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">{activeTab === 'verify' ? '🎉' : '📭'}</div>
          <p className="text-slate-500 font-medium">
            {activeTab === 'verify' ? 'Semua produk sudah diverifikasi!' : 'Tidak ada produk dalam pengiriman'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(p => (
            <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct}>
              {activeTab === 'verify' ? (
                <button onClick={() => setActionModal({ product: p, mode: 'verify' })}
                  className="btn-primary w-full justify-center text-sm">
                  <ClipboardCheck size={15} /> Verifikasi
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setActionModal({ product: p, mode: 'confirm' })}
                    className="btn-primary flex-1 justify-center text-sm">
                    <CheckCircle size={15} /> Konfirmasi
                  </button>
                  <button onClick={() => setActionModal({ product: p, mode: 'reject' })}
                    className="btn-danger flex-1 justify-center text-sm">
                    <XCircle size={15} /> Tolak
                  </button>
                </div>
              )}
            </ProductCard>
          ))}
        </div>
      )}

      {actionModal && (
        <ActionModal
          product={actionModal.product}
          mode={actionModal.mode}
          onClose={() => setActionModal(null)}
          onConfirm={handleAction}
          loading={submitting}
        />
      )}

      {traceProduct && (
        <TraceabilityModal product={traceProduct} onClose={() => setTraceProduct(null)} />
      )}
    </div>
  )
}
