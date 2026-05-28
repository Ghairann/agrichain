import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { RefreshCw, CheckCircle, XCircle, ClipboardCheck, AlertTriangle, Tag, ShieldCheck } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS } from '../constants.js'
import ProductCard from '../components/ProductCard.jsx'
import TraceabilityModal from '../components/TraceabilityModal.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth, mapProduct } from '../utils.js'

function shortAddr(addr) {
  if (!addr || addr === ethers.ZeroAddress) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function VerifyModal({ product, onClose, onConfirm, loading }) {
  const [catatan, setCatatan]     = useState('')
  const [hargaInput, setHargaInput] = useState('')

  const handleSubmit = () => {
    let hargaFinalWei
    try { hargaFinalWei = ethers.parseEther(hargaInput.trim()) } catch { return }
    if (hargaFinalWei <= 0n) return
    onConfirm(hargaFinalWei, catatan)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Verifikasi & Tetapkan Harga</h3>
        <p className="text-sm text-slate-500 mb-4">
          <strong>{product.nama}</strong> — #{product.id.toString()}
        </p>

        {/* Product details */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span>Lokasi</span><span className="font-medium">{product.lokasi}</span>
          </div>
          <div className="flex justify-between">
            <span>Berat</span><span className="font-medium">{product.berat.toString()} kg</span>
          </div>
          <div className="flex justify-between">
            <span>Metode</span><span className="font-medium">{product.metode}</span>
          </div>
          <div className="flex justify-between">
            <span>Petani</span><span className="font-mono">{shortAddr(product.petani)}</span>
          </div>
        </div>

        {/* Final price input */}
        <div className="mb-4">
          <label className="label">Harga Jual Final (ETH) *</label>
          <input
            className="input"
            type="number"
            step="0.001"
            min="0.001"
            value={hargaInput}
            onChange={e => setHargaInput(e.target.value)}
            placeholder="0.05"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">
            Harga ini akan menjadi harga penjualan resmi — distributor membeli dengan harga ini.
          </p>
        </div>

        <label className="label">Catatan Verifikasi</label>
        <textarea
          className="input resize-none h-20"
          placeholder="Hasil pemeriksaan kualitas, catatan laboratorium…"
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !hargaInput.trim() || Number(hargaInput) <= 0}
            className="btn-primary flex-1"
          >
            {loading && <Spinner size={14} />}
            <Tag size={14} />
            Verifikasi & Tetapkan Harga
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionModal({ product, mode, onClose, onConfirm, loading }) {
  const [catatan, setCatatan] = useState('')

  const config = {
    'reject-verify':   { title: 'Tolak Verifikasi',     btn: 'Tolak Produk',     btnClass: 'btn-danger',  requireNote: true  },
    'confirm':         { title: 'Konfirmasi Penerimaan', btn: 'Konfirmasi',       btnClass: 'btn-primary', requireNote: false },
    'reject-delivery': { title: 'Tolak Pengiriman',     btn: 'Tolak Pengiriman', btnClass: 'btn-danger',  requireNote: true  },
  }[mode] || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{config.title}</h3>
        <p className="text-sm text-slate-500 mb-4">
          <strong>{product.nama}</strong> — #{product.id.toString()}
        </p>
        {(mode === 'reject-verify' || mode === 'reject-delivery') && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex gap-2 items-start">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">
              {mode === 'reject-verify'
                ? 'Produk akan berstatus Ditolak dan tidak dapat dibeli. Tindakan ini tidak dapat dibatalkan.'
                : 'ETH akan dikembalikan ke distributor. Produk kembali ke status Terverifikasi.'}
            </p>
          </div>
        )}
        <label className="label">
          {config.requireNote ? 'Alasan Penolakan *' : 'Catatan / Keterangan'}
        </label>
        <textarea
          className="input resize-none h-24"
          placeholder={config.requireNote ? 'Jelaskan alasan penolakan secara detail…' : 'Tambahkan catatan (opsional)…'}
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => onConfirm(catatan)}
            disabled={loading || (config.requireNote && !catatan.trim())}
            className={`flex-1 ${config.btnClass}`}
          >
            {loading && <Spinner size={14} />}
            {config.btn}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AuditorDashboard() {
  const { contract, send, showToast, refreshBalance } = useWeb3()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [traceProduct, setTraceProduct] = useState(null)
  const [verifyModal, setVerifyModal]   = useState(null)
  const [actionModal, setActionModal]   = useState(null)
  const [activeTab, setActiveTab]       = useState('pending')
  const [escrowTotal, setEscrowTotal]   = useState(null)
  const [releasedTotal, setReleasedTotal] = useState(null)

  const loadProducts = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const total = Number(await contract.totalProduk())
      const raw = await Promise.all(Array.from({ length: total }, (_, i) => contract.getProduk(i + 1)))
      const all = raw.map(mapProduct).filter(Boolean)

      let locked = 0n
      let released = 0n
      for (const p of all) {
        if (Number(p.status) === STATUS.DalamPengiriman) {
          const e = await contract.getEscrow(p.id)
          locked += e
        }
        if (Number(p.status) === STATUS.Terjual) released += p.hargaWei
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

  const pending   = products.filter(p => Number(p.status) === STATUS.MenungguAudit)
  const verified  = products.filter(p => Number(p.status) === STATUS.Terverifikasi)
  const rejected  = products.filter(p => Number(p.status) === STATUS.Ditolak)
  const inTransit = products.filter(p => Number(p.status) === STATUS.DalamPengiriman)

  const handleVerify = async (hargaFinalWei, catatan) => {
    if (!verifyModal) return
    setSubmitting(true)
    const ok = await send(
      contract.verifikasiDanTentukanHarga,
      verifyModal.id,
      hargaFinalWei,
      catatan || 'Terverifikasi'
    )
    if (ok) { setVerifyModal(null); loadProducts(); refreshBalance() }
    setSubmitting(false)
  }

  const handleAction = async (catatan) => {
    const { product, mode } = actionModal
    setSubmitting(true)
    let ok = false
    if (mode === 'reject-verify')   ok = await send(contract.tolakProduk,          product.id, catatan)
    if (mode === 'confirm')         ok = await send(contract.konfirmasiPenerimaan,  product.id, catatan || 'Diterima')
    if (mode === 'reject-delivery') ok = await send(contract.tolakPengiriman,       product.id, catatan)
    if (ok) { setActionModal(null); loadProducts(); refreshBalance() }
    setSubmitting(false)
  }

  const tabs = [
    { id: 'pending',  label: 'Antrian Audit',  count: pending.length,   color: 'text-yellow-600' },
    { id: 'verified', label: 'Terverifikasi',  count: verified.length,  color: 'text-blue-600'   },
    { id: 'rejected', label: 'Ditolak',        count: rejected.length,  color: 'text-red-600'    },
    { id: 'shipping', label: 'Pengiriman',     count: inTransit.length, color: 'text-amber-600'  },
  ]

  const tabProducts    = { pending, verified, rejected, shipping: inTransit }
  const displayed      = tabProducts[activeTab] || []

  const emptyMessages = {
    pending:  { icon: '🎉', text: 'Tidak ada produk yang menunggu audit' },
    verified: { icon: '📋', text: 'Belum ada produk terverifikasi' },
    rejected: { icon: '✅', text: 'Tidak ada produk yang ditolak' },
    shipping: { icon: '📭', text: 'Tidak ada produk dalam pengiriman' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Auditor 🔍</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verifikasi produk, tetapkan harga jual, dan kelola escrow</p>
        </div>
        <button onClick={() => { loadProducts(); refreshBalance() }} disabled={loading} className="btn-secondary text-sm py-2">
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon="⏳" label="Antrian Audit"    value={String(pending.length)}   colorClass="text-yellow-600" />
        <StatCard icon="✅" label="Terverifikasi"     value={String(verified.length)}  colorClass="text-blue-600" />
        <StatCard icon="❌" label="Ditolak"           value={String(rejected.length)}  colorClass="text-red-600" />
        <StatCard icon="🚚" label="Dalam Pengiriman"  value={String(inTransit.length)} colorClass="text-amber-600" />
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

      {/* Audit queue alert */}
      {pending.length > 0 && activeTab !== 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex gap-3 items-center">
          <span className="text-yellow-600 font-semibold text-sm">
            {pending.length} produk menunggu audit di tab "Antrian Audit"
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
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
          <div className="text-5xl mb-3">{emptyMessages[activeTab]?.icon}</div>
          <p className="text-slate-500 font-medium">{emptyMessages[activeTab]?.text}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(p => (
            <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct}>
              {/* Audit queue actions */}
              {activeTab === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => setVerifyModal(p)}
                    className="btn-primary flex-1 justify-center text-sm">
                    <ClipboardCheck size={15} /> Verifikasi
                  </button>
                  <button onClick={() => setActionModal({ product: p, mode: 'reject-verify' })}
                    className="btn-danger flex-1 justify-center text-sm">
                    <XCircle size={15} /> Tolak
                  </button>
                </div>
              )}
              {/* Verified product — show auditor price */}
              {activeTab === 'verified' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-blue-700 flex items-center gap-1">
                    <ShieldCheck size={12} /> Harga Ditetapkan Auditor
                  </p>
                  <div className="flex justify-between text-blue-700 font-bold">
                    <span>Harga Jual</span>
                    <span>{ethers.formatEther(p.hargaFinalAuditor ?? p.hargaWei)} ETH</span>
                  </div>
                </div>
              )}
              {/* Shipping actions */}
              {activeTab === 'shipping' && (
                <div className="space-y-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs flex justify-between">
                    <span className="text-amber-600">Harga Escrow</span>
                    <span className="font-bold text-amber-700">{ethers.formatEther(p.hargaWei)} ETH</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActionModal({ product: p, mode: 'confirm' })}
                      className="btn-primary flex-1 justify-center text-sm">
                      <CheckCircle size={15} /> Konfirmasi
                    </button>
                    <button onClick={() => setActionModal({ product: p, mode: 'reject-delivery' })}
                      className="btn-danger flex-1 justify-center text-sm">
                      <XCircle size={15} /> Tolak
                    </button>
                  </div>
                </div>
              )}
            </ProductCard>
          ))}
        </div>
      )}

      {verifyModal && (
        <VerifyModal
          product={verifyModal}
          onClose={() => setVerifyModal(null)}
          onConfirm={handleVerify}
          loading={submitting}
        />
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
