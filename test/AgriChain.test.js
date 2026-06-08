const { expect } = require("chai");
const { ethers } = require("hardhat");

// Tests written against updated AgriChain.sol where:
//   - petani registers product WITHOUT price (4 params)
//   - verifikasiDanTentukanHarga(id, hargaFinal, catatan) — auditor verifies AND sets price
//   - tolakProduk / tolakPengiriman / konfirmasiPenerimaan unchanged

describe("AgriChain", function () {
  let contract, owner, petani, auditor, distributor, petani2, distributor2, lainnya;
  const HARGA = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, petani, auditor, distributor, petani2, distributor2, lainnya] =
      await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgriChain");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  async function setupPengguna() {
    await contract.daftarkanPengguna(petani.address,      "Pak Budi",        1);
    await contract.daftarkanPengguna(auditor.address,     "Dinas Pertanian", 2);
    await contract.daftarkanPengguna(distributor.address, "PT Agro",         3);
  }

  async function daftarProduk(opts = {}) {
    const {
      signer = petani,
      nama   = "Beras Organik",
      lokasi = "Malang",
      berat  = 100,
      metode = "Organik",
    } = opts;
    return contract.connect(signer).daftarkanProduk(nama, lokasi, berat, metode);
  }

  async function verifikasi(id = 1n, harga = HARGA, catatan = "Lulus uji") {
    return contract.connect(auditor).verifikasiDanTentukanHarga(id, harga, catatan);
  }

  // ─── 1. Deployment ──────────────────────────────────────
  describe("1. Deployment", function () {
    it("owner terdaftar sebagai Admin dengan role 4", async function () {
      const u = await contract.getPengguna(owner.address);
      expect(u.role).to.equal(4n);
      expect(u.aktif).to.equal(true);
      expect(u.nama).to.equal("Admin AgriChain");
    });

    it("totalProduk = 0 dan totalPengguna = 1 saat deploy", async function () {
      expect(await contract.totalProduk()).to.equal(0n);
      expect(await contract.totalPengguna()).to.equal(1n);
    });

    it("contract.owner() === deployer address", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  // ─── 2. Manajemen Pengguna ──────────────────────────────
  describe("2. Manajemen Pengguna", function () {
    it("admin mendaftarkan petani, auditor, distributor dengan role benar", async function () {
      await setupPengguna();
      expect((await contract.getPengguna(petani.address)).role).to.equal(1n);
      expect((await contract.getPengguna(auditor.address)).role).to.equal(2n);
      expect((await contract.getPengguna(distributor.address)).role).to.equal(3n);
      expect(await contract.totalPengguna()).to.equal(4n);
    });

    it("non-admin tidak bisa mendaftarkan pengguna", async function () {
      await expect(
        contract.connect(petani).daftarkanPengguna(lainnya.address, "Test", 1)
      ).to.be.revertedWith("AgriChain: Hanya admin");
    });

    it("registrasi duplikat ditolak", async function () {
      await contract.daftarkanPengguna(petani.address, "Pak Budi", 1);
      await expect(
        contract.daftarkanPengguna(petani.address, "Duplikat", 1)
      ).to.be.revertedWith("AgriChain: Sudah terdaftar");
    });

    it("zero address ditolak", async function () {
      await expect(
        contract.daftarkanPengguna(ethers.ZeroAddress, "Zero", 1)
      ).to.be.revertedWith("AgriChain: Alamat tidak valid");
    });

    it("nama kosong ditolak", async function () {
      await expect(
        contract.daftarkanPengguna(petani.address, "", 1)
      ).to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });

    it("event PenggunaTerdaftar dipancarkan", async function () {
      await expect(contract.daftarkanPengguna(petani.address, "Pak Budi", 1))
        .to.emit(contract, "PenggunaTerdaftar")
        .withArgs(petani.address, "Pak Budi", 1n);
    });
  });

  // ─── 3. Pendaftaran Produk ──────────────────────────────
  describe("3. Pendaftaran Produk", function () {
    beforeEach(setupPengguna);

    it("petani mendaftarkan produk — semua field tersimpan benar, harga belum ditetapkan", async function () {
      await daftarProduk();
      expect(await contract.totalProduk()).to.equal(1n);
      const p = await contract.getProduk(1n);
      expect(p.nama).to.equal("Beras Organik");
      expect(p.lokasi).to.equal("Malang");
      expect(p.berat).to.equal(100n);
      expect(p.metode).to.equal("Organik");
      expect(p.hargaFinalAuditor).to.equal(0n);
      expect(p.auditorPenentuHarga).to.equal(ethers.ZeroAddress);
      expect(p.status).to.equal(0n);
      expect(p.petani).to.equal(petani.address);
    });

    it("riwayat awal berisi 1 entri berstatus MenungguAudit", async function () {
      await daftarProduk();
      expect(await contract.getTotalRiwayat(1n)).to.equal(1n);
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist[0].status).to.equal(0n);
    });

    it("non-petani tidak bisa mendaftarkan produk", async function () {
      await expect(
        contract.connect(distributor).daftarkanProduk("X", "X", 1, "X")
      ).to.be.revertedWith("AgriChain: Hanya petani terdaftar");
    });

    it("pengguna tidak terdaftar tidak bisa mendaftarkan produk", async function () {
      await expect(
        contract.connect(lainnya).daftarkanProduk("X", "X", 1, "X")
      ).to.be.revertedWith("AgriChain: Hanya petani terdaftar");
    });

    it("berat 0 ditolak", async function () {
      await expect(
        contract.connect(petani).daftarkanProduk("X", "X", 0, "X")
      ).to.be.revertedWith("AgriChain: Berat harus > 0");
    });

    it("nama kosong ditolak", async function () {
      await expect(
        contract.connect(petani).daftarkanProduk("", "Malang", 100, "Organik")
      ).to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });

    it("event ProdukDidaftarkan dipancarkan", async function () {
      await expect(daftarProduk())
        .to.emit(contract, "ProdukDidaftarkan")
        .withArgs(1n, "Beras Organik", petani.address);
    });

    it("beberapa petani bisa mendaftarkan produk secara independen", async function () {
      await contract.daftarkanPengguna(petani2.address, "Bu Sri", 1);
      await daftarProduk();
      await contract.connect(petani2).daftarkanProduk("Jagung", "Batu", 200, "Organik");
      expect(await contract.totalProduk()).to.equal(2n);
      expect((await contract.getProduk(2n)).petani).to.equal(petani2.address);
    });
  });

  // ─── 4. Verifikasi + Penetapan Harga (Auditor) ─────────
  describe("4. Verifikasi Produk", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
    });

    it("auditor memverifikasi produk — status berubah ke Terverifikasi", async function () {
      await verifikasi();
      expect((await contract.getProduk(1n)).status).to.equal(1n);
    });

    it("auditor menetapkan hargaFinalAuditor dan auditorPenentuHarga saat verifikasi", async function () {
      await verifikasi();
      const p = await contract.getProduk(1n);
      expect(p.hargaFinalAuditor).to.equal(HARGA);
      expect(p.auditorPenentuHarga).to.equal(auditor.address);
    });

    it("riwayat bertambah menjadi 2 entri setelah verifikasi", async function () {
      await verifikasi();
      expect(await contract.getTotalRiwayat(1n)).to.equal(2n);
    });

    it("non-auditor tidak bisa memverifikasi", async function () {
      await expect(
        contract.connect(distributor).verifikasiDanTentukanHarga(1n, HARGA, "Test")
      ).to.be.revertedWith("AgriChain: Hanya auditor");
    });

    it("tidak bisa memverifikasi produk yang sudah Terverifikasi", async function () {
      await verifikasi();
      await expect(verifikasi()).to.be.revertedWith(
        "AgriChain: Harus berstatus MenungguAudit"
      );
    });

    it("harga 0 ditolak saat verifikasi", async function () {
      await expect(
        contract.connect(auditor).verifikasiDanTentukanHarga(1n, 0n, "Test")
      ).to.be.revertedWith("AgriChain: Harga harus > 0");
    });

    it("event ProdukDiverifikasi dipancarkan dengan harga auditor", async function () {
      await expect(verifikasi())
        .to.emit(contract, "ProdukDiverifikasi")
        .withArgs(1n, auditor.address, HARGA);
    });
  });

  // ─── 5. Tolak Verifikasi ─────────────────────────────────
  describe("5. Tolak Verifikasi", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
    });

    it("auditor menolak produk — status berubah ke Ditolak", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Residu pestisida");
      expect((await contract.getProduk(1n)).status).to.equal(5n);
    });

    it("produk Ditolak tidak bisa dibeli distributor", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      await expect(
        contract.connect(distributor).beliProduk(1n, { value: HARGA })
      ).to.be.revertedWith("AgriChain: Produk harus berstatus Terverifikasi");
    });

    it("alasan kosong ditolak", async function () {
      await expect(
        contract.connect(auditor).tolakProduk(1n, "")
      ).to.be.revertedWith("AgriChain: Alasan penolakan tidak boleh kosong");
    });

    it("tidak bisa menolak produk yang sudah Terverifikasi", async function () {
      await verifikasi();
      await expect(
        contract.connect(auditor).tolakProduk(1n, "Terlambat")
      ).to.be.revertedWith("AgriChain: Harus berstatus MenungguAudit untuk ditolak");
    });

    it("event ProdukDitolak dipancarkan", async function () {
      await expect(contract.connect(auditor).tolakProduk(1n, "Tidak lolos"))
        .to.emit(contract, "ProdukDitolak")
        .withArgs(1n, auditor.address, "Tidak lolos");
    });

    it("riwayat bertambah menjadi 2 setelah penolakan", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      expect(await contract.getTotalRiwayat(1n)).to.equal(2n);
    });
  });

  // ─── 6. Escrow — Pembelian ──────────────────────────────
  describe("6. Escrow — Pembelian", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasi();
    });

    it("distributor membeli produk dan ETH terkunci di escrow", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getEscrow(1n)).to.equal(HARGA);
      expect(await contract.getContractBalance()).to.equal(HARGA);
    });

    it("status produk berubah ke DalamPengiriman", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect((await contract.getProduk(1n)).status).to.equal(2n);
    });

    it("jumlah ETH tidak tepat ditolak", async function () {
      await expect(
        contract.connect(distributor).beliProduk(1n, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("AgriChain: Nilai ETH tidak sesuai harga produk");
    });

    it("non-distributor tidak bisa membeli", async function () {
      await expect(
        contract.connect(lainnya).beliProduk(1n, { value: HARGA })
      ).to.be.revertedWith("AgriChain: Hanya distributor");
    });

    it("petani tidak bisa membeli produknya sendiri", async function () {
      await expect(
        contract.connect(petani).beliProduk(1n, { value: HARGA })
      ).to.be.revertedWith("AgriChain: Hanya distributor");
    });

    it("produk yang sudah DalamPengiriman tidak bisa dibeli lagi", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.daftarkanPengguna(distributor2.address, "CV Berkah", 3);
      await expect(
        contract.connect(distributor2).beliProduk(1n, { value: HARGA })
      ).to.be.revertedWith("AgriChain: Produk harus berstatus Terverifikasi");
    });

    it("riwayat bertambah menjadi 3 setelah pembelian", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getTotalRiwayat(1n)).to.equal(3n);
    });

    it("event ETHDikunci dipancarkan", async function () {
      await expect(contract.connect(distributor).beliProduk(1n, { value: HARGA }))
        .to.emit(contract, "ETHDikunci")
        .withArgs(1n, distributor.address, HARGA);
    });
  });

  // ─── 7. Escrow — Konfirmasi Penerimaan ──────────────────
  describe("7. Escrow — Konfirmasi Penerimaan", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasi();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
    });

    it("auditor konfirmasi — ETH cair ke petani", async function () {
      const balSebelum = await ethers.provider.getBalance(petani.address);
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "Diterima baik");
      const balSesudah = await ethers.provider.getBalance(petani.address);
      expect(balSesudah > balSebelum).to.equal(true);
    });

    it("escrow menjadi 0 setelah konfirmasi", async function () {
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });

    it("status produk berubah ke Terjual", async function () {
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      expect((await contract.getProduk(1n)).status).to.equal(4n);
    });

    it("riwayat alur normal lengkap: 4 entri dengan status benar", async function () {
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(4);
      expect(hist[0].status).to.equal(0n); // MenungguAudit
      expect(hist[1].status).to.equal(1n); // Terverifikasi
      expect(hist[2].status).to.equal(2n); // DalamPengiriman
      expect(hist[3].status).to.equal(4n); // Terjual
    });

    it("event ETHDicairkan dipancarkan", async function () {
      await expect(contract.connect(auditor).konfirmasiPenerimaan(1n, "OK"))
        .to.emit(contract, "ETHDicairkan")
        .withArgs(1n, petani.address, HARGA);
    });
  });

  // ─── 8. Escrow — Tolak Pengiriman ───────────────────────
  describe("8. Escrow — Tolak Pengiriman", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasi();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
    });

    it("auditor tolak pengiriman — ETH refund ke distributor", async function () {
      const balSebelum = await ethers.provider.getBalance(distributor.address);
      await contract.connect(auditor).tolakPengiriman(1n, "Kualitas tidak sesuai");
      const balSesudah = await ethers.provider.getBalance(distributor.address);
      expect(balSesudah > balSebelum).to.equal(true);
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });

    it("status kembali ke Terverifikasi setelah tolak pengiriman", async function () {
      await contract.connect(auditor).tolakPengiriman(1n, "Busuk");
      expect((await contract.getProduk(1n)).status).to.equal(1n);
    });

    it("produk bisa dibeli kembali setelah tolak pengiriman", async function () {
      await contract.connect(auditor).tolakPengiriman(1n, "Tidak sesuai");
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getEscrow(1n)).to.equal(HARGA);
    });

    it("riwayat tolak pengiriman: 4 entri, entri terakhir status Ditolak", async function () {
      await contract.connect(auditor).tolakPengiriman(1n, "Tidak sesuai");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(4);
      expect(hist[3].status).to.equal(5n); // Ditolak
    });

    it("event ETHDiRefund dipancarkan", async function () {
      await expect(contract.connect(auditor).tolakPengiriman(1n, "Tidak sesuai"))
        .to.emit(contract, "ETHDiRefund")
        .withArgs(1n, distributor.address, HARGA);
    });
  });

  // ─── 9. Traceability ────────────────────────────────────
  describe("9. Traceability", function () {
    beforeEach(setupPengguna);

    it("alur penolakan verifikasi: 2 entri riwayat", async function () {
      await daftarProduk();
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(2);
      expect(hist[0].status).to.equal(0n); // MenungguAudit
      expect(hist[1].status).to.equal(5n); // Ditolak
    });

    it("alur rebeli setelah tolak pengiriman: 5 entri riwayat", async function () {
      await daftarProduk();
      await verifikasi();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).tolakPengiriman(1n, "Rusak");
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(5);
    });

    it("riwayat menyimpan pelaku yang benar pada setiap langkah", async function () {
      await daftarProduk();
      await verifikasi();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist[0].pelaku).to.equal(petani.address);
      expect(hist[1].pelaku).to.equal(auditor.address);
      expect(hist[2].pelaku).to.equal(distributor.address);
      expect(hist[3].pelaku).to.equal(auditor.address);
    });

    it("getEscrow return 0 untuk produk yang belum dibeli", async function () {
      await daftarProduk();
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });

    it("pembeli tersimpan benar di mapping pembeli", async function () {
      await daftarProduk();
      await verifikasi();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.pembeli(1n)).to.equal(distributor.address);
    });
  });
});
