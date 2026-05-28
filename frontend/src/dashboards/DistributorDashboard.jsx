import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { RefreshCw, ShoppingCart, Lock, CheckCircle } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { STATUS } from '../constants.js'
import ProductCard from '../components/ProductCard.jsx'
import TraceabilityModal from '../components/TraceabilityModal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth, mapProduct } from '../utils.js'


function BuyModal({ product, onClose, onConfirm, loading }) {
  const price = ethers.formatEther(product.hargaWei)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Konfirmasi Pembelian</h3>
        <p className="text-sm text-slate-500 mb-4">{product.nama} — #{product.id.toString()}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Total Pembayaran (Escrow)</p>
          <p className="text-3xl font-extrabold text-amber-600">{price} ETH</p>
          <p className="text-xs text-amber-500 mt-1">
            Dana akan dikunci hingga auditor mengonfirmasi pengiriman
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-600 mb-5">
          <div className="flex justify-between">
            <span>Lokasi:</span><span className="font-medium">{product.lokasi}</span>
          </div>
          <div className="flex justify-between">
            <span>Berat:</span><span className="font-medium">{product.berat.toString()} kg</span>
          </div>
          <div className="flex justify-between">
            <span>Metode:</span><span className="font-medium">{product.metode}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="btn-amber flex-1 justify-center">
            {loading && <Spinner size={14} />}
            <ShoppingCart size={15} />
            {loading ? 'Memproses…' : 'Beli Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DistributorDashboard() {
  const { contract, account, send, showToast, refreshBalance } = useWeb3()
  const [products, setProducts] = useState([])
  const [escrowMap, setEscrowMap] = useState({})
  const [buyerMap, setBuyerMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [traceProduct, setTraceProduct] = useState(null)
  const [buyModal, setBuyModal] = useState(null)
  const [activeTab, setActiveTab] = useState('available')
  const [myEscrowLocked, setMyEscrowLocked] = useState(null)
  const [myEthSpent, setMyEthSpent] = useState(null)

  const loadProducts = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const total = Number(await contract.totalProduk())
      const raw = await Promise.all(Array.from({ length: total }, (_, i) => contract.getProduk(i + 1)))
      const all = raw.map(mapProduct).filter(Boolean)

      const escrows = await Promise.all(all.map(p => contract.getEscrow(p.id)))
      const em = {}
      all.forEach((p, i) => { em[p.id.toString()] = escrows[i] })

      const transitOrSold = all.filter(p =>
        Number(p.status) === STATUS.DalamPengiriman || Number(p.status) === STATUS.Terjual
      )
      const bm = {}
      await Promise.all(transitOrSold.map(async p => {
        const buyer = await contract.pembeli(p.id)
        bm[p.id.toString()] = buyer
      }))

      let locked = 0n
      let spent = 0n
      for (const p of transitOrSold) {
        const buyer = bm[p.id.toString()]
        if (buyer?.toLowerCase() !== account?.toLowerCase()) continue
        if (Number(p.status) === STATUS.DalamPengiriman) locked += em[p.id.toString()] || 0n
        if (Number(p.status) === STATUS.Terjual) spent += p.hargaWei
      }

      setProducts(all)
      setEscrowMap(em)
      setBuyerMap(bm)
      setMyEscrowLocked(locked)
      setMyEthSpent(spent)
    } catch {
      showToast('Gagal memuat produk', 'error')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [contract, account, showToast])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Only show Terverifikasi products — explicitly excludes Ditolak and all other statuses
  const available = products.filter(p => Number(p.status) === STATUS.Terverifikasi)
  const myPurchases = products.filter(p =>
    (Number(p.status) === STATUS.DalamPengiriman || Number(p.status) === STATUS.Terjual) &&
    buyerMap[p.id.toString()]?.toLowerCase() === account?.toLowerCase()
  )

  const handleBuy = async () => {
    if (!buyModal) return
    setSubmitting(true)
    const p = buyModal
    const ok = await send(contract.beliProduk, p.id, { value: p.hargaWei })
    if (ok) { setBuyModal(null); loadProducts(); refreshBalance() }
    setSubmitting(false)
  }

  const tabs = [
    { id: 'available', label: 'Tersedia', count: available.length },
    { id: 'my', label: 'Pembelian Saya', count: myPurchases.length },
  ]

  const displayed = activeTab === 'available' ? available : myPurchases

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Distributor 🚛</h1>
          <p className="text-sm text-slate-500 mt-0.5">Beli produk terverifikasi & pantau escrow</p>
        </div>
        <button onClick={() => { loadProducts(); refreshBalance() }} disabled={loading} className="btn-secondary text-sm py-2">
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✅" label="Produk Tersedia" value={String(available.length)} colorClass="text-blue-600" />
        <StatCard
          icon="🔒"
          label="Escrow Aktif"
          value={String(products.filter(p => Number(p.status) === STATUS.DalamPengiriman).length)}
          colorClass="text-amber-600"
        />
        <StatCard
          icon="🔒"
          label="ETH Terkunci Saya"
          value={myEscrowLocked !== null ? `${formatEth(myEscrowLocked)} ETH` : null}
          sub="Menunggu konfirmasi"
          colorClass="text-amber-600"
        />
        <StatCard
          icon="💸"
          label="Total ETH Dibelanjakan"
          value={myEthSpent !== null ? `${formatEth(myEthSpent)} ETH` : null}
          sub="Transaksi selesai"
          colorClass="text-green-600"
        />
      </div>

      {/* Escrow info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
        <Lock size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-700">Cara Kerja Escrow</p>
          <p className="text-amber-600 mt-0.5">
            Saat Anda membeli produk, ETH dikunci di smart contract. Dana baru dilepas ke petani
            setelah auditor mengonfirmasi penerimaan. Jika ditolak, ETH dikembalikan ke Anda.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === t.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-200">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} className="text-brand-500" /></div>
      ) : displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">{activeTab === 'available' ? '📦' : '🛒'}</div>
          <p className="text-slate-500 font-medium">
            {activeTab === 'available' ? 'Belum ada produk terverifikasi' : 'Belum ada pembelian'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(p => (
            <ProductCard key={p.id.toString()} product={p} onTrace={setTraceProduct}>
              {activeTab === 'available' ? (
                <button onClick={() => setBuyModal(p)} className="btn-amber w-full justify-center text-sm">
                  <ShoppingCart size={15} /> Beli — {ethers.formatEther(p.hargaWei)} ETH
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {Number(p.status) === STATUS.DalamPengiriman && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <Lock size={11} />
                      {formatEth(escrowMap[p.id.toString()] || 0n)} ETH terkunci
                    </span>
                  )}
                  {Number(p.status) === STATUS.Terjual && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={11} /> Selesai
                    </span>
                  )}
                </div>
              )}
            </ProductCard>
          ))}
        </div>
      )}

      {buyModal && (
        <BuyModal product={buyModal} onClose={() => setBuyModal(null)} onConfirm={handleBuy} loading={submitting} />
      )}
      {traceProduct && (
        <TraceabilityModal product={traceProduct} onClose={() => setTraceProduct(null)} />
      )}
    </div>
  )
}
