const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriChain", function () {
  let contract, owner, petani, auditor, distributor, lainnya;
  const HARGA = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, petani, auditor, distributor, lainnya] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgriChain");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  async function setupPengguna() {
    await contract.daftarkanPengguna(petani.address,      "Pak Budi",       1);
    await contract.daftarkanPengguna(auditor.address,     "Dinas Pertanian",2);
    await contract.daftarkanPengguna(distributor.address, "PT Agro",        3);
  }

  async function daftarProduk() {
    return contract.connect(petani).daftarkanProduk("Beras Organik", "Malang", 100, "Organik");
  }

  async function verifikasiProduk(harga) {
    return contract.connect(auditor).verifikasiDanTentukanHarga(1n, harga ?? HARGA, "Lulus uji");
  }

  // ─── 1. Deployment ──────────────────────────────────────
  describe("1. Deployment", function () {
    it("Owner terdaftar sebagai Admin", async function () {
      const u = await contract.getPengguna(owner.address);
      expect(u.role).to.equal(4n);
      expect(u.aktif).to.equal(true);
    });
    it("Total produk dan pengguna awal benar", async function () {
      expect(await contract.totalProduk()).to.equal(0n);
      expect(await contract.totalPengguna()).to.equal(1n);
    });
  });

  // ─── 2. Manajemen Pengguna ──────────────────────────────
  describe("2. Manajemen Pengguna", function () {
    it("Admin bisa daftarkan petani, auditor, distributor", async function () {
      await setupPengguna();
      expect((await contract.getPengguna(petani.address)).role).to.equal(1n);
      expect((await contract.getPengguna(auditor.address)).role).to.equal(2n);
      expect((await contract.getPengguna(distributor.address)).role).to.equal(3n);
      expect(await contract.totalPengguna()).to.equal(4n);
    });
    it("Bukan admin tidak bisa daftarkan pengguna", async function () {
      await expect(contract.connect(petani).daftarkanPengguna(lainnya.address, "Test", 1))
        .to.be.revertedWith("AgriChain: Hanya admin");
    });
    it("Tidak bisa daftarkan pengguna yang sudah ada", async function () {
      await contract.daftarkanPengguna(petani.address, "Pak Budi", 1);
      await expect(contract.daftarkanPengguna(petani.address, "Duplikat", 1))
        .to.be.revertedWith("AgriChain: Sudah terdaftar");
    });
    it("Tidak bisa daftarkan address(0)", async function () {
      await expect(contract.daftarkanPengguna(ethers.ZeroAddress, "Zero", 1))
        .to.be.revertedWith("AgriChain: Alamat tidak valid");
    });
    it("Nama kosong ditolak", async function () {
      await expect(contract.daftarkanPengguna(petani.address, "", 1))
        .to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });
  });

  // ─── 3. Pendaftaran Produk ──────────────────────────────
  describe("3. Pendaftaran Produk", function () {
    beforeEach(setupPengguna);

    it("Petani bisa daftarkan produk tanpa harga", async function () {
      await daftarProduk();
      expect(await contract.totalProduk()).to.equal(1n);
      const p = await contract.getProduk(1n);
      expect(p.nama).to.equal("Beras Organik");
      expect(p.hargaWei).to.equal(0n);         // harga belum ditetapkan
      expect(p.hargaFinalAuditor).to.equal(0n);
      expect(p.status).to.equal(0n);            // MenungguAudit
    });
    it("auditorPenentuHarga kosong saat daftar", async function () {
      await daftarProduk();
      const p = await contract.getProduk(1n);
      expect(p.auditorPenentuHarga).to.equal(ethers.ZeroAddress);
    });
    it("Riwayat awal berisi 1 entri MenungguAudit", async function () {
      await daftarProduk();
      expect(await contract.getTotalRiwayat(1n)).to.equal(1n);
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist[0].status).to.equal(0n); // MenungguAudit
    });
    it("Bukan petani tidak bisa daftar produk", async function () {
      await expect(contract.connect(lainnya).daftarkanProduk("X", "X", 1, "X"))
        .to.be.revertedWith("AgriChain: Hanya petani terdaftar");
    });
    it("Berat 0 ditolak", async function () {
      await expect(contract.connect(petani).daftarkanProduk("X", "X", 0, "X"))
        .to.be.revertedWith("AgriChain: Berat harus > 0");
    });
    it("Nama produk kosong ditolak", async function () {
      await expect(contract.connect(petani).daftarkanProduk("", "Malang", 100, "Organik"))
        .to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });
  });

  // ─── 4. Verifikasi dan Tentukan Harga ───────────────────
  describe("4. verifikasiDanTentukanHarga", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
    });

    it("Auditor bisa verifikasi dan tetapkan harga", async function () {
      await verifikasiProduk();
      const p = await contract.getProduk(1n);
      expect(p.status).to.equal(1n);           // Terverifikasi
      expect(p.hargaWei).to.equal(HARGA);
      expect(p.hargaFinalAuditor).to.equal(HARGA);
      expect(p.auditorPenentuHarga).to.equal(auditor.address);
    });
    it("Riwayat bertambah setelah verifikasi", async function () {
      await verifikasiProduk();
      expect(await contract.getTotalRiwayat(1n)).to.equal(2n);
    });
    it("Bukan auditor tidak bisa verifikasi", async function () {
      await expect(contract.connect(lainnya).verifikasiDanTentukanHarga(1n, HARGA, "Test"))
        .to.be.revertedWith("AgriChain: Hanya auditor");
    });
    it("Tidak bisa verifikasi produk yang sudah Terverifikasi", async function () {
      await verifikasiProduk();
      await expect(verifikasiProduk())
        .to.be.revertedWith("AgriChain: Harus berstatus MenungguAudit");
    });
    it("Harga 0 ditolak", async function () {
      await expect(contract.connect(auditor).verifikasiDanTentukanHarga(1n, 0n, "Test"))
        .to.be.revertedWith("AgriChain: Harga final harus > 0");
    });
    it("Emit ProdukDiverifikasi dengan harga", async function () {
      await expect(verifikasiProduk())
        .to.emit(contract, "ProdukDiverifikasi")
        .withArgs(1n, auditor.address, HARGA);
    });
    it("Auditor bisa tetapkan harga berbeda dari nol", async function () {
      const hargaBaru = ethers.parseEther("0.08");
      await contract.connect(auditor).verifikasiDanTentukanHarga(1n, hargaBaru, "Premium");
      const p = await contract.getProduk(1n);
      expect(p.hargaWei).to.equal(hargaBaru);
      expect(p.hargaFinalAuditor).to.equal(hargaBaru);
    });
  });

  // ─── 5. Tolak Verifikasi ─────────────────────────────────
  describe("5. Tolak Verifikasi Produk", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
    });

    it("Auditor bisa tolak produk berstatus MenungguAudit", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Residu pestisida melebihi batas");
      expect((await contract.getProduk(1n)).status).to.equal(5n); // Ditolak
    });
    it("Produk Ditolak tidak bisa dibeli", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      await expect(contract.connect(distributor).beliProduk(1n, { value: HARGA }))
        .to.be.revertedWith("AgriChain: Produk harus berstatus Terverifikasi");
    });
    it("Alasan penolakan kosong ditolak", async function () {
      await expect(contract.connect(auditor).tolakProduk(1n, ""))
        .to.be.revertedWith("AgriChain: Alasan penolakan tidak boleh kosong");
    });
    it("Tidak bisa tolak produk yang sudah diverifikasi", async function () {
      await verifikasiProduk();
      await expect(contract.connect(auditor).tolakProduk(1n, "Terlambat"))
        .to.be.revertedWith("AgriChain: Harus berstatus MenungguAudit untuk ditolak");
    });
    it("Emit event ProdukDitolak", async function () {
      await expect(contract.connect(auditor).tolakProduk(1n, "Tidak lolos"))
        .to.emit(contract, "ProdukDitolak")
        .withArgs(1n, auditor.address, "Tidak lolos");
    });
    it("Riwayat bertambah setelah penolakan", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      expect(await contract.getTotalRiwayat(1n)).to.equal(2n);
    });
  });

  // ─── 6. Escrow Normal ───────────────────────────────────
  describe("6. Escrow — Skenario Normal", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
    });

    it("Distributor bisa beli produk dan ETH terkunci", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getEscrow(1n)).to.equal(HARGA);
      expect(await contract.getContractBalance()).to.equal(HARGA);
    });
    it("Produk status berubah ke DalamPengiriman setelah beli", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect((await contract.getProduk(1n)).status).to.equal(2n);
    });
    it("ETH tidak bisa dikirim dengan harga salah", async function () {
      const salah = ethers.parseEther("0.01");
      await expect(contract.connect(distributor).beliProduk(1n, { value: salah }))
        .to.be.revertedWith("AgriChain: Nilai ETH tidak sesuai harga produk");
    });
    it("Bukan distributor tidak bisa beli", async function () {
      await expect(contract.connect(lainnya).beliProduk(1n, { value: HARGA }))
        .to.be.revertedWith("AgriChain: Hanya distributor");
    });
    it("Auditor konfirmasi penerimaan → ETH cair ke petani", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      const balSebelum = await ethers.provider.getBalance(petani.address);
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "Diterima baik");
      const balSesudah = await ethers.provider.getBalance(petani.address);
      expect(balSesudah > balSebelum).to.equal(true);
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });
    it("Status produk Terjual setelah konfirmasi", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      expect((await contract.getProduk(1n)).status).to.equal(4n);
    });
    it("ETH dikunci sampai konfirmasi, lalu 0", async function () {
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getEscrow(1n)).to.equal(HARGA);
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });
  });

  // ─── 7. Escrow — Tolak Pengiriman ───────────────────────
  describe("7. Escrow — Tolak Pengiriman", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
    });

    it("Auditor tolak pengiriman → ETH refund ke distributor", async function () {
      const balSebelum = await ethers.provider.getBalance(distributor.address);
      await contract.connect(auditor).tolakPengiriman(1n, "Kualitas tidak sesuai");
      const balSesudah = await ethers.provider.getBalance(distributor.address);
      expect(balSesudah > balSebelum).to.equal(true);
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });
    it("Status kembali Terverifikasi setelah tolak pengiriman", async function () {
      await contract.connect(auditor).tolakPengiriman(1n, "Busuk");
      expect((await contract.getProduk(1n)).status).to.equal(1n); // Terverifikasi
    });
    it("Produk bisa dibeli lagi setelah tolak pengiriman", async function () {
      await contract.connect(auditor).tolakPengiriman(1n, "Tidak sesuai");
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      expect(await contract.getEscrow(1n)).to.equal(HARGA);
    });
  });

  // ─── 8. Traceability ────────────────────────────────────
  describe("8. Traceability", function () {
    it("Alur normal: 4 entri riwayat", async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(4);
      expect(hist[0].status).to.equal(0n); // MenungguAudit
      expect(hist[1].status).to.equal(1n); // Terverifikasi
      expect(hist[2].status).to.equal(2n); // DalamPengiriman
      expect(hist[3].status).to.equal(4n); // Terjual
    });
    it("Alur penolakan verifikasi: 2 entri riwayat", async function () {
      await setupPengguna();
      await daftarProduk();
      await contract.connect(auditor).tolakProduk(1n, "Tidak layak");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(2);
      expect(hist[0].status).to.equal(0n); // MenungguAudit
      expect(hist[1].status).to.equal(5n); // Ditolak
    });
    it("Alur tolak pengiriman: 4 entri riwayat", async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).tolakPengiriman(1n, "Tidak sesuai");
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(4);
      expect(hist[3].status).to.equal(5n); // Ditolak (rejection event)
    });
    it("Produk bisa dibeli kembali setelah tolak pengiriman — riwayat 5 entri", async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).tolakPengiriman(1n, "Rusak");
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      const hist = await contract.getRiwayatProduk(1n);
      expect(hist.length).to.equal(5);
    });
    it("hargaFinalAuditor tersimpan dengan benar di riwayat", async function () {
      await setupPengguna();
      await daftarProduk();
      const hargaKhusus = ethers.parseEther("0.077");
      await contract.connect(auditor).verifikasiDanTentukanHarga(1n, hargaKhusus, "Premium grade");
      const p = await contract.getProduk(1n);
      expect(p.hargaFinalAuditor).to.equal(hargaKhusus);
      expect(p.hargaWei).to.equal(hargaKhusus);
    });
  });
});
