import { useState } from 'react'
import { Web3Provider, useWeb3 } from './context/Web3Context.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Header from './components/Header.jsx'
import Toast from './components/Toast.jsx'
import Spinner from './components/Spinner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import AdminDashboard from './dashboards/AdminDashboard.jsx'
import PetaniDashboard from './dashboards/PetaniDashboard.jsx'
import AuditorDashboard from './dashboards/AuditorDashboard.jsx'
import DistributorDashboard from './dashboards/DistributorDashboard.jsx'
import { ROLE } from './constants.js'

// One-time migration: evict the old localStorage key so no stale address leaks in.
// Runs synchronously when this module is first imported — before any component mounts.
localStorage.removeItem('agrichain_addr')

// ─── Setup screen ────────────────────────────────────────────────────────────

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

function SetupScreen({ onSave }) {
  const [addr, setAddr] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    const trimmed = addr.trim()
    if (!ETH_ADDRESS_RE.test(trimmed)) {
      setError('Alamat tidak valid. Harus diawali 0x dan 42 karakter hex.')
      return
    }
    setError('')
    onSave(trimmed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center shadow-xl animate-fade-in">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg shadow-brand-200">
          🌾
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-1">
          Agri<span className="text-brand-600">Chain</span>
        </h1>
        <p className="text-sm text-slate-500 mb-6">Blockchain Traceability &amp; Escrow Platform</p>

        <div className="bg-slate-900 text-green-400 text-xs font-mono rounded-xl p-4 text-left mb-5 space-y-1">
          <p className="text-slate-500"># 1. Jalankan Hardhat node (terminal 1)</p>
          <p>npm run node</p>
          <p className="text-slate-500 pt-1"># 2. Deploy kontrak (terminal 2)</p>
          <p>npm run deploy:local</p>
          <p className="text-slate-500 pt-1"># 3. Salin alamat kontrak di bawah ini</p>
        </div>

        <div className="text-left mb-4">
          <label className="label">Alamat Kontrak AgriChain</label>
          <input
            type="text"
            className={`input font-mono ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="0x5FbDB2315678afecb367f032d93F642f64180aa3"
            value={addr}
            onChange={e => { setAddr(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={!addr.trim()}
          className="btn-primary w-full justify-center py-3 text-base rounded-2xl shadow-lg shadow-brand-200"
        >
          Lanjutkan →
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Atau set{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">
            VITE_CONTRACT_ADDRESS
          </code>{' '}
          di{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">
            frontend/.env.local
          </code>{' '}
          dan restart Vite.
        </p>
      </div>
    </div>
  )
}

// ─── Authenticated shell ──────────────────────────────────────────────────────

function NotRegistered({ account }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Terdaftar</h2>
        <p className="text-sm text-slate-500 mb-4">
          Akun ini belum memiliki role di AgriChain. Hubungi Admin untuk mendaftarkan akun Anda.
        </p>
        <div className="bg-slate-100 rounded-xl px-4 py-2 text-xs font-mono text-slate-600 break-all">
          {account}
        </div>
      </div>
    </div>
  )
}

function RoleLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size={32} className="text-brand-500" />
      <p className="text-sm font-medium text-slate-500">Memuat data akun…</p>
    </div>
  )
}

function AppShell({ onReset }) {
  const { account, userInfo, toast, dismissToast } = useWeb3()

  if (!account) return <LandingPage />

  // Guard: show spinner during the brief window between connect() setting `account`
  // and loadUserInfo() resolving `userInfo`. Not auto-connect — always user-initiated.
  if (!userInfo) return (
    <div className="min-h-screen flex flex-col">
      <Header onReset={onReset} />
      <RoleLoading />
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  )

  const getDashboard = () => {
    let dash
    switch (userInfo.role) {
      case ROLE.Admin:       dash = <AdminDashboard />;       break
      case ROLE.Petani:      dash = <PetaniDashboard />;      break
      case ROLE.Auditor:     dash = <AuditorDashboard />;     break
      case ROLE.Distributor: dash = <DistributorDashboard />; break
      default:               return <NotRegistered account={account} />
    }
    return <ErrorBoundary key={userInfo.role}>{dash}</ErrorBoundary>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onReset={onReset} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {getDashboard()}
      </main>
      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-100">
        AgriChain © 2026 — Blockchain Traceability &amp; Escrow Platform
      </footer>
      <Toast toast={toast} onClose={dismissToast} />
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  // contractAddress lives in React state. Setting it to '' unmounts Web3Provider,
  // destroying ALL wallet/role state without a page reload.
  // No localStorage is read or written — the module-level removeItem above
  // already evicted any old cached address.
  const [contractAddress, setContractAddress] = useState(
    (import.meta.env.VITE_CONTRACT_ADDRESS || '').trim()
  )

  const handleReset = () => setContractAddress('')

  if (!contractAddress) {
    return <SetupScreen onSave={setContractAddress} />
  }

  return (
    // Mounting Web3Provider here means unmounting it (via handleReset) cleanly
    // tears down account, signer, contract, userInfo — a true session wipe.
    <Web3Provider contractAddress={contractAddress}>
      <AppShell onReset={handleReset} />
    </Web3Provider>
  )
}
