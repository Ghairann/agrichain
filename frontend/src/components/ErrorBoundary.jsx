import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[AgriChain ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    const msg = this.state.error?.message || String(this.state.error)
    const isAbiError = msg.includes('deferred') || msg.includes('ABI') || msg.includes('BAD_DATA')

    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-10">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {isAbiError ? 'Kontrak Tidak Sinkron' : 'Terjadi Kesalahan'}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {isAbiError
            ? 'ABI frontend tidak cocok dengan kontrak yang di-deploy. Reset MetaMask nonce, restart Hardhat node, lalu jalankan npm run deploy:local.'
            : msg.slice(0, 200)}
        </p>
        {isAbiError && (
          <div className="bg-slate-900 text-green-400 text-xs font-mono rounded-xl p-4 text-left mb-5 space-y-1">
            <p className="text-slate-400"># Terminal 1</p>
            <p>npm run node</p>
            <p className="text-slate-400 pt-1"># Terminal 2</p>
            <p>npm run deploy:local</p>
            <p className="text-slate-400 pt-1"># MetaMask: Settings → Advanced → Clear activity</p>
          </div>
        )}
        <button
          onClick={() => this.setState({ error: null })}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    )
  }
}
