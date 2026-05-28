import { ethers } from 'ethers'

/**
 * Safely converts an ethers v6 Result (lazy-decoded proxy) to a plain JS object.
 * Catches "deferred ABI decoding" errors that fire when the on-chain struct
 * doesn't match the compiled ABI — e.g. stale deployment or stale browser cache.
 * Returns null if the Result is fatally malformed so callers can filter it out.
 */
export function mapProduct(raw) {
  if (!raw) return null
  try {
    return {
      id:                   raw.id                   ?? 0n,
      nama:                 raw.nama                 ?? '',
      lokasi:               raw.lokasi               ?? '',
      berat:                raw.berat                ?? 0n,
      metode:               raw.metode               ?? '',
      petani:               raw.petani               ?? ethers.ZeroAddress,
      status:               raw.status               ?? 0n,
      hargaWei:             raw.hargaWei             ?? 0n,
      hargaFinalAuditor:    raw.hargaFinalAuditor    ?? 0n,
      auditorPenentuHarga:  raw.auditorPenentuHarga  ?? ethers.ZeroAddress,
    }
  } catch (err) {
    console.warn('[mapProduct] ABI decode error — stale contract or ABI mismatch:', err.message)
    return null
  }
}

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
