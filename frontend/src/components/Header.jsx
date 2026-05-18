import { LogOut, Wifi, WifiOff, Settings } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import RoleBadge from './RoleBadge.jsx'
import { formatEth, shortAddr } from '../utils.js'

export default function Header({ onReset }) {
  const { account, userInfo, ethBalance, disconnect } = useWeb3()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
            🌾
          </div>
          <span className="font-extrabold text-slate-800 text-lg tracking-tight hidden sm:block">
            Agri<span className="text-brand-600">Chain</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full border border-green-200">
            Localhost
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {account ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <Wifi size={12} /> Terhubung
                </span>
                {userInfo && <RoleBadge role={userInfo.role} />}
                {userInfo?.nama && (
                  <span className="text-sm font-semibold text-slate-700 hidden md:block">
                    {userInfo.nama}
                  </span>
                )}
              </div>

              {/* ETH balance chip */}
              {ethBalance !== null && (
                <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-bold text-green-700">
                    {formatEth(ethBalance, 4)} ETH
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
                <span className="text-xs font-mono text-slate-600">{shortAddr(account)}</span>
              </div>

              <button
                onClick={disconnect}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Putuskan wallet"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <WifiOff size={12} /> Tidak terhubung
            </span>
          )}

          <button
            onClick={onReset}
            className="p-2 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Ganti kontrak / reset app"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
