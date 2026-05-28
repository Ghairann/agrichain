import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { UserPlus, Users, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { ROLE_LABEL } from '../constants.js'
import RoleBadge from '../components/RoleBadge.jsx'
import Spinner from '../components/Spinner.jsx'
import BalanceCard, { StatCard } from '../components/BalanceCard.jsx'
import { formatEth, mapProduct } from '../utils.js'
import { STATUS } from '../constants.js'

export default function AdminDashboard() {
  const { contract, send, showToast, refreshBalance } = useWeb3()
  const [stats, setStats] = useState({
    totalProduk: null,
    totalPengguna: null,
    contractBalance: null,
    totalEscrowLocked: null,
    totalReleased: null,
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ alamat: '', nama: '', role: '1' })

  const loadStats = useCallback(async () => {
    if (!contract) return
    setLoading(true)
    try {
      const [tp, tpg, bal] = await Promise.all([
        contract.totalProduk(),
        contract.totalPengguna(),
        contract.getContractBalance(),
      ])
      const total = Number(tp)

      // Compute escrow locked (DalamPengiriman) and total released (Terjual) from products
      let escrowLocked = 0n
      let released = 0n
      if (total > 0) {
        const rawProducts = await Promise.all(
          Array.from({ length: total }, (_, i) => contract.getProduk(i + 1))
        )
        const allProducts = rawProducts.map(mapProduct).filter(Boolean)
        for (const p of allProducts) {
          if (Number(p.status) === STATUS.DalamPengiriman) {
            const e = await contract.getEscrow(p.id)
            escrowLocked += e
          }
          if (Number(p.status) === STATUS.Terjual) {
            released += p.hargaWei
          }
        }
      }

      setStats({
        totalProduk: tp.toString(),
        totalPengguna: tpg.toString(),
        contractBalance: ethers.formatEther(bal),
        totalEscrowLocked: escrowLocked,
        totalReleased: released,
      })
    } catch {
      showToast('Gagal memuat statistik kontrak', 'error')
    } finally {
      setLoading(false)
    }
  }, [contract])

  useEffect(() => { loadStats() }, [loadStats])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!ethers.isAddress(form.alamat)) {
      showToast('Alamat wallet tidak valid', 'error'); return
    }
    setSubmitting(true)
    const ok = await send(contract.daftarkanPengguna, form.alamat, form.nama, Number(form.role))
    if (ok) {
      setForm({ alamat: '', nama: '', role: '1' })
      loadStats()
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Dashboard Admin ⚙️</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kelola pengguna dan pantau kontrak</p>
        </div>
        <button
          onClick={() => { loadStats(); refreshBalance() }}
          disabled={loading}
          className="btn-secondary text-sm py-2"
        >
          {loading ? <Spinner size={14} /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Wallet balance */}
      <BalanceCard />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon="📦" label="Total Produk" value={stats.totalProduk} />
        <StatCard icon="👥" label="Total Pengguna" value={stats.totalPengguna} />
        <StatCard
          icon="💰"
          label="Saldo Kontrak"
          value={stats.contractBalance !== null ? `${parseFloat(stats.contractBalance).toFixed(4)} ETH` : null}
          sub="ETH di smart contract"
          colorClass="text-green-700"
        />
        <StatCard
          icon="🔒"
          label="Escrow Terkunci"
          value={stats.totalEscrowLocked !== null ? `${formatEth(stats.totalEscrowLocked)} ETH` : null}
          sub="Menunggu konfirmasi"
          colorClass="text-amber-600"
        />
        <StatCard
          icon="✅"
          label="ETH ke Petani"
          value={stats.totalReleased !== null ? `${formatEth(stats.totalReleased)} ETH` : null}
          sub="Total sudah dicairkan"
          colorClass="text-blue-600"
        />
      </div>

      {/* Register user form */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
          <UserPlus size={18} className="text-brand-600" />
          Daftarkan Pengguna Baru
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label">Alamat Wallet</label>
            <input
              type="text"
              className="input font-mono"
              placeholder="0x..."
              value={form.alamat}
              onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama</label>
              <input
                type="text"
                className="input"
                placeholder="Nama lengkap"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                {[1, 2, 3, 4].map(r => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Spinner size={14} />}
              <UserPlus size={15} />
              {submitting ? 'Mendaftarkan…' : 'Daftarkan Pengguna'}
            </button>
            {form.role && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                Preview: <RoleBadge role={Number(form.role)} />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Role legend */}
      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users size={18} className="text-slate-500" />
          Panduan Role
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { role: 1, desc: 'Mendaftarkan dan menjual produk pertanian' },
            { role: 2, desc: 'Memverifikasi kualitas dan mengonfirmasi pengiriman' },
            { role: 3, desc: 'Membeli produk dan melakukan pembayaran escrow' },
            { role: 4, desc: 'Mengelola pengguna dan memantau kontrak' },
          ].map(({ role, desc }) => (
            <div key={role} className="bg-slate-50 rounded-xl p-3">
              <RoleBadge role={role} />
              <p className="text-xs text-slate-500 mt-2 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
