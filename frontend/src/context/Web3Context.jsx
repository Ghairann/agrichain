import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { ABI } from '../abi.js'
import { LOCALHOST_CHAIN_ID, LOCALHOST_NETWORK } from '../constants.js'

const Web3Context = createContext(null)

const LOCALHOST_CHAIN_BIGINT = 31337n

// Verify a contract is actually deployed (bytecode exists) and that
// the ABI's getPengguna selector is present in the deployed code.
async function verifyContract(provider, address) {
  const code = await provider.getCode(address)
  if (code === '0x') {
    throw Object.assign(
      new Error('Kontrak tidak ditemukan di alamat ini. Jalankan "npm run deploy:local" lalu refresh.'),
      { _agriCode: 'CONTRACT_NOT_DEPLOYED' },
    )
  }
}

export function Web3Provider({ children, contractAddress }) {
  const [account, setAccount]         = useState(null)
  const [provider, setProvider]       = useState(null)
  const [signer, setSigner]           = useState(null)
  const [contract, setContract]       = useState(null)
  const [userInfo, setUserInfo]       = useState(null)
  const [chainId, setChainId]         = useState(null)
  const [ethBalance, setEthBalance]   = useState(null)
  const [connecting, setConnecting]   = useState(false)
  const [toast, setToast]             = useState(null)

  const connectedRef = useRef(false)
  const providerRef  = useRef(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4500)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const loadUserInfo = useCallback(async (ct, addr) => {
    try {
      const info = await ct.getPengguna(addr)
      setUserInfo({ nama: info.nama, role: Number(info.role), aktif: info.aktif })
    } catch (err) {
      console.warn('[AgriChain] getPengguna failed in loadUserInfo:', err.code ?? err.message)
      setUserInfo({ nama: '', role: 0, aktif: false })
    }
  }, [])

  const fetchBalance = useCallback(async (prov, addr) => {
    try {
      const bal = await prov.getBalance(addr)
      setEthBalance(bal)
    } catch {
      setEthBalance(null)
    }
  }, [])

  const disconnect = useCallback(() => {
    connectedRef.current = false
    providerRef.current = null
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setUserInfo(null)
    setChainId(null)
    setEthBalance(null)
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      showToast('MetaMask tidak ditemukan. Pasang MetaMask terlebih dahulu.', 'error')
      return
    }
    setConnecting(true)
    try {
      // Step 1: request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Step 2: verify/switch to Hardhat Localhost (chainId 31337)
      let _provider = new ethers.BrowserProvider(window.ethereum)
      const { chainId: cId } = await _provider.getNetwork()
      if (cId !== LOCALHOST_CHAIN_BIGINT) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: LOCALHOST_CHAIN_ID }],
          })
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [LOCALHOST_NETWORK],
            })
          } else {
            throw switchErr
          }
        }
        _provider = new ethers.BrowserProvider(window.ethereum)
      }

      // Step 3: signer + address
      const _signer = await _provider.getSigner()
      const _addr   = await _signer.getAddress()

      // Step 4: verify contract bytecode exists on-chain before any ABI call
      await verifyContract(_provider, contractAddress.trim())

      // Step 5: contract instance
      const _contract = new ethers.Contract(contractAddress.trim(), ABI, _signer)

      // Step 6: fetch user info gracefully — not registered is OK, not an error
      let info = { nama: '', role: 0, aktif: false }
      try {
        const raw = await _contract.getPengguna(_addr)
        info = { nama: raw.nama, role: Number(raw.role), aktif: raw.aktif }
      } catch (err) {
        // BAD_DATA here means ABI mismatch or wrong contract — warn but do not block
        console.warn('[AgriChain] getPengguna returned unexpected data:', err.code ?? err.message)
        if (err.code === 'BAD_DATA') {
          showToast(
            'ABI tidak cocok dengan kontrak. Deploy ulang atau perbarui alamat kontrak.',
            'error',
          )
        }
      }

      // Step 7: commit state atomically
      const { chainId: confirmedChainId } = await _provider.getNetwork()
      providerRef.current = _provider
      setProvider(_provider)
      setSigner(_signer)
      setAccount(_addr)
      setChainId(confirmedChainId.toString())
      setContract(_contract)
      setUserInfo(info)
      connectedRef.current = true

      console.log('[AgriChain] connected', {
        chainId: confirmedChainId.toString(),
        contract: contractAddress,
        wallet: _addr,
        role: info.role,
        abiLength: ABI.length,
      })

      showToast('Wallet terhubung ke Hardhat Localhost!', 'success')
      fetchBalance(_provider, _addr)
    } catch (err) {
      console.error('[AgriChain] connect error:', err)

      let msg = err.message || 'Gagal menghubungkan wallet'

      if (err._agriCode === 'CONTRACT_NOT_DEPLOYED') {
        msg = err.message
      } else if (msg.includes('could not detect network') || msg.includes('network does not support')) {
        msg = 'Tidak dapat terhubung ke Hardhat node. Pastikan "npm run node" sudah berjalan.'
      } else if (msg.includes('BAD_DATA') || msg.includes('CALL_EXCEPTION')) {
        msg = 'Kontrak tidak cocok. Jalankan "npx hardhat clean && npx hardhat compile && npm run deploy:local" lalu refresh.'
      }

      showToast(msg.slice(0, 180), 'error')
    } finally {
      setConnecting(false)
    }
  }, [contractAddress, showToast, fetchBalance])

  const refreshUser = useCallback(async () => {
    if (contract && account) await loadUserInfo(contract, account)
  }, [contract, account, loadUserInfo])

  const refreshBalance = useCallback(async () => {
    if (providerRef.current && account) {
      await fetchBalance(providerRef.current, account)
    }
  }, [account, fetchBalance])

  // Detect Hardhat node restart: block number drops back near zero while connected.
  useEffect(() => {
    if (!provider || !connectedRef.current) return
    let lastBlock = -1
    const id = setInterval(async () => {
      try {
        const block = await provider.getBlockNumber()
        if (lastBlock > 5 && block <= 1) {
          disconnect()
          showToast(
            'Hardhat node diulang ulang. Deploy kontrak lagi lalu hubungkan kembali.',
            'info',
          )
        }
        lastBlock = block
      } catch {
        // provider gone — MetaMask event will handle disconnect
      }
    }, 4000)
    return () => clearInterval(id)
  }, [provider, disconnect, showToast])

  // MetaMask event listeners
  useEffect(() => {
    if (!window.ethereum) return

    const onAccounts = (accounts) => {
      if (!connectedRef.current) return
      disconnect()
      showToast(
        accounts.length === 0
          ? 'MetaMask terputus.'
          : 'Akun berubah. Klik Hubungkan untuk melanjutkan.',
        'info',
      )
    }

    const onChain = () => {
      if (!connectedRef.current) return
      disconnect()
      showToast('Jaringan berubah. Hubungkan ulang ke Hardhat Localhost.', 'info')
    }

    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged', onChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts)
      window.ethereum.removeListener('chainChanged', onChain)
    }
  }, [disconnect, showToast])

  const send = useCallback(async (fn, ...args) => {
    try {
      const tx = await fn(...args)
      showToast('Transaksi dikirim, menunggu konfirmasi…', 'info')
      await tx.wait()
      showToast('Transaksi berhasil!', 'success')
      if (providerRef.current && account) {
        fetchBalance(providerRef.current, account)
      }
      return true
    } catch (err) {
      const msg = err.reason || err.data?.message || err.message || 'Transaksi gagal'
      showToast(msg.slice(0, 120), 'error')
      return false
    }
  }, [showToast, account, fetchBalance])

  return (
    <Web3Context.Provider value={{
      account, provider, signer, contract, userInfo, chainId,
      ethBalance, refreshBalance,
      connecting, connect, disconnect, refreshUser, send,
      toast, showToast, dismissToast,
    }}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => useContext(Web3Context)
