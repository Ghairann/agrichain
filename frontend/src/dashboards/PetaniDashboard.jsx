import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, RefreshCw, Package, AlertTriangle, Clock } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS } from '../constants.js'
import ProductCard from '../components/ProductCard.jsx'
import TraceabilityModal from '../components/TraceabilityModal.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth, mapProduct } from '../utils.js'

export default function PetaniDashboard() {
  const { contract, account, send, showToast, refreshBalance } = useWeb3()

  const [products, setProducts]           = useState([])
  const [rejectionNotes, setRejectionNotes] = useState({})
  const [loading, setLoading]             = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [traceProduct, setTraceProduct]   = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState({ nama: '', lokasi: '', berat: '', metode: '' })
  const [stats, setStats]                 = useState({
    total: null, menungguAudit: null, verified: null,
    sold: null, rejected: null, ethReceived: null,
  })

  const loadProducts = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const total = Number(await contract.totalProduk())
      const raw = await Promise.all(
        Array.from({ length: total }, (_, i) => contract.getProduk(i + 1))
      )
      const all  = raw.map(mapProduct).filter(Boolean)
      const mine = all.filter(p => p.petani.toLowerCase() === account?.toLowerCase())

      const menungguAudit = mine.filter(p => Number(p.status) === STATUS.MenungguAudit)
      const verified      = mine.filter(p => Number(p.status) === STATUS.Terverifikasi)
      const sold          = mine.filter(p => Number(p.status) === STATUS.Terjual)
      const rejected      = mine.filter(p => Number(p.status) === STATUS.Ditolak)
      const ethReceived   = sold.reduce((acc, p) => acc + p.hargaFinalAuditor, 0n)

      const notes = {}
      await Promise.all(rejected.map(async (p) => {
        try {
          const hist  = await contract.getRiwayatProduk(p.id)
          const entry = [...hist].reverse().find(h => Number(h.status) === STATUS.Ditolak)
          if (entry) notes[p.id.toString()] = entry.keterangan
        } catch { /* ignore */ }
      }))

      setProducts(mine)
      setRejectionNotes(notes)
      setStats({
        total:         mine.length,
        menungguAudit: menungguAudit.length,
        verified:      verified.length,
        sold:          sold.length,
        rejected:      rejected.length,
        ethReceived,
      })
    } catch {
      showToast('Gagal memuat produk', 'error')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [contract, account, showToast])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const berat = parseInt(form.berat)
    if (!berat || berat <= 0) { showToast('Berat harus lebih dari 0', 'error'); return }
    setSubmitting('form')
    const ok = await send(
      contract.daftarkanProduk,
      form.nama, form.lokasi, berat, form.metode
    )
    if (ok) {
      setForm({ nama: '', lokasi: '', berat: '', metode: '' })
      setShowForm(false)
      loadProducts()
      refreshBalance()
    }
    setSubmitting(false)
  }

  const waitingAudit   = products.filter(p => Number(p.status) === STATUS.MenungguAudit)
  const rejectedProds  = products.filter(p => Number(p.status) === STATUS.Ditolak)
  const activeProducts = products.filter(p =>
    Number(p.status) !== STATUS.MenungguAudit && Number(p.status) !== STATUS.Ditolak
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Petani 🌾</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daftarkan produk dan pantau proses audit</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { loadProducts(); refreshBalance() }}
            disabled={loading}
            className="btn-secondary text-sm py-2"
          >
            {loading ? <Spinner size={14} /> : <RefreshCw size={14} />}
          </button>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm">
            <PlusCircle size={15} />
            {showForm ? 'Batal' : 'Produk Baru'}
          </button>
        </div>
      </div>

      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon="📦" label="Total Produk"     value={stats.total         !== null ? String(stats.total)         : null} />
        <StatCard icon="⏳" label="Menunggu Audit"   value={stats.menungguAudit !== null ? String(stats.menungguAudit) : null} colorClass="text-yellow-600" />
        <StatCard icon="✅" label="Diverifikasi"      value={stats.verified      !== null ? String(stats.verified)      : null} colorClass="text-brand-700" />
        <StatCard icon="💰" label="Terjual"           value={stats.sold          !== null ? String(stats.sold)          : null} colorClass="text-green-700" />
        <StatCard icon="❌" label="Ditolak"           value={stats.rejected      !== null ? String(stats.rejected)      : null} colorClass="text-red-600" />
        <StatCard
          icon="🏦"
          label="Total ETH Diterima"
          value={stats.ethReceived !== null ? `${formatEth(stats.ethReceived)} ETH` : null}
          colorClass="text-blue-600"
        />
      </div>

      {/* Register form */}
      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-base font-bold text-slate-800 mb-5">Daftarkan Produk Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nama Komoditas</label>
                <input className="input" placeholder="Beras Organik, Jagung…"
                  value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Lokasi Panen</label>
                <input className="input" placeholder="Malang, Jawa Timur"
                  value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Berat (kg)</label>
                <input className="input" type="number" min="1" placeholder="100"
                  value={form.berat} onChange={e => setForm(f => ({ ...f, berat: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Metode Tanam</label>
                <input className="input" placeholder="Organik, Konvensional…"
                  value={form.metode} onChange={e => setForm(f => ({ ...f, metode: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  <p className="font-semibold">Harga ditetapkan oleh Auditor</p>
                  <p className="mt-0.5 text-blue-600">Harga jual produk akan ditentukan oleh auditor setelah pemeriksaan kualitas.</p>
                </div>
              </div>
            </div>
            <button type="submit" disabled={!!submitting} className="btn-primary">
              {submitting === 'form' && <Spinner size={14} />}
              <Package size={15} />
              {submitting === 'form' ? 'Mendaftarkan…' : 'Daftarkan Produk'}
            </button>
          </form>
        </div>
      )}

      {/* Waiting audit section */}
      {waitingAudit.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Menunggu Audit ({waitingAudit.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {waitingAudit.map(p => (
              <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct}>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                  <p className="font-semibold mb-1">Menunggu Pemeriksaan Auditor</p>
                  <p>Auditor akan memeriksa kualitas produk sebelum dipasarkan.</p>
                </div>
              </ProductCard>
            ))}
          </div>
        </div>
      )}

      {/* Rejected section */}
      {rejectedProds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Ditolak Auditor ({rejectedProds.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rejectedProds.map(p => (
              <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct}>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
                  <p className="font-semibold text-red-600 mb-1">Alasan Penolakan:</p>
                  <p className="text-red-700">
                    {rejectionNotes[p.id.toString()] || 'Lihat riwayat untuk detail'}
                  </p>
                </div>
              </ProductCard>
            ))}
          </div>
        </div>
      )}

      {/* Active products */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Produk Aktif ({activeProducts.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} className="text-brand-500" /></div>
        ) : activeProducts.length === 0 && waitingAudit.length === 0 && rejectedProds.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-slate-500 font-medium">Belum ada produk terdaftar</p>
            <p className="text-sm text-slate-400 mt-1">Klik "Produk Baru" untuk memulai</p>
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400 text-sm">Tidak ada produk aktif saat ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProducts.map(p => (
              <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct} />
            ))}
          </div>
        )}
      </div>

      {traceProduct && (
        <TraceabilityModal product={traceProduct} onClose={() => setTraceProduct(null)} />
      )}
    </div>
  )
}
