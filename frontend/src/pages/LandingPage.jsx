import { Wallet, Shield, Leaf, Eye } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import Spinner from '../components/Spinner.jsx'

function Feature({ icon, title, desc }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0 text-lg">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { connect, connecting } = useWeb3()
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
            🌾 Blockchain Agrikultur Indonesia
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Transparansi dari<br />
            <span className="text-brand-600">Ladang ke Meja</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed mb-8">
            AgriChain menghubungkan petani, auditor, dan distributor melalui
            smart contract dengan escrow ETH yang aman dan traceability produk penuh.
          </p>

          <button
            onClick={connect}
            disabled={connecting}
            className="btn-primary text-base px-6 py-3 rounded-2xl shadow-lg shadow-brand-200"
          >
            {connecting ? <Spinner size={18} /> : <Wallet size={18} />}
            {connecting ? 'Menghubungkan…' : 'Hubungkan MetaMask'}
          </button>

          <p className="text-xs text-slate-400 mt-3">
            Pastikan MetaMask terpasang dan terhubung ke Hardhat Localhost (chainId 31337).
          </p>
        </div>

        {/* Right */}
        <div className="card p-8 space-y-6 shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fitur Utama</p>
          <Feature icon="🌾" title="Pendaftaran Produk"
            desc="Petani mendaftarkan komoditas dengan detail lengkap dan harga ETH." />
          <Feature icon="🔍" title="Verifikasi Kualitas"
            desc="Auditor memverifikasi dan mengesahkan produk sebelum diperdagangkan." />
          <Feature icon="🔒" title="Escrow Otomatis"
            desc="ETH dikunci di smart contract, aman hingga pengiriman dikonfirmasi." />
          <Feature icon="📍" title="Traceability QR"
            desc="Setiap produk punya riwayat lengkap & kode QR untuk pelacakan." />

          <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'On-chain', icon: <Shield size={20} className="text-brand-600 mx-auto" /> },
              { label: 'Transparan', icon: <Eye size={20} className="text-blue-500 mx-auto" /> },
              { label: 'Terdesentralisasi', icon: <Leaf size={20} className="text-green-500 mx-auto" /> },
            ].map(f => (
              <div key={f.label}>
                {f.icon}
                <p className="text-xs font-semibold text-slate-600 mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
