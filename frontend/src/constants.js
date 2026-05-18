export const ROLE = {
  TidakTerdaftar: 0,
  Petani: 1,
  Auditor: 2,
  Distributor: 3,
  Admin: 4,
}

export const STATUS = {
  Didaftarkan: 0,
  Terverifikasi: 1,
  DalamPengiriman: 2,
  DiDistributor: 3,
  Terjual: 4,
}

export const ROLE_LABEL = {
  0: 'Tidak Terdaftar',
  1: 'Petani',
  2: 'Auditor',
  3: 'Distributor',
  4: 'Admin',
}

export const STATUS_LABEL = {
  0: 'Didaftarkan',
  1: 'Terverifikasi',
  2: 'Dalam Pengiriman',
  3: 'Di Distributor',
  4: 'Terjual',
}

export const ROLE_COLOR = {
  0: 'bg-slate-100 text-slate-600',
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-purple-100 text-purple-700',
}

export const STATUS_COLOR = {
  0: 'bg-slate-100 text-slate-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-violet-100 text-violet-700',
  4: 'bg-green-100 text-green-700',
}

export const STATUS_ICON = {
  0: '📋',
  1: '✅',
  2: '🚚',
  3: '🏭',
  4: '💰',
}

export const ROLE_EMOJI = {
  0: '❓',
  1: '🌾',
  2: '🔍',
  3: '🚛',
  4: '⚙️',
}

export const LOCALHOST_CHAIN_ID = '0x7a69' // 31337 in hex (Hardhat default)

export const LOCALHOST_NETWORK = {
  chainId: LOCALHOST_CHAIN_ID,
  chainName: 'Hardhat Localhost',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  blockExplorerUrls: [],
}

// Legacy aliases so existing imports don't break
export const SEPOLIA_CHAIN_ID = LOCALHOST_CHAIN_ID
export const SEPOLIA_NETWORK = LOCALHOST_NETWORK
export const HARDHAT_CHAIN_ID = LOCALHOST_CHAIN_ID
export const HARDHAT_NETWORK = LOCALHOST_NETWORK
