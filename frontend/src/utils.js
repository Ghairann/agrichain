import { ethers } from 'ethers'

/** Format Wei bigint to ETH string with given decimal places */
export function formatEth(wei, decimals = 4) {
  if (wei === null || wei === undefined) return '—'
  try {
    const val = parseFloat(ethers.formatEther(wei))
    return val.toFixed(decimals)
  } catch {
    return '—'
  }
}

/** Shorten an Ethereum address: 0x1234…abcd */
export function shortAddr(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Block explorer URL for an address — null on localhost (no explorer) */
export function explorerAddr(addr) {
  return null
}

/** Block explorer URL for a tx hash — null on localhost (no explorer) */
export function explorerTx(hash) {
  return null
}
