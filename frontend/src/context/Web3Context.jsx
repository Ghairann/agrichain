import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { ABI } from '../abi.js'
import { LOCALHOST_CHAIN_ID, LOCALHOST_NETWORK } from '../constants.js'

const Web3Context = createContext(null)

const LOCALHOST_CHAIN_BIGINT = 31337n

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

  // Tracks whether the user has actively connected this session.
  const connectedRef = useRef(false)
  // Keep latest provider in a ref for use inside callbacks without stale closure.
  const providerRef = useRef(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4500)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const loadUserInfo = useCallback(async (ct, addr) => {
    try {
      const info = await ct.getPengguna(addr)
      setUserInfo({ nama: info.nama, role: Number(info.role), aktif: info.aktif })
    } catch {
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

  // Explicit user-gesture connect — never called automatically.
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
            // Chain not yet added in MetaMask — add Hardhat Localhost
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

      // Step 4: contract instance
      const _contract = new ethers.Contract(contractAddress.trim(), ABI, _signer)

      // Step 5: validate contract by calling getPengguna
      const info = await _contract.getPengguna(_addr)
      const role = Number(info.role)

      // Step 6: commit all state atomically
      const { chainId: confirmedChainId } = await _provider.getNetwork()
      providerRef.current = _provider
      setProvider(_provider)
      setSigner(_signer)
      setAccount(_addr)
      setChainId(confirmedChainId.toString())
      setContract(_contract)
      setUserInfo({ nama: info.nama, role, aktif: info.aktif })
      connectedRef.current = true
      showToast('Wallet terhubung ke Hardhat Localhost!', 'success')

      // Fetch initial ETH balance
      fetchBalance(_provider, _addr)
    } catch (err) {
      console.error('[AgriChain] connect error:', err)

      // Friendly message for common localhost errors
      let msg = err.reason || err.data?.message || err.message || 'Gagal menghubungkan wallet'
      if (msg.includes('could not detect network') || msg.includes('network does not support')) {
        msg = 'Tidak dapat terhubung ke Hardhat node. Pastikan "npm run node" sudah berjalan.'
      } else if (msg.includes('BAD_DATA') || msg.includes('CALL_EXCEPTION')) {
        msg = 'Kontrak tidak ditemukan di jaringan ini. Pastikan sudah deploy dan alamat kontrak benar.'
      }
      showToast(msg.slice(0, 150), 'error')
    } finally {
      setConnecting(false)
    }
  }, [contractAddress, showToast, fetchBalance])

  const refreshUser = useCallback(async () => {
    if (contract && account) await loadUserInfo(contract, account)
  }, [contract, account, loadUserInfo])

  // Refresh wallet ETH balance on demand (call after transactions)
  const refreshBalance = useCallback(async () => {
    if (providerRef.current && account) {
      await fetchBalance(providerRef.current, account)
    }
  }, [account, fetchBalance])

  // MetaMask event listeners — registered once, never torn down.
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
      // Refresh balance after every successful transaction
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
