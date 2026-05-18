import { Wallet, RefreshCw } from 'lucide-react'
import { useWeb3 } from '../context/Web3Context.jsx'
import { formatEth, shortAddr, explorerAddr } from '../utils.js'

/** Skeleton shimmer for loading states */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
}

/**
 * Single stat card used across all dashboards.
 * value: string | null  — null shows a shimmer skeleton
 */
export function StatCard({ icon, label, value, sub, colorClass = 'text-slate-800' }) {
  return (
    <div className="stat-card">
      <div className="text-2xl mb-1">{icon}</div>
      {value === null ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <p className={`text-2xl font-extrabold ${colorClass}`}>{value}</p>
      )}
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

/**
 * Wallet ETH balance card for the connected account.
 * Shows a shimmer while balance is loading and a refresh button.
 */
export default function BalanceCard() {
  const { account, ethBalance, refreshBalance } = useWeb3()

  return (
    <div className="card p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-brand-50 to-white border-brand-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <Wallet size={20} className="text-brand-600" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">Saldo Wallet Anda</p>
          {ethBalance === null ? (
            <Skeleton className="h-6 w-32 mt-0.5" />
          ) : (
            <p className="text-xl font-extrabold text-brand-700">
              {formatEth(ethBalance, 4)} ETH
            </p>
          )}
          {account && (
            explorerAddr(account) ? (
              <a
                href={explorerAddr(account)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline font-mono"
              >
                {shortAddr(account)}
              </a>
            ) : (
              <span className="text-xs font-mono text-slate-500">{shortAddr(account)}</span>
            )
          )}
        </div>
      </div>
      <button
        onClick={refreshBalance}
        className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title="Refresh saldo"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  )
}
