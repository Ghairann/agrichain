# 🌾 AgriChain — Blockchain Traceability & Escrow Platform

AgriChain adalah sistem traceability rantai pasok pertanian berbasis **Ethereum smart contract** dengan mekanisme **Escrow ETH otomatis**, memastikan pembayaran aman antara petani, auditor, dan distributor.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🌾 **Pendaftaran Produk** | Petani mendaftarkan komoditas dengan detail lengkap dan harga ETH |
| 🔍 **Verifikasi Kualitas** | Auditor memverifikasi dan mengesahkan produk sebelum diperdagangkan |
| 🔒 **Escrow Otomatis** | ETH dikunci di smart contract, aman hingga pengiriman dikonfirmasi |
| 💸 **Pembayaran Transparan** | ETH cair ke petani atau refund ke distributor via on-chain event |
| 📍 **Traceability QR** | Setiap produk punya riwayat lengkap & QR code untuk pelacakan |
| 👥 **Role-Based Access** | Admin, Petani, Auditor, Distributor dengan hak akses berbeda |
| 📊 **Dashboard Real-time** | Saldo ETH wallet, escrow terkunci, ETH dirilis, statistik kontrak |

---

## 🔄 Alur Escrow (End-to-End)

```
[1] Admin         → daftarkanPengguna()       → Daftarkan Petani, Auditor, Distributor
[2] Petani        → daftarkanProduk()          → Input data panen + set harga ETH
[3] Auditor       → verifikasiProduk()         → Cek kualitas → status: Terverifikasi ✅
[4] Distributor   → beliProduk() [payable]     → ETH TERKUNCI di escrow 🔒
[5] Auditor       → konfirmasiPenerimaan()     → ETH CAIR ke petani 💸
                  → tolakProduk()              → ETH REFUND ke distributor ↩️
[6] Siapa saja    → getRiwayatProduk()         → Scan QR, lihat seluruh riwayat 📋
```

---

## 👥 Sistem Role

| Role | Kode | Kemampuan |
|------|------|-----------|
| **Admin** | 4 | Mendaftarkan pengguna baru ke semua role |
| **Petani** | 1 | Mendaftarkan produk, menerima pembayaran ETH |
| **Auditor** | 2 | Verifikasi produk, konfirmasi/tolak pengiriman |
| **Distributor** | 3 | Membeli produk, membayar via escrow ETH |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Smart Contract | Solidity `^0.8.20` |
| Blockchain Framework | Hardhat 2.x |
| Testing | Chai + Mocha (23 unit tests) |
| Frontend | React 18 + Vite 5 + TailwindCSS 3 |
| Web3 | Ethers.js v6 |
| Icons | Lucide React |
| QR Code | react-qr-code |
| Wallet | MetaMask |

---

## 📁 Struktur Proyek

```
agrichain/
├── contracts/
│   └── AgriChain.sol          ← Smart contract utama + Escrow
├── scripts/
│   ├── deploy.js              ← Deploy localhost + demo alur lengkap
│   └── deploy-sepolia.js      ← Deploy ke Sepolia testnet
├── test/
│   └── AgriChain.test.js      ← 23 unit tests
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── Web3Context.jsx    ← Web3 provider + MetaMask integration
│   │   ├── components/
│   │   │   ├── BalanceCard.jsx    ← ETH balance + stat cards
│   │   │   ├── Header.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── TraceabilityModal.jsx
│   │   │   └── ...
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── PetaniDashboard.jsx
│   │   │   ├── AuditorDashboard.jsx
│   │   │   └── DistributorDashboard.jsx
│   │   ├── abi.js             ← Auto-synced from compiled artifact
│   │   ├── constants.js       ← Enums, labels, network config
│   │   └── utils.js           ← formatEth(), shortAddr()
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── env.example                ← Template variabel environment
├── hardhat.config.js
└── package.json
```

---

## ⚡ Instalasi

### Prasyarat
- Node.js 18+
- MetaMask browser extension
- Git

### 1. Clone & Install

