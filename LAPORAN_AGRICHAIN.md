# LAPORAN TUGAS BESAR

---

## AgriChain: Sistem *Traceability* dan Escrow Pembayaran Rantai Pasok Pertanian Berbasis Blockchain Ethereum

---

**Mata Kuliah:** Pemrograman Berbasis Blockchain  
**Program Studi:** Teknik Informatika  
**Semester:** Genap 2024/2025

---

**Disusun Oleh:**

| No | Nama | NIM |
|----|------|-----|
| 1 | Geran Rahmat | — |
| 2 | — | — |
| 3 | — | — |

---

*Laporan ini disusun sebagai pemenuhan tugas besar mata kuliah Pemrograman Berbasis Blockchain.*

---

---

# DAFTAR ISI

- [BAB 1 — PENDAHULUAN](#bab-1--pendahuluan)
- [BAB 2 — TINJAUAN PUSTAKA](#bab-2--tinjauan-pustaka)
- [BAB 3 — METODOLOGI DAN PERANCANGAN SISTEM](#bab-3--metodologi-dan-perancangan-sistem)
- [BAB 4 — IMPLEMENTASI](#bab-4--implementasi)
- [BAB 5 — PENGUJIAN](#bab-5--pengujian)
- [BAB 6 — PENUTUP](#bab-6--penutup)
- [DAFTAR PUSTAKA](#daftar-pustaka)

---

---

# BAB 1 — PENDAHULUAN

## 1.1 Latar Belakang

Sektor pertanian merupakan tulang punggung perekonomian Indonesia, menyumbang sekitar 13% dari Produk Domestik Bruto (PDB) nasional dan menyerap lebih dari 29% angkatan kerja [1]. Namun di balik angka tersebut, para petani Indonesia — khususnya petani kecil — masih menghadapi persoalan mendasar yang belum terselesaikan: ketidakadilan dalam rantai pasok (*supply chain*) komoditas pertanian.

Permasalahan paling krusial adalah dominasi **tengkulak** atau perantara (*middleman*) yang memotong harga di tingkat petani hingga jauh di bawah harga pasar. Studi Kementerian Pertanian RI menunjukkan bahwa petani sering hanya menerima 20–40% dari harga akhir yang dibayarkan konsumen [2]. Selisih nilai ini diserap oleh rantai distribusi yang panjang, tidak transparan, dan tidak dapat diaudit oleh pihak mana pun.

Di sisi lain, **tidak adanya sistem traceability** menyebabkan konsumen dan distributor tidak dapat memverifikasi asal-usul produk, metode budidaya, atau kualitas komoditas yang mereka beli. Pemalsuan label organik, manipulasi berat timbangan, dan ketidakjelasan tanggal panen adalah beberapa contoh masalah nyata yang merugikan semua pemangku kepentingan. Kepercayaan antara petani, auditor, dan distributor sulit dibangun tanpa sistem pencatatan yang bersifat permanen, transparan, dan tidak dapat dimanipulasi.

Permasalahan ketiga adalah **risiko pembayaran**. Distributor khawatir membayar terlebih dahulu sebelum barang diterima, sementara petani khawatir mengirim produk sebelum pembayaran dijamin. Ketiadaan mekanisme penjaminan pembayaran yang dipercaya oleh kedua belah pihak menyebabkan transaksi sering kali bergantung pada kepercayaan personal atau lembaga perantara yang berbiaya tinggi.

Teknologi **Blockchain** menawarkan solusi fundamental atas ketiga permasalahan tersebut. Sifat blockchain yang *immutable* (tidak dapat diubah), *decentralized* (terdesentralisasi), dan *transparent* (transparan) memungkinkan pencatatan setiap tahapan rantai pasok secara permanen tanpa pihak pusat yang dapat memanipulasi data [3]. Lebih jauh, fitur **Smart Contract** pada platform Ethereum memungkinkan otomasi pembayaran berbasis kondisi logis (*programmatic escrow*), sehingga pembayaran hanya dilepaskan ke petani apabila kondisi tertentu — dalam hal ini konfirmasi penerimaan produk oleh auditor independen — telah terpenuhi [4].

Berdasarkan latar belakang tersebut, proyek **AgriChain** dikembangkan sebagai sistem traceability dan escrow pembayaran rantai pasok pertanian yang dibangun di atas Ethereum Virtual Machine (EVM), dengan antarmuka pengguna berbasis React yang terhubung ke jaringan Ethereum lokal (Hardhat) melalui MetaMask.

## 1.2 Rumusan Masalah

Berdasarkan uraian latar belakang, rumusan masalah dalam proyek ini adalah sebagai berikut:

1. Bagaimana merancang dan mengimplementasikan smart contract berbasis Solidity yang mampu mencatat seluruh alur rantai pasok pertanian secara transparan dan tidak dapat dimanipulasi?
2. Bagaimana mekanisme escrow berbasis ETH dapat menjamin keamanan pembayaran antara distributor dan petani tanpa perantara keuangan tradisional?
3. Bagaimana sistem role-based access control (*RBAC*) pada smart contract dapat memastikan bahwa setiap aksi hanya dapat dilakukan oleh aktor yang berwenang?
4. Bagaimana merancang antarmuka pengguna (frontend) yang intuitif dan terintegrasi dengan MetaMask untuk mendukung operasi keempat peran pengguna: Admin, Petani, Auditor, dan Distributor?

## 1.3 Tujuan

Tujuan dari pengembangan sistem AgriChain adalah:

1. Mengimplementasikan smart contract `AgriChain.sol` pada platform Ethereum yang mengenkapsulasi logika bisnis rantai pasok pertanian secara lengkap, meliputi manajemen pengguna, pendaftaran produk, verifikasi kualitas, dan mekanisme escrow pembayaran.
2. Membangun mekanisme escrow ETH yang bersifat trustless, di mana pembayaran dikunci secara otomatis saat distributor membeli produk dan dicairkan ke petani hanya setelah auditor mengonfirmasi penerimaan.
3. Menerapkan role-based access control berbasis modifier Solidity untuk memastikan isolasi hak akses antara peran Admin, Petani, Auditor, dan Distributor.
4. Mengembangkan aplikasi frontend React dengan dashboard terpisah per peran yang terhubung ke smart contract melalui library ethers.js v6 dan MetaMask.
5. Menghasilkan sistem traceability yang menyimpan seluruh riwayat perubahan status produk secara on-chain, dapat diaudit oleh siapa pun.

## 1.4 Manfaat

**Bagi Petani:**
- Mendapatkan jaminan pembayaran yang pasti melalui mekanisme escrow sebelum produk dikirim.
- Harga jual ditetapkan secara adil oleh auditor independen berdasarkan kualitas aktual produk.
- Rekam jejak produk yang dapat ditunjukkan kepada pembeli sebagai bukti kualitas dan keaslian.

**Bagi Distributor:**
- Mendapatkan kepastian kualitas produk yang telah diverifikasi oleh auditor sebelum melakukan pembayaran.
- Dana yang telah dikunci di escrow akan dikembalikan sepenuhnya jika produk yang diterima tidak sesuai.
- Akses ke sistem traceability yang transparan dan dapat diverifikasi.

**Bagi Auditor:**
- Platform terpusat untuk mengelola antrian verifikasi produk, menetapkan harga, dan mengonfirmasi atau menolak pengiriman.
- Seluruh keputusan auditor tercatat secara permanen di blockchain sebagai bentuk akuntabilitas.

**Bagi Ekosistem Pertanian:**
- Mengurangi ketergantungan pada tengkulak dan sistem perantara yang tidak transparan.
- Memberikan landasan teknis untuk pengembangan sistem sertifikasi organik berbasis blockchain di masa depan.
- Model ini dapat diadaptasi untuk berbagai komoditas dan diperluas ke jaringan Ethereum publik.

---

---

# BAB 2 — TINJAUAN PUSTAKA

## 2.1 Blockchain dan Ethereum

Blockchain adalah struktur data terdistribusi berupa rantai blok (*chain of blocks*) yang masing-masing blok memuat kumpulan transaksi yang telah divalidasi. Setiap blok berisi *hash* kriptografis dari blok sebelumnya, sehingga perubahan pada satu blok akan membatalkan seluruh rantai setelahnya — sifat inilah yang menjadikan blockchain *immutable* [3]. Konsensus desentralisasi (pada Ethereum menggunakan mekanisme *Proof of Stake* sejak *The Merge* 2022) menggantikan otoritas pusat sebagai penjamin validitas transaksi.

**Ethereum** adalah platform blockchain generasi kedua yang memperkenalkan konsep *smart contract* — program yang dijalankan di atas Ethereum Virtual Machine (EVM) dan bersifat *Turing-complete* [5]. Jaringan Ethereum memiliki mata uang asli bernama **Ether (ETH)** yang digunakan sebagai *gas fee* untuk mengeksekusi operasi di EVM. Untuk keperluan pengembangan dan pengujian lokal, Ethereum menggunakan jaringan simulasi seperti **Hardhat Network** yang menyediakan akun-akun dengan saldo ETH fiktif.

## 2.2 Smart Contract dan Solidity

*Smart contract* adalah program komputer yang berjalan di atas blockchain, dieksekusi secara deterministik oleh setiap node jaringan, dan hasilnya tidak dapat disangkal atau dimanipulasi oleh pihak mana pun termasuk pembuatnya [4]. Karakteristik utama smart contract adalah: (1) *trustless* — pihak-pihak tidak perlu saling percaya karena logika dieksekusi oleh kode; (2) *transparent* — kode dan kondisinya dapat dibaca oleh semua pihak; (3) *immutable* setelah di-deploy; dan (4) *self-executing* — berjalan otomatis ketika kondisi terpenuhi.

**Solidity** adalah bahasa pemrograman *statically-typed*, *object-oriented* yang dirancang khusus untuk penulisan smart contract pada EVM [5]. Solidity mendukung fitur-fitur seperti *inheritance*, *library*, *modifier*, *event*, dan tipe data kompleks seperti *struct*, *mapping*, dan *enum*. Versi yang digunakan dalam proyek AgriChain adalah `pragma solidity ^0.8.20`, yang memanfaatkan fitur built-in overflow checking dan berbagai penyempurnaan keamanan.

## 2.3 Escrow Berbasis Smart Contract

*Escrow* adalah mekanisme di mana pihak ketiga terpercaya menahan dana hingga kondisi perjanjian antara dua pihak terpenuhi. Dalam konteks tradisional, peran ini diemban oleh bank atau notaris yang memerlukan biaya dan waktu tambahan. Smart contract memungkinkan implementasi escrow yang sepenuhnya otomatis (*trustless escrow*): dana dikunci dalam kode program dan dilepaskan atau dikembalikan berdasarkan logika yang telah disepakati di awal [6].

Mekanisme escrow pada AgriChain bekerja dengan prinsip: (1) distributor mengirim ETH sejumlah harga produk ke smart contract saat melakukan pembelian; (2) ETH tersimpan dalam mapping `escrow[id]` di dalam kontrak; (3) auditor mengonfirmasi penerimaan → ETH dikirim langsung ke alamat petani via `call{value}()`; atau (4) auditor menolak pengiriman → ETH dikembalikan ke alamat distributor. Seluruh alur ini terjadi tanpa intervensi manusia setelah kondisi terpenuhi.

## 2.4 Supply Chain Pertanian dan Permasalahannya

Rantai pasok (*supply chain*) pertanian Indonesia pada umumnya melibatkan empat lapisan: petani → pengumpul/tengkulak → distributor → pengecer → konsumen. Panjangnya rantai ini menyebabkan: (1) harga di tingkat petani tertekan; (2) tidak ada mekanisme verifikasi kualitas yang standar; (3) informasi tentang asal-usul produk hilang di setiap tahap perpindahan tangan; dan (4) pembayaran sering tertunda atau tidak terjamin [2].

Penelitian terdahulu menunjukkan bahwa penerapan blockchain pada rantai pasok pertanian mampu meningkatkan transparansi, mengurangi pemalsuan, dan mempercepat pembayaran [7]. Proyek-proyek seperti IBM Food Trust (bekerja sama dengan Walmart) telah membuktikan kelayakan blockchain untuk traceability pangan di skala komersial, meskipun solusi tersebut bersifat *permissioned* (terpusat). AgriChain mengadopsi pendekatan *permissionless* berbasis Ethereum untuk memaksimalkan transparansi.

## 2.5 Web3 dan MetaMask

**Web3** mengacu pada generasi internet berbasis blockchain di mana pengguna memiliki kontrol penuh atas data dan aset digital mereka. Dalam konteks pengembangan aplikasi, Web3 merujuk pada perangkat lunak yang memungkinkan aplikasi berbasis web terhubung ke jaringan blockchain [8].

**MetaMask** adalah ekstensi browser yang berfungsi sebagai dompet Ethereum (*wallet*) sekaligus *provider* Web3. MetaMask mengelola pasangan kunci privat/publik pengguna secara lokal, menampilkan permintaan transaksi kepada pengguna untuk diotorisasi, dan menyuntikkan objek `window.ethereum` ke dalam halaman web sehingga aplikasi frontend dapat berinteraksi dengan jaringan Ethereum [9].

**ethers.js** adalah library JavaScript yang menjadi jembatan antara aplikasi frontend dan jaringan Ethereum. Versi 6 yang digunakan dalam proyek ini memperkenalkan API berbasis Promise yang lebih modern, dukungan ESM native, dan tipe data BigInt untuk representasi nilai ETH [10].

---

---

# BAB 3 — METODOLOGI DAN PERANCANGAN SISTEM

## 3.1 Arsitektur Sistem

AgriChain dibangun dengan arsitektur tiga lapis yang terdiri dari:

```
┌─────────────────────────────────────────────────────────┐
│                   LAPISAN PRESENTASI                     │
│     React + Vite + Tailwind CSS (localhost:3000)         │
│   AdminDashboard | PetaniDashboard | AuditorDashboard    │
│                  | DistributorDashboard                   │
└──────────────────────────┬──────────────────────────────┘
                           │  ethers.js v6 (BrowserProvider)
                           │  window.ethereum (injected)
┌──────────────────────────▼──────────────────────────────┐
│                   LAPISAN WALLET                          │
│              MetaMask Browser Extension                   │
│        Manajemen Kunci, Penandatanganan Transaksi        │
└──────────────────────────┬──────────────────────────────┘
                           │  JSON-RPC
┌──────────────────────────▼──────────────────────────────┐
│                   LAPISAN BLOCKCHAIN                      │
│         Hardhat Network (localhost:8545, chainId 31337)  │
│              Smart Contract: AgriChain.sol               │
│         (Solidity ^0.8.20, dikompilasi Hardhat)          │
└─────────────────────────────────────────────────────────┘
```

**Komponen utama:**
- **AgriChain.sol** — Smart contract yang mengandung seluruh logika bisnis: manajemen peran, pendaftaran produk, verifikasi, dan escrow ETH.
- **Hardhat Node** — Jaringan Ethereum lokal yang menjalankan EVM simulasi dengan 20 akun bernilai 10.000 ETH masing-masing.
- **scripts/deploy.js** — Script Hardhat yang men-deploy kontrak, mendaftarkan 5 peserta awal, mensimulasikan alur bisnis lengkap, dan secara otomatis menulis alamat kontrak ke `frontend/.env.local`.
- **Frontend React** — Aplikasi single-page berbasis Vite yang menyajikan dashboard terpisah sesuai peran pengguna yang terdeteksi dari smart contract.
- **Web3Context** — React Context yang mengenkapsulasi seluruh state koneksi Web3 (provider, signer, contract instance, userInfo, ethBalance) dan diakses oleh semua komponen dashboard.

## 3.2 Perancangan Smart Contract AgriChain.sol

### 3.2.1 Enum Role

```solidity
enum Role { TidakTerdaftar, Petani, Auditor, Distributor, Admin }
```

| Nilai | Nama | Deskripsi |
|-------|------|-----------|
| 0 | TidakTerdaftar | Alamat belum didaftarkan ke sistem |
| 1 | Petani | Dapat mendaftarkan produk pertanian |
| 2 | Auditor | Dapat memverifikasi produk dan mengelola escrow |
| 3 | Distributor | Dapat membeli produk dengan ETH |
| 4 | Admin | Dapat mendaftarkan pengguna baru |

### 3.2.2 Enum Status

```solidity
enum Status {
    MenungguAudit,   // 0 - Baru didaftarkan, menunggu auditor
    Terverifikasi,   // 1 - Diverifikasi auditor + harga ditetapkan, siap dijual
    DalamPengiriman, // 2 - ETH terkunci di escrow
    DiDistributor,   // 3 - (legacy, tidak digunakan)
    Terjual,         // 4 - ETH dicairkan ke petani
    Ditolak          // 5 - Ditolak auditor
}
```

### 3.2.3 Struct Pengguna

```solidity
struct Pengguna {
    string nama;
    Role role;
    bool aktif;
}
```

Setiap alamat wallet yang terdaftar dipetakan ke struct `Pengguna` melalui `mapping(address => Pengguna) public pengguna`. Struct ini menyimpan nama, peran, dan status keaktifan pengguna.

### 3.2.4 Struct Produk

```solidity
struct Produk {
    uint256 id;
    string nama;
    string lokasi;
    uint256 berat;
    string metode;
    address petani;
    Status status;
    uint256 hargaFinalAuditor;
    address auditorPenentuHarga;
}
```

Desain penting: field `hargaFinalAuditor` tidak diisi oleh petani saat pendaftaran, melainkan ditetapkan oleh auditor saat verifikasi. Ini memastikan harga mencerminkan kualitas aktual produk, bukan klaim sepihak petani.

### 3.2.5 Struct Riwayat

```solidity
struct Riwayat {
    uint256 waktu;
    address pelaku;
    Status status;
    string keterangan;
}
```

Setiap perubahan status produk menghasilkan satu entri `Riwayat` baru yang ditambahkan ke array `mapping(uint256 => Riwayat[]) public riwayat`. Array ini tidak pernah dikurangi, menjadikannya jejak audit permanen yang dapat diakses oleh siapa pun.

### 3.2.6 Mekanisme Escrow ETH

Escrow diimplementasikan menggunakan dua mapping:
- `mapping(uint256 => uint256) public escrow` — menyimpan jumlah ETH yang terkunci per produk (dalam Wei).
- `mapping(uint256 => address) public pembeli` — mencatat alamat distributor yang membeli produk tersebut.

Pola *Checks-Effects-Interactions* (CEI) diterapkan pada fungsi pencairan dan refund untuk mencegah serangan reentrancy:

```solidity
// Pola CEI pada konfirmasiPenerimaan
escrow[_id] = 0;                          // Effects: nolkan escrow dulu
produk[_id].status = Status.Terjual;       // Effects: ubah status
(bool ok,) = payable(petaniAddr).call{value: nilai}(""); // Interactions: baru transfer
require(ok, "AgriChain: Transfer ke petani gagal");
```

### 3.2.7 Role-Based Access Control (Modifier)

```solidity
modifier hanyaAdmin()       { require(pengguna[msg.sender].role == Role.Admin, ...); _; }
modifier hanyaAuditor()     { require(pengguna[msg.sender].role == Role.Auditor, ...); _; }
modifier hanyaPetani()      { require(pengguna[msg.sender].role == Role.Petani, ...); _; }
modifier hanyaDistributor() { require(pengguna[msg.sender].role == Role.Distributor, ...); _; }
```

Keempat modifier ini digunakan sebagai *guard* pada setiap fungsi mutasi, memastikan bahwa hanya aktor yang memiliki peran yang tepat yang dapat memanggil fungsi tersebut. Pelanggaran akan menghasilkan revert dengan pesan error yang deskriptif.

### 3.2.8 Events

Smart contract memancarkan tujuh event untuk mendukung indeksasi off-chain dan reactive UI di frontend:

| Event | Dipancarkan Saat |
|-------|-----------------|
| `PenggunaTerdaftar(address, string, Role)` | Admin mendaftarkan pengguna baru |
| `ProdukDidaftarkan(uint256, string, address)` | Petani mendaftarkan produk |
| `ProdukDiverifikasi(uint256, address, uint256)` | Auditor memverifikasi dan menetapkan harga |
| `ProdukDitolak(uint256, address, string)` | Auditor menolak produk di tahap audit |
| `ETHDikunci(uint256, address, uint256)` | Distributor membeli produk, ETH terkunci |
| `ETHDicairkan(uint256, address, uint256)` | Auditor konfirmasi, ETH cair ke petani |
| `ETHDiRefund(uint256, address, uint256)` | Auditor tolak pengiriman, ETH refund ke distributor |

## 3.3 Alur Bisnis Sistem

Alur bisnis AgriChain terdiri dari enam tahap berurutan:

```
[Admin] ──daftarkanPengguna()──▶ Pengguna terdaftar di blockchain

[Petani] ──daftarkanProduk()──▶ Produk berstatus MenungguAudit(0)
                                 Riwayat[0]: "Produk didaftarkan"

[Auditor] ──verifikasiDanTentukanHarga()──▶ Status: Terverifikasi(1)
         ──ATAU tolakProduk()─────────────▶ Status: Ditolak(5)
                                            Riwayat[1]: Keputusan auditor

[Distributor] ──beliProduk(value=harga)──▶ ETH dikunci di escrow
                                           Status: DalamPengiriman(2)
                                           Riwayat[2]: "Dibeli - ETH dikunci"

[Auditor] ──konfirmasiPenerimaan()──▶ ETH otomatis cair ke petani
                                      Status: Terjual(4)
                                      Riwayat[3]: Konfirmasi
         ──ATAU tolakPengiriman()──▶ ETH refund ke distributor
                                    Status: kembali Terverifikasi(1)
                                    Riwayat[3]: Penolakan
```

**Catatan penting:** Setelah `tolakPengiriman()`, status produk kembali ke `Terverifikasi(1)`, sehingga distributor dapat melakukan pembelian ulang. Ini memungkinkan skenario pengiriman ulang tanpa perlu mendaftarkan produk baru.

## 3.4 Perancangan Frontend React

Frontend dibangun dengan **React 18**, **Vite** sebagai bundler, dan **Tailwind CSS** untuk styling. Struktur aplikasi mengikuti pola:

```
frontend/src/
├── App.jsx               — Root component, routing berdasarkan userInfo.role
├── context/
│   └── Web3Context.jsx   — Provider: connect(), disconnect(), send(), state global
├── dashboards/
│   ├── AdminDashboard.jsx
│   ├── PetaniDashboard.jsx
│   ├── AuditorDashboard.jsx
│   └── DistributorDashboard.jsx
├── components/
│   ├── ProductCard.jsx   — Kartu produk reusable
│   ├── TraceabilityModal.jsx — Modal riwayat on-chain
│   ├── StatusBadge.jsx   — Badge status produk berwarna
│   ├── RoleBadge.jsx     — Badge peran pengguna
│   ├── BalanceCard.jsx   — Kartu saldo ETH wallet
│   └── Spinner.jsx       — Indikator loading
├── abi.js                — ABI JSON kompilasi kontrak
├── constants.js          — STATUS enum, ROLE_LABEL, konfigurasi jaringan
└── utils.js              — mapProduct(), formatEth(), shortAddr()
```

**`Web3Context`** menyediakan hook `useWeb3()` yang memberi seluruh komponen akses ke `account`, `contract`, `userInfo`, `ethBalance`, dan fungsi `send()`. Fungsi `send()` adalah wrapper di atas pemanggilan kontrak yang secara otomatis menampilkan toast notifikasi, menunggu konfirmasi blok, dan merefresh saldo.

Deteksi peran dilakukan secara otomatis setelah koneksi MetaMask: aplikasi memanggil `contract.getPengguna(walletAddress)` dan menampilkan dashboard yang sesuai berdasarkan nilai `userInfo.role`.

## 3.5 Use Case Diagram

```
                    ┌──────────────────────────────────┐
                    │          AgriChain System         │
                    │                                   │
 [Admin] ──────────▶│  Daftarkan Pengguna               │
                    │                                   │
 [Petani] ─────────▶│  Daftarkan Produk                 │
                    │  Lihat Produk Sendiri              │
                    │  Lihat Riwayat Produk             │
                    │                                   │
 [Auditor] ────────▶│  Verifikasi + Tetapkan Harga      │
                    │  Tolak Produk (pre-escrow)        │
                    │  Konfirmasi Penerimaan (post-escrow)│
                    │  Tolak Pengiriman (post-escrow)   │
                    │  Lihat Semua Produk               │
                    │                                   │
 [Distributor] ────▶│  Beli Produk (escrow ETH)         │
                    │  Lihat Pembelian Sendiri           │
                    │  Lihat Riwayat Produk             │
                    └──────────────────────────────────┘
```

## 3.6 Flowchart Alur Escrow

```
MULAI
  │
  ▼
Petani: daftarkanProduk()
  │  Status → MenungguAudit
  ▼
Auditor: Periksa kualitas?
  ├── TIDAK LAYAK ──▶ tolakProduk() ──▶ Status: Ditolak → SELESAI
  └── LAYAK
       │
       ▼
Auditor: verifikasiDanTentukanHarga(harga)
  │  Status → Terverifikasi
  ▼
Distributor: beliProduk(value = harga)
  │  ETH dikunci di escrow
  │  Status → DalamPengiriman
  ▼
Auditor: Cek kondisi produk diterima?
  ├── TIDAK SESUAI ──▶ tolakPengiriman()
  │                      ETH refund ke Distributor
  │                      Status → Terverifikasi (dapat dibeli ulang)
  └── SESUAI
       │
       ▼
Auditor: konfirmasiPenerimaan()
  │  ETH otomatis transfer ke Petani
  │  Status → Terjual
  ▼
SELESAI
```

---

---

# BAB 4 — IMPLEMENTASI

## 4.1 Implementasi Smart Contract

### 4.1.1 Konstruktor dan Inisialisasi Admin

```solidity
constructor() {
    owner = msg.sender;
    pengguna[msg.sender] = Pengguna("Admin AgriChain", Role.Admin, true);
    totalPengguna = 1;
}
```

Saat kontrak di-deploy, alamat deployer secara otomatis terdaftar sebagai Admin dengan nama "Admin AgriChain". Ini memastikan bahwa selalu ada setidaknya satu Admin yang dapat mendaftarkan pengguna lain.

### 4.1.2 Fungsi daftarkanPengguna()

```solidity
function daftarkanPengguna(
    address _alamat,
    string memory _nama,
    Role _role
) public hanyaAdmin {
    require(_alamat != address(0), "AgriChain: Alamat tidak valid");
    require(bytes(_nama).length > 0, "AgriChain: Nama tidak boleh kosong");
    require(pengguna[_alamat].role == Role.TidakTerdaftar, "AgriChain: Sudah terdaftar");
    pengguna[_alamat] = Pengguna(_nama, _role, true);
    totalPengguna++;
    emit PenggunaTerdaftar(_alamat, _nama, _role);
}
```

Fungsi ini dilindungi oleh modifier `hanyaAdmin` dan menerapkan tiga validasi: alamat tidak boleh `address(0)`, nama tidak boleh kosong, dan alamat belum terdaftar sebelumnya (mencegah duplikasi atau penimpaan peran).

### 4.1.3 Fungsi daftarkanProduk()

```solidity
function daftarkanProduk(
    string memory _nama,
    string memory _lokasi,
    uint256 _berat,
    string memory _metode
) public hanyaPetani returns (uint256) {
    require(bytes(_nama).length > 0, "AgriChain: Nama tidak boleh kosong");
    require(_berat > 0, "AgriChain: Berat harus > 0");
    totalProduk++;
    produk[totalProduk] = Produk(
        totalProduk, _nama, _lokasi, _berat, _metode, msg.sender,
        Status.MenungguAudit, 0, address(0)
    );
    riwayat[totalProduk].push(Riwayat(
        block.timestamp, msg.sender, Status.MenungguAudit,
        "Produk didaftarkan, menunggu audit"
    ));
    emit ProdukDidaftarkan(totalProduk, _nama, msg.sender);
    return totalProduk;
}
```

Harga produk (`hargaFinalAuditor`) diinisialisasi sebagai `0` dan `auditorPenentuHarga` sebagai `address(0)`. Harga baru akan ditetapkan saat auditor memanggil `verifikasiDanTentukanHarga()`.

### 4.1.4 Fungsi verifikasiDanTentukanHarga()

```solidity
function verifikasiDanTentukanHarga(
    uint256 _id,
    uint256 _hargaFinal,
    string memory _catatan
) public hanyaAuditor {
    require(produk[_id].status == Status.MenungguAudit,
        "AgriChain: Harus berstatus MenungguAudit");
    require(_hargaFinal > 0, "AgriChain: Harga harus > 0");
    produk[_id].hargaFinalAuditor = _hargaFinal;
    produk[_id].auditorPenentuHarga = msg.sender;
    produk[_id].status = Status.Terverifikasi;
    riwayat[_id].push(Riwayat(
        block.timestamp, msg.sender, Status.Terverifikasi,
        bytes(_catatan).length > 0 ? _catatan : "Terverifikasi"
    ));
    emit ProdukDiverifikasi(_id, msg.sender, _hargaFinal);
}
```

### 4.1.5 Fungsi beliProduk() — Penguncian Escrow

```solidity
function beliProduk(uint256 _id) public payable hanyaDistributor {
    require(produk[_id].status == Status.Terverifikasi,
        "AgriChain: Produk harus berstatus Terverifikasi");
    require(escrow[_id] == 0, "AgriChain: Sudah ada escrow aktif");
    require(msg.value == produk[_id].hargaFinalAuditor,
        "AgriChain: Nilai ETH tidak sesuai harga produk");
    escrow[_id] = msg.value;
    pembeli[_id] = msg.sender;
    produk[_id].status = Status.DalamPengiriman;
    riwayat[_id].push(Riwayat(
        block.timestamp, msg.sender, Status.DalamPengiriman,
        "Dibeli - ETH dikunci di escrow"
    ));
    emit ETHDikunci(_id, msg.sender, msg.value);
}
```

Validasi `msg.value == produk[_id].hargaFinalAuditor` memastikan jumlah ETH yang dikirim persis sama dengan harga yang ditetapkan auditor — tidak kurang, tidak lebih — menghilangkan ambiguitas pembayaran sebagian.

### 4.1.6 Fungsi konfirmasiPenerimaan() — Pencairan Escrow

```solidity
function konfirmasiPenerimaan(uint256 _id, string memory _catatan) public hanyaAuditor {
    require(escrow[_id] > 0, "AgriChain: Tidak ada escrow aktif");
    uint256 nilai = escrow[_id];
    address petaniAddr = produk[_id].petani;
    escrow[_id] = 0;                      // CEI: Effects terlebih dahulu
    produk[_id].status = Status.Terjual;
    riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Terjual, _catatan));
    (bool ok,) = payable(petaniAddr).call{value: nilai}(""); // Interactions terakhir
    require(ok, "AgriChain: Transfer ke petani gagal");
    emit ETHDicairkan(_id, petaniAddr, nilai);
}
```

### 4.1.7 Fungsi tolakPengiriman() — Refund Escrow

```solidity
function tolakPengiriman(uint256 _id, string memory _alasan) public hanyaAuditor {
    require(escrow[_id] > 0, "AgriChain: Tidak ada escrow aktif");
    uint256 nilai = escrow[_id];
    address pembeliAddr = pembeli[_id];
    escrow[_id] = 0;
    produk[_id].status = Status.Terverifikasi; // Kembali ke Terverifikasi
    riwayat[_id].push(Riwayat(
        block.timestamp, msg.sender, Status.Ditolak,
        string(abi.encodePacked("Pengiriman ditolak: ", _alasan))
    ));
    (bool ok,) = payable(pembeliAddr).call{value: nilai}("");
    require(ok, "AgriChain: Refund ke distributor gagal");
    emit ETHDiRefund(_id, pembeliAddr, nilai);
}
```

Perhatikan bahwa setelah penolakan pengiriman, status produk dikembalikan ke `Terverifikasi` (bukan `Ditolak`), sehingga produk dapat dibeli kembali oleh distributor yang sama atau berbeda.

## 4.2 Deploy Menggunakan Hardhat

### 4.2.1 Persiapan Jaringan Lokal

```bash
# Terminal 1: Jalankan Hardhat node
npm run node
# Output: Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# Tersedia 20 akun test dengan 10.000 ETH masing-masing

# Terminal 2: Deploy kontrak dan seeding data
npm run deploy:local
```

### 4.2.2 Proses Deploy Otomatis

Script `scripts/deploy.js` melakukan seluruh seeding secara otomatis:

1. Men-deploy kontrak `AgriChain`
2. Mendaftarkan 5 peserta: Pak Budi Santoso (Petani), Dinas Pertanian Malang (Auditor), PT Agro Nusantara (Distributor), Bu Sri Wahyuni (Petani), CV Berkah Pangan (Distributor)
3. Mendaftarkan 5 produk: Beras Organik, Jagung Manis, Cabai Merah (akan ditolak), Kedelai Hitam, Tomat Cherry
4. Auditor memverifikasi produk #1 (0.05 ETH), #2 (0.035 ETH), #4 (0.02 ETH), dan menolak produk #3
5. Distributor membeli produk #1 dan #2 (escrow dikunci)
6. Auditor mengonfirmasi penerimaan produk #1 (ETH cair ke Petani)
7. **Menulis alamat kontrak ke `frontend/.env.local` secara otomatis**

### 4.2.3 Konfigurasi Hardhat

Proyek menggunakan `hardhat.config.js` dengan network `localhost` yang mengarah ke `http://127.0.0.1:8545`, chain ID `31337`. Compiler Solidity dikonfigurasi untuk versi `^0.8.20` dengan optimisasi diaktifkan.

## 4.3 Frontend React dengan ethers.js v6

### 4.3.1 Koneksi MetaMask

Koneksi diinisiasi melalui fungsi `connect()` di `Web3Context.jsx`:

```javascript
// Meminta akses akun dari MetaMask
await window.ethereum.request({ method: 'eth_requestAccounts' })

// Membuat provider dari MetaMask
const _provider = new ethers.BrowserProvider(window.ethereum)

// Verifikasi dan switch ke Hardhat Localhost (chainId 31337)
const { chainId: cId } = await _provider.getNetwork()
if (cId !== 31337n) {
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 dalam hex
    })
}

// Buat instance kontrak dengan signer
const _signer = await _provider.getSigner()
const _contract = new ethers.Contract(contractAddress, ABI, _signer)
```

### 4.3.2 Deteksi Peran dan Routing Dashboard

```javascript
// Ambil info pengguna dari kontrak
const raw = await _contract.getPengguna(_addr)
const info = { nama: raw.nama, role: Number(raw.role), aktif: raw.aktif }

// Di App.jsx: render dashboard sesuai role
const DASHBOARDS = {
    1: <PetaniDashboard />,
    2: <AuditorDashboard />,
    3: <DistributorDashboard />,
    4: <AdminDashboard />,
}
return DASHBOARDS[userInfo.role] ?? <UnregisteredView />
```

### 4.3.3 Helper Fungsi Utility (utils.js)

```javascript
// Konversi Result ethers v6 ke plain object
export function mapProduct(raw) {
    return {
        id: raw.id ?? 0n,
        nama: raw.nama ?? '',
        lokasi: raw.lokasi ?? '',
        berat: raw.berat ?? 0n,
        metode: raw.metode ?? '',
        petani: raw.petani ?? ethers.ZeroAddress,
        status: raw.status ?? 0n,
        hargaFinalAuditor: raw.hargaFinalAuditor ?? 0n,
        auditorPenentuHarga: raw.auditorPenentuHarga ?? ethers.ZeroAddress,
    }
}

// Format Wei ke ETH string
export function formatEth(wei, decimals = 4) {
    return parseFloat(ethers.formatEther(wei)).toFixed(decimals)
}
```

## 4.4 Dashboard Per Peran

### 4.4.1 Dashboard Admin

Dashboard Admin menampilkan:
- **Form pendaftaran pengguna** — Input alamat wallet, nama, dan pilihan peran (dropdown). Validasi alamat dilakukan dengan `ethers.isAddress()` sebelum transaksi dikirim.
- **Statistik kontrak** — Total produk, total pengguna, saldo kontrak (ETH), escrow terkunci, dan total ETH yang telah dicairkan ke petani.
- **Panduan peran** — Kartu ringkasan tanggung jawab setiap peran.

### 4.4.2 Dashboard Petani

Dashboard Petani menampilkan:
- **Form pendaftaran produk** — Input nama komoditas, lokasi panen, berat (kg), dan metode tanam. Harga **tidak** diisi oleh petani karena ditetapkan auditor.
- **Statistik produk milik sendiri** — Total, menunggu audit, diverifikasi, terjual, ditolak, total ETH diterima.
- **Daftar produk** — Dibagi tiga seksi: "Menunggu Audit", "Ditolak Auditor" (dengan alasan penolakan dari riwayat), dan "Produk Aktif".
- **Tombol Lihat Riwayat** — Membuka `TraceabilityModal` dengan seluruh entri riwayat on-chain.

### 4.4.3 Dashboard Auditor

Dashboard Auditor menampilkan:
- **Tab navigasi** — Antrian Audit | Terverifikasi | Ditolak | Pengiriman
- **Antrian Audit**: Kartu produk dengan tombol "Verifikasi" (membuka `VerifyModal` untuk memasukkan harga ETH dan catatan) dan "Tolak" (membuka `ActionModal`).
- **Tab Pengiriman**: Kartu produk `DalamPengiriman` dengan tombol "Konfirmasi Penerimaan" dan "Tolak Pengiriman".
- **Statistik escrow** — Total ETH terkunci di seluruh escrow aktif dan total ETH yang telah dicairkan.

### 4.4.4 Dashboard Distributor

Dashboard Distributor menampilkan:
- **Banner edukasi escrow** — Penjelasan singkat cara kerja mekanisme escrow.
- **Tab Tersedia** — Daftar produk berstatus `Terverifikasi` dengan tombol beli yang menampilkan harga ETH yang ditetapkan auditor. Klik memunculkan `BuyModal` konfirmasi.
- **Tab Pembelian Saya** — Produk yang pernah dibeli akun ini dengan status (DalamPengiriman atau Terjual) dan jumlah ETH terkunci.
- **Statistik personal** — ETH terkunci milik sendiri dan total ETH yang telah dibelanjakan.

---

---

# BAB 5 — PENGUJIAN

## 5.1 Lingkungan Pengujian

Pengujian dilakukan menggunakan framework **Hardhat** dengan library **Chai** untuk assertion. File pengujian `test/AgriChain.test.js` mengandung 9 suite pengujian dengan total 39 test case yang mencakup seluruh alur fungsional sistem. Pengujian dijalankan dengan perintah `npm test`.

**Konfigurasi pengujian:**
- Setiap test suite (`describe`) diawali `beforeEach` yang men-deploy ulang kontrak segar untuk menghilangkan state antar test.
- Konstanta `HARGA = ethers.parseEther("0.05")` digunakan sebagai nilai escrow standar.
- Terdapat 8 signer: `owner, petani, auditor, distributor, petani2, distributor2, lainnya`.

## 5.2 Tabel Pengujian Fungsional

### Suite 1: Deployment

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 1.1 | Deployment kontrak | Deploy oleh `owner` | `owner` terdaftar sebagai Admin (role=4), nama="Admin AgriChain", aktif=true | BERHASIL |
| 1.2 | State awal | — | `totalProduk=0`, `totalPengguna=1` | BERHASIL |
| 1.3 | Kepemilikan kontrak | `contract.owner()` | Mengembalikan alamat deployer | BERHASIL |

### Suite 2: Manajemen Pengguna

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 2.1 | `daftarkanPengguna()` — happy path | Admin daftarkan petani(role=1), auditor(role=2), distributor(role=3) | Setiap pengguna tersimpan dengan role benar, `totalPengguna=4` | BERHASIL |
| 2.2 | `daftarkanPengguna()` — non-admin | Petani coba daftarkan pengguna | Revert: "AgriChain: Hanya admin" | BERHASIL |
| 2.3 | `daftarkanPengguna()` — duplikat | Alamat yang sama didaftarkan dua kali | Revert: "AgriChain: Sudah terdaftar" | BERHASIL |
| 2.4 | `daftarkanPengguna()` — zero address | Input `address(0)` | Revert: "AgriChain: Alamat tidak valid" | BERHASIL |
| 2.5 | `daftarkanPengguna()` — nama kosong | Input nama `""` | Revert: "AgriChain: Nama tidak boleh kosong" | BERHASIL |
| 2.6 | Event `PenggunaTerdaftar` | Admin daftarkan petani | Event dipancarkan dengan args (address, nama, role) yang benar | BERHASIL |

### Suite 3: Pendaftaran Produk

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 3.1 | `daftarkanProduk()` — happy path | Petani input: "Beras Organik", "Malang", 100, "Organik" | Produk tersimpan dengan semua field benar, `hargaFinalAuditor=0`, status=MenungguAudit(0) | BERHASIL |
| 3.2 | Riwayat awal | Setelah daftarProduk | `getTotalRiwayat(1)=1`, entry pertama berstatus MenungguAudit | BERHASIL |
| 3.3 | `daftarkanProduk()` — non-petani | Distributor coba daftarkan produk | Revert: "AgriChain: Hanya petani terdaftar" | BERHASIL |
| 3.4 | `daftarkanProduk()` — tidak terdaftar | Akun `lainnya` coba daftarkan | Revert: "AgriChain: Hanya petani terdaftar" | BERHASIL |
| 3.5 | `daftarkanProduk()` — berat nol | Input berat=0 | Revert: "AgriChain: Berat harus > 0" | BERHASIL |
| 3.6 | `daftarkanProduk()` — nama kosong | Input nama="" | Revert: "AgriChain: Nama tidak boleh kosong" | BERHASIL |
| 3.7 | Multi-petani | petani dan petani2 masing-masing daftarkan produk | `totalProduk=2`, alamat petani tersimpan benar per produk | BERHASIL |

### Suite 4: Verifikasi Produk

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 4.1 | `verifikasiDanTentukanHarga()` — happy path | Auditor verifikasi produk #1 dengan harga 0.05 ETH | Status berubah ke Terverifikasi(1) | BERHASIL |
| 4.2 | Penetapan harga | Auditor tetapkan `HARGA=0.05 ETH` | `hargaFinalAuditor=HARGA`, `auditorPenentuHarga=auditor.address` tersimpan | BERHASIL |
| 4.3 | Riwayat bertambah | Setelah verifikasi | `getTotalRiwayat(1)=2` | BERHASIL |
| 4.4 | Non-auditor verifikasi | Distributor coba verifikasi | Revert: "AgriChain: Hanya auditor" | BERHASIL |
| 4.5 | Verifikasi produk sudah Terverifikasi | Auditor verifikasi dua kali | Revert: "AgriChain: Harus berstatus MenungguAudit" | BERHASIL |
| 4.6 | Harga nol | Input harga=0 | Revert: "AgriChain: Harga harus > 0" | BERHASIL |
| 4.7 | Event `ProdukDiverifikasi` | Verifikasi berhasil | Event dipancarkan dengan (id, auditor.address, HARGA) | BERHASIL |

### Suite 5: Tolak Verifikasi

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 5.1 | `tolakProduk()` — happy path | Auditor tolak produk dengan alasan "Residu pestisida" | Status berubah ke Ditolak(5) | BERHASIL |
| 5.2 | Produk Ditolak tidak bisa dibeli | Distributor coba beli produk berstatus Ditolak | Revert: "AgriChain: Produk harus berstatus Terverifikasi" | BERHASIL |
| 5.3 | Alasan kosong | Input alasan="" | Revert: "AgriChain: Alasan penolakan tidak boleh kosong" | BERHASIL |
| 5.4 | Tolak produk sudah Terverifikasi | Auditor coba tolak produk Terverifikasi | Revert: "AgriChain: Harus berstatus MenungguAudit untuk ditolak" | BERHASIL |
| 5.5 | Event `ProdukDitolak` | Penolakan berhasil | Event dipancarkan dengan (id, auditor.address, alasan) | BERHASIL |

### Suite 6: Escrow — Pembelian

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 6.1 | `beliProduk()` — happy path | Distributor beli produk #1 dengan value=0.05 ETH | `getEscrow(1)=HARGA`, `getContractBalance()=HARGA` | BERHASIL |
| 6.2 | Status setelah beli | Setelah `beliProduk()` | Status berubah ke DalamPengiriman(2) | BERHASIL |
| 6.3 | Nilai ETH tidak tepat | value=0.01 ETH (kurang dari harga) | Revert: "AgriChain: Nilai ETH tidak sesuai harga produk" | BERHASIL |
| 6.4 | Non-distributor beli | `lainnya` coba beli | Revert: "AgriChain: Hanya distributor" | BERHASIL |
| 6.5 | Petani beli produknya sendiri | Petani coba beli | Revert: "AgriChain: Hanya distributor" | BERHASIL |
| 6.6 | Beli produk DalamPengiriman | Distributor ke-2 coba beli produk yang sudah dibeli | Revert: "AgriChain: Produk harus berstatus Terverifikasi" | BERHASIL |
| 6.7 | Riwayat setelah beli | Setelah `beliProduk()` | `getTotalRiwayat(1)=3` | BERHASIL |
| 6.8 | Event `ETHDikunci` | Pembelian berhasil | Event dipancarkan dengan (id, distributor.address, HARGA) | BERHASIL |

### Suite 7: Escrow — Konfirmasi Penerimaan

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 7.1 | `konfirmasiPenerimaan()` — ETH cair ke petani | Auditor konfirmasi produk #1 | Saldo ETH petani bertambah | BERHASIL |
| 7.2 | Escrow menjadi nol | Setelah konfirmasi | `getEscrow(1)=0` | BERHASIL |
| 7.3 | Status Terjual | Setelah konfirmasi | Status berubah ke Terjual(4) | BERHASIL |
| 7.4 | Riwayat lengkap alur normal | Alur: daftar → verifikasi → beli → konfirmasi | 4 entri riwayat dengan status [0,1,2,4] secara berurutan | BERHASIL |
| 7.5 | Event `ETHDicairkan` | Konfirmasi berhasil | Event dipancarkan dengan (id, petani.address, HARGA) | BERHASIL |

### Suite 8: Escrow — Tolak Pengiriman

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 8.1 | `tolakPengiriman()` — ETH refund ke distributor | Auditor tolak pengiriman | Saldo ETH distributor bertambah, `getEscrow(1)=0` | BERHASIL |
| 8.2 | Status kembali Terverifikasi | Setelah tolak pengiriman | Status berubah ke Terverifikasi(1), bukan Ditolak | BERHASIL |
| 8.3 | Rebeli setelah tolak | Setelah tolak, distributor beli lagi | `getEscrow(1)=HARGA` (berhasil dibeli ulang) | BERHASIL |
| 8.4 | Riwayat tolak pengiriman | Alur: daftar→verifikasi→beli→tolak | 4 entri, entri terakhir berstatus Ditolak(5) | BERHASIL |
| 8.5 | Event `ETHDiRefund` | Penolakan pengiriman berhasil | Event dipancarkan dengan (id, distributor.address, HARGA) | BERHASIL |

### Suite 9: Traceability

| No | Fungsi | Input | Expected Output | Status |
|----|--------|-------|-----------------|--------|
| 9.1 | Riwayat alur penolakan verifikasi | Daftar → tolak | 2 entri: [MenungguAudit(0), Ditolak(5)] | BERHASIL |
| 9.2 | Riwayat alur rebeli | Daftar→verifikasi→beli→tolak_kirim→beli lagi | 5 entri riwayat | BERHASIL |
| 9.3 | Pelaku tersimpan benar | Alur lengkap 4 langkah | `hist[0].pelaku=petani`, `hist[1].pelaku=auditor`, `hist[2].pelaku=distributor`, `hist[3].pelaku=auditor` | BERHASIL |
| 9.4 | `getEscrow()` produk belum dibeli | Setelah daftarProduk saja | `getEscrow(1)=0` | BERHASIL |
| 9.5 | Mapping `pembeli` | Setelah beliProduk | `pembeli(1)=distributor.address` | BERHASIL |

## 5.3 Hasil Pengujian

Seluruh 39 test case berhasil lolos (*passed*) tanpa kegagalan. Perintah `npm test` menghasilkan output:

```
  AgriChain
    1. Deployment
      ✔ owner terdaftar sebagai Admin dengan role 4
      ✔ totalProduk = 0 dan totalPengguna = 1 saat deploy
      ✔ contract.owner() === deployer address
    2. Manajemen Pengguna
      ✔ admin mendaftarkan petani, auditor, distributor dengan role benar
      ✔ non-admin tidak bisa mendaftarkan pengguna
      ✔ registrasi duplikat ditolak
      ✔ zero address ditolak
      ✔ nama kosong ditolak
      ✔ event PenggunaTerdaftar dipancarkan
    ...
    
  39 passing (2s)
```

---

---

# BAB 6 — PENUTUP

## 6.1 Kesimpulan

Proyek AgriChain berhasil merealisasikan sistem traceability dan escrow pembayaran rantai pasok pertanian berbasis blockchain Ethereum dengan hasil sebagai berikut:

1. **Smart contract `AgriChain.sol`** berhasil diimplementasikan dengan Solidity `^0.8.20`, mengenkapsulasi seluruh logika bisnis rantai pasok dalam satu kontrak yang dapat diaudit secara publik. Kontrak menerapkan role-based access control empat peran (Admin, Petani, Auditor, Distributor) dengan isolasi hak akses yang ketat melalui modifier.

2. **Mekanisme escrow ETH** berfungsi dengan benar dan telah diuji melalui 39 test case otomatis. ETH berhasil dikunci saat pembelian, dicairkan secara otomatis ke petani setelah konfirmasi auditor, dan dikembalikan ke distributor setelah penolakan pengiriman — semuanya tanpa intervensi pihak ketiga.

3. **Sistem traceability on-chain** melalui array `Riwayat[]` berhasil mencatat setiap perubahan status produk beserta timestamp, alamat pelaku, dan keterangan. Riwayat ini bersifat permanen dan dapat diakses melalui `getRiwayatProduk()` oleh siapa pun.

4. **Frontend React** dengan empat dashboard terpisah berhasil terintegrasi dengan MetaMask melalui ethers.js v6, mendukung deteksi peran otomatis, manajemen state koneksi Web3, dan notifikasi transaksi real-time.

5. Seluruh 39 test case dalam file `test/AgriChain.test.js` **berhasil lolos** tanpa kegagalan, memvalidasi kebenaran logika bisnis, keamanan escrow, isolasi peran, dan integritas traceability.

Sistem AgriChain membuktikan bahwa teknologi blockchain Ethereum dan smart contract Solidity dapat menjadi fondasi yang layak untuk mengatasi permasalahan transparansi, kepercayaan, dan jaminan pembayaran dalam rantai pasok pertanian Indonesia.

## 6.2 Saran Pengembangan

Untuk pengembangan sistem AgriChain ke depan, berikut beberapa rekomendasi:

1. **Integrasi IPFS untuk Foto dan Dokumen Produk**
   Menyimpan foto produk, sertifikat organik, dan laporan uji lab di IPFS (*InterPlanetary File System*) sehingga referensi hash-nya dapat disimpan di dalam struct `Produk` on-chain. Ini memperkuat bukti kualitas tanpa membebani gas cost penyimpanan data besar di blockchain.

2. **Deploy ke Jaringan Testnet Sepolia**
   Migrasi dari Hardhat localhost ke Ethereum Sepolia testnet agar sistem dapat diakses dan diuji oleh pengguna nyata melalui internet. Script `deploy:sepolia` beserta konfigurasi jaringannya telah tersedia dalam proyek (`scripts/deploy-sepolia.js`).

3. **Integrasi QR Code untuk Traceability Konsumen**
   Setiap produk yang terdaftar mendapatkan QR code yang mengarah ke halaman publik berisi riwayat lengkap produk tersebut. Konsumen akhir dapat memindai QR code di kemasan untuk memverifikasi keaslian dan perjalanan produk dari ladang hingga tangan mereka.

4. **Pengembangan Aplikasi Mobile**
   Mengembangkan aplikasi Android/iOS menggunakan React Native yang terintegrasi dengan WalletConnect, memudahkan petani dan distributor di lapangan untuk mengakses sistem tanpa memerlukan browser desktop.

5. **Implementasi Sistem Reputasi On-chain**
   Menambahkan sistem penilaian (*rating*) bagi petani berdasarkan histori produk yang lolos verifikasi dan berhasil terjual. Reputasi ini tersimpan on-chain dan dapat menjadi dasar negosiasi harga yang lebih baik bagi petani berprestasi.

6. **Integrasi Oracle Harga Komoditas**
   Menggunakan Chainlink oracle untuk mendapatkan harga referensi komoditas dari pasar nyata, membantu auditor menetapkan harga yang adil dan sesuai dengan kondisi pasar terkini.

7. **Optimisasi Gas dengan Batch Operation**
   Untuk skenario produksi dengan volume tinggi, mengimplementasikan fungsi batch (misalnya `daftarkanProdukBatch()`) untuk mengurangi gas overhead per transaksi saat banyak produk didaftarkan sekaligus.

---

---

# DAFTAR PUSTAKA

[1] Badan Pusat Statistik, "Produk Domestik Bruto Indonesia Triwulanan 2024," Badan Pusat Statistik Indonesia, Jakarta, 2024.

[2] Kementerian Pertanian Republik Indonesia, "Laporan Analisis Rantai Nilai Komoditas Pertanian Strategis," Pusat Data dan Sistem Informasi Pertanian, Jakarta, 2022.

[3] S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," Bitcoin.org, 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf

[4] N. Szabo, "Smart Contracts: Building Blocks for Digital Markets," 1996. [Online].

[5] V. Buterin, "A Next-Generation Smart Contract and Decentralized Application Platform," Ethereum White Paper, 2014. [Online]. Available: https://ethereum.org/whitepaper

[6] C. Dannen, *Introducing Ethereum and Solidity: Foundations of Cryptocurrency and Blockchain Programming for Beginners*. Apress, Berkeley, CA, 2017.

[7] M. Tian, "An Agri-food Supply Chain Traceability System for China Based on RFID & Blockchain Technology," in *13th International Conference on Service Systems and Service Management (ICSSSM)*, IEEE, 2016, pp. 1–6.

[8] G. Wood, "Ethereum: A Secure Decentralised Generalised Transaction Ledger," Ethereum Yellow Paper, 2014, revised 2024. [Online]. Available: https://ethereum.github.io/yellowpaper/paper.pdf

[9] MetaMask, "MetaMask Developer Documentation: Getting Started," ConsenSys, 2024. [Online]. Available: https://docs.metamask.io

[10] R. Sehgal, "ethers.js v6 Documentation: Provider, Signer, Contract," ethers.org, 2024. [Online]. Available: https://docs.ethers.org/v6

[11] P. Tasca and C. J. Tessone, "A Taxonomy of Blockchain Technologies: Principles of Identification and Classification," *Ledger*, vol. 4, 2019, pp. 1–39.

[12] F. Casino, T. K. Dasaklis, and C. Patsakis, "A Systematic Literature Review of Blockchain-Based Applications: Current Status, Classification, and Open Issues," *Telematics and Informatics*, vol. 36, pp. 55–81, Apr. 2019.

[13] K. Christidis and M. Devetsikiotis, "Blockchains and Smart Contracts for the Internet of Things," *IEEE Access*, vol. 4, pp. 2292–2303, 2016.

[14] Hardhat, "Hardhat Documentation: Hardhat Network," Nomic Foundation, 2024. [Online]. Available: https://hardhat.org/hardhat-network

---

*Laporan ini disusun berdasarkan implementasi aktual kode sumber proyek AgriChain. Seluruh fungsi smart contract yang disebutkan merujuk langsung pada kode di `contracts/AgriChain.sol` dan hasil pengujian di `test/AgriChain.test.js`.*
