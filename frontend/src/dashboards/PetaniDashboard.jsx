import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { PlusCircle, RefreshCw, Package } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS } from '../constants.js'
import ProductCard from '../components/ProductCard.jsx'
import TraceabilityModal from '../components/TraceabilityModal.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth } from '../utils.js'

export default function PetaniDashboard() {
  const { contract, account, send, showToast, refreshBalance } = useWeb3()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [traceProduct, setTraceProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nama: '', lokasi: '', berat: '', metode: '', harga: '' })
  const [stats, setStats] = useState({ total: null, sold: null, ethReceived: null })

  const loadProducts = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const total = Number(await contract.totalProduk())
      const all = await Promise.all(
        Array.from({ length: total }, (_, i) => contract.getProduk(i + 1))
      )
      const mine = all.filter(p => p.petani.toLowerCase() === account?.toLowerCase())

      const sold = mine.filter(p => Number(p.status) === STATUS.Terjual)
      const ethReceived = sold.reduce((acc, p) => acc + p.hargaWei, 0n)

      setProducts(mine)
      setStats({
        total: mine.length,
        sold: sold.length,
        ethReceived,
      })
    } catch {
      showToast('Gagal memuat produk', 'error')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [contract, account])

  useEffect(() => { loadProducts() }, [loadProducts])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const berat = parseInt(form.berat)
    if (!berat || berat <= 0) { showToast('Berat harus lebih dari 0', 'error'); return }
    let hargaWei
    try { hargaWei = ethers.parseEther(form.harga) } catch {
      showToast('Format harga ETH tidak valid (contoh: 0.05)', 'error'); return
    }
    setSubmitting(true)
    const ok = await send(
      contract.daftarkanProduk,
      form.nama, form.lokasi, berat, form.metode, hargaWei
    )
    if (ok) {
      setForm({ nama: '', lokasi: '', berat: '', metode: '', harga: '' })
      setShowForm(false)
      loadProducts()
      refreshBalance()
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Petani 🌾</h1>
          <p className="text-sm text-slate-500 mt-0.5">Daftarkan dan pantau produk Anda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { loadProducts(); refreshBalance() }} disabled={loading} className="btn-secondary text-sm py-2">
            {loading ? <Spinner size={14} /> : <RefreshCw size={14} />}
          </button>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm">
            <PlusCircle size={15} />
            {showForm ? 'Batal' : 'Produk Baru'}
          </button>
        </div>
      </div>

      {/* Wallet balance */}
      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="📦" label="Total Produk Saya" value={stats.total !== null ? String(stats.total) : null} />
        <StatCard icon="💰" label="Produk Terjual" value={stats.sold !== null ? String(stats.sold) : null} colorClass="text-green-700" />
        <StatCard
          icon="🏦"
          label="Total ETH Diterima"
          value={stats.ethReceived !== null ? `${formatEth(stats.ethReceived)} ETH` : null}
          sub="Dari penjualan produk"
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
                <label className="label">Harga (ETH)</label>
                <input className="input" type="number" step="0.001" min="0.001" placeholder="0.05"
                  value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))} required />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Spinner size={14} />}
              <Package size={15} />
              {submitting ? 'Mendaftarkan…' : 'Daftarkan Produk'}
            </button>
          </form>
        </div>
      )}

      {/* Product list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Produk Saya ({products.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} className="text-brand-500" /></div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-slate-500 font-medium">Belum ada produk terdaftar</p>
            <p className="text-sm text-slate-400 mt-1">Klik "Produk Baru" untuk memulai</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => (
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
