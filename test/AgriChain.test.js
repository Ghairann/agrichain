const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriChain", function () {
  let contract, owner, petani, auditor, distributor, konsumen;
  const HARGA = ethers.parseEther("0.05");

  beforeEach(async function () {
    [owner, petani, auditor, distributor, konsumen] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgriChain");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  async function setupPengguna() {
    await contract.daftarkanPengguna(petani.address, "Pak Budi", 1);
    await contract.daftarkanPengguna(auditor.address, "Dinas Pertanian", 2);
    await contract.daftarkanPengguna(distributor.address, "PT Agro", 3);
  }

  async function daftarProduk() {
    return contract.connect(petani).daftarkanProduk("Beras Organik", "Malang", 100, "Organik", HARGA);
  }

  async function verifikasiProduk() {
    return contract.connect(auditor).verifikasiProduk(1n, "Lulus uji");
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
      await expect(contract.connect(petani).daftarkanPengguna(konsumen.address, "Test", 1)).to.be.revertedWith("AgriChain: Hanya admin");
    });
    it("Tidak bisa daftarkan pengguna yang sudah ada", async function () {
      await contract.daftarkanPengguna(petani.address, "Pak Budi", 1);
      await expect(contract.daftarkanPengguna(petani.address, "Duplikat", 1)).to.be.revertedWith("AgriChain: Sudah terdaftar");
    });
    it("Tidak bisa daftarkan address(0)", async function () {
      await expect(contract.daftarkanPengguna(ethers.ZeroAddress, "Zero", 1)).to.be.revertedWith("AgriChain: Alamat tidak valid");
    });
    it("Tidak bisa daftarkan dengan nama kosong", async function () {
      await expect(contract.daftarkanPengguna(petani.address, "", 1)).to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });
  });

  // ─── 3. Pendaftaran Produk ──────────────────────────────
  describe("3. Pendaftaran Produk", function () {
    beforeEach(setupPengguna);

    it("Petani bisa daftarkan produk", async function () {
      await daftarProduk();
      expect(await contract.totalProduk()).to.equal(1n);
      const p = await contract.getProduk(1n);
      expect(p.nama).to.equal("Beras Organik");
      expect(p.hargaWei).to.equal(HARGA);
      expect(p.status).to.equal(0n);
    });
    it("Riwayat awal berisi 1 entri", async function () {
      await daftarProduk();
      expect(await contract.getTotalRiwayat(1n)).to.equal(1n);
    });
    it("Bukan petani tidak bisa daftar produk", async function () {
      await expect(contract.connect(konsumen).daftarkanProduk("X", "X", 1, "X", HARGA)).to.be.revertedWith("AgriChain: Hanya petani terdaftar");
    });
    it("Berat 0 ditolak", async function () {
      await expect(contract.connect(petani).daftarkanProduk("X", "X", 0, "X", HARGA)).to.be.revertedWith("AgriChain: Berat harus > 0");
    });
    it("Nama produk kosong ditolak", async function () {
      await expect(contract.connect(petani).daftarkanProduk("", "Malang", 100, "Organik", HARGA)).to.be.revertedWith("AgriChain: Nama tidak boleh kosong");
    });
  });

  // ─── 4. Verifikasi ──────────────────────────────────────
  describe("4. Verifikasi Produk", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
    });

    it("Auditor bisa verifikasi produk", async function () {
      await verifikasiProduk();
      const p = await contract.getProduk(1n);
      expect(p.status).to.equal(1n);
    });
    it("Riwayat bertambah setelah verifikasi", async function () {
      await verifikasiProduk();
      expect(await contract.getTotalRiwayat(1n)).to.equal(2n);
    });
    it("Bukan auditor tidak bisa verifikasi", async function () {
      await expect(contract.connect(konsumen).verifikasiProduk(1n, "Test")).to.be.revertedWith("AgriChain: Hanya auditor");
    });
    it("Tidak bisa verifikasi 2 kali", async function () {
      await verifikasiProduk();
      await expect(verifikasiProduk()).to.be.revertedWith("AgriChain: Harus berstatus Didaftarkan");
    });
  });

  // ─── 5. Escrow Normal ───────────────────────────────────
  describe("5. Escrow — Skenario Normal", function () {
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
    it("ETH tidak bisa dikirim dengan harga salah", async function () {
      const salah = ethers.parseEther("0.01");
      await expect(contract.connect(distributor).beliProduk(1n, { value: salah })).to.be.revertedWith("AgriChain: Nilai ETH tidak sesuai harga");
    });
    it("Auditor konfirmasi → ETH cair ke petani", async function () {
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
  });

  // ─── 6. Escrow Penolakan ────────────────────────────────
  describe("6. Escrow — Skenario Penolakan", function () {
    beforeEach(async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
    });

    it("Auditor tolak → ETH refund ke distributor", async function () {
      const balSebelum = await ethers.provider.getBalance(distributor.address);
      await contract.connect(auditor).tolakProduk(1n, "Kualitas tidak sesuai");
      const balSesudah = await ethers.provider.getBalance(distributor.address);
      expect(balSesudah > balSebelum).to.equal(true);
      expect(await contract.getEscrow(1n)).to.equal(0n);
    });
    it("Status kembali Terverifikasi setelah ditolak", async function () {
      await contract.connect(auditor).tolakProduk(1n, "Busuk");
      expect((await contract.getProduk(1n)).status).to.equal(1n);
    });
  });

  // ─── 7. Traceability ────────────────────────────────────
  describe("7. Traceability", function () {
    it("Riwayat mencatat seluruh perjalanan produk", async function () {
      await setupPengguna();
      await daftarProduk();
      await verifikasiProduk();
      await contract.connect(distributor).beliProduk(1n, { value: HARGA });
      await contract.connect(auditor).konfirmasiPenerimaan(1n, "OK");
      const riwayat = await contract.getRiwayatProduk(1n);
      expect(riwayat.length).to.equal(4);
      expect(riwayat[3].status).to.equal(4n);
    });
  });
});