```bash
git clone https://github.com/Ghairann/agrichain.git
cd agrichain

# Install Hardhat dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Compile Smart Contract

```bash
npm run compile
```

### 3. Jalankan Test Suite

```bash
npm test
# Expected: 23 passing
```

---

## 🖥️ Setup Localhost Development

### Terminal 1 — Jalankan Hardhat Node

```bash
npm run node
```

Simpan akun yang muncul:
```
Account #0 (Admin/Deployer): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  ← 10000 ETH
Account #1 (Petani):         0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Account #2 (Auditor):        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Account #3 (Distributor):    0x90F79bf6EB2c4f870365E785982E1f101E93b906
```

### Terminal 2 — Deploy Kontrak

```bash
npm run deploy:local
```

Script ini otomatis:
- Deploy `AgriChain.sol` ke node lokal
- Mendaftarkan semua demo pengguna
- Menjalankan alur escrow lengkap sebagai demo
- **Memperbarui `frontend/.env.local`** dengan alamat kontrak baru

### Terminal 3 — Jalankan Frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## 🦊 Setup MetaMask

### Tambahkan Jaringan Hardhat Localhost

Buka MetaMask → **Settings → Networks → Add Network → Add manually**:

| Field | Nilai |
|-------|-------|
| Network Name | Hardhat Localhost |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | ETH |

### Import Akun Test

Dari output `npm run node`, salin **Private Key** dari akun yang diinginkan (Account #0–#3), lalu di MetaMask:

**Import Account → Paste Private Key**

> ⚠️ Gunakan akun Hardhat **HANYA** untuk testing. Jangan kirim ETH asli ke akun ini.

---

## 🔃 Workflow Setelah Restart VS Code

Setiap kali VS Code atau komputer di-restart, jalankan ulang:

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local

# Terminal 3 (jika frontend belum jalan)
cd frontend && npm run dev
```

> Catatan: `npm run deploy:local` akan memperbarui `frontend/.env.local` secara otomatis.  
> Jika Vite sudah berjalan, restart Vite setelah deploy agar alamat kontrak terbaca.

---

## 🌐 Deploy ke Sepolia Testnet (Opsional)

### 1. Setup Environment

```bash
cp env.example .env
```

Edit `.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. Deploy

```bash
npm run deploy:sepolia
```

### 3. Verify di Etherscan (Opsional)

```bash
npm run verify:sepolia -- --network sepolia CONTRACT_ADDRESS
```

---

## 📊 Smart Contract — Fungsi Utama

| Fungsi | Role | Keterangan |
|--------|------|-----------|
| `daftarkanPengguna(addr, nama, role)` | Admin | Daftarkan pengguna baru |
| `daftarkanProduk(nama, lokasi, berat, metode, harga)` | Petani | Daftarkan produk |
| `verifikasiProduk(id, keterangan)` | Auditor | Verifikasi kualitas |
| `beliProduk(id)` payable | Distributor | Beli + kunci ETH di escrow |
| `konfirmasiPenerimaan(id, keterangan)` | Auditor | ETH cair ke petani |
| `tolakProduk(id, keterangan)` | Auditor | Refund ETH ke distributor |
| `getProduk(id)` | Semua | Baca detail produk |
| `getRiwayatProduk(id)` | Semua | Baca riwayat perjalanan |
| `getEscrow(id)` | Semua | Cek saldo escrow |
| `getContractBalance()` | Semua | Total ETH di kontrak |

---

## 🧪 Test Suite

```bash
npm test
```

```
AgriChain
  1. Deployment          ✔ Owner terdaftar sebagai Admin
                         ✔ Total produk dan pengguna awal benar
  2. Manajemen Pengguna  ✔ Admin bisa daftarkan petani, auditor, distributor
                         ✔ Bukan admin tidak bisa daftarkan pengguna
                         ✔ Tidak bisa daftarkan duplikat
                         ✔ Validasi address(0) dan nama kosong
  3. Pendaftaran Produk  ✔ Petani bisa daftarkan produk
                         ✔ Validasi berat 0 dan nama kosong
  4. Verifikasi          ✔ Auditor bisa verifikasi, cegah verifikasi ganda
  5. Escrow Normal       ✔ Beli → ETH terkunci → konfirmasi → ETH cair ke petani
  6. Escrow Penolakan    ✔ Tolak → ETH refund ke distributor
  7. Traceability        ✔ Riwayat mencatat seluruh perjalanan produk

23 passing
```

---

## 📸 Screenshots

> _Screenshots akan ditambahkan setelah deployment pertama._

| Halaman | Preview |
|---------|---------|
| Landing Page | _(segera)_ |
| Admin Dashboard | _(segera)_ |
| Petani Dashboard | _(segera)_ |
| Auditor Dashboard | _(segera)_ |
| Distributor Dashboard | _(segera)_ |
| Traceability Modal + QR | _(segera)_ |

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: deskripsi fitur'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

MIT License — bebas digunakan untuk tujuan pendidikan dan penelitian.

---

<div align="center">
  <strong>AgriChain © 2026</strong><br/>
  Blockchain Traceability & Escrow Platform untuk Pertanian Indonesia 🇮🇩
</div>
