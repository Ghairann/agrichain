const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=====================================================");
  console.log("  AgriChain — Deploy & Demo");
  console.log("  Harga Ditetapkan oleh Auditor");
  console.log("=====================================================\n");

  const [admin, petani, auditor, distributor, petani2, distributor2] = await ethers.getSigners();

  console.log("Deployer (Admin) :", admin.address);
  console.log("Balance Admin    :", ethers.formatEther(await ethers.provider.getBalance(admin.address)), "ETH\n");

  // ── Deploy ──────────────────────────────────────────────
  console.log("Deploying AgriChain...");
  const AgriChain = await ethers.getContractFactory("AgriChain");
  const contract = await AgriChain.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("Contract deployed:", addr, "\n");

  // ── Setup Pengguna ────────────────────────────────────
  console.log("--- 1. Registrasi Peserta Blockchain ---");
  await contract.daftarkanPengguna(petani.address,       "Pak Budi Santoso",       1);
  await contract.daftarkanPengguna(auditor.address,      "Dinas Pertanian Malang",  2);
  await contract.daftarkanPengguna(distributor.address,  "PT Agro Nusantara",       3);
  await contract.daftarkanPengguna(petani2.address,      "Bu Sri Wahyuni",          1);
  await contract.daftarkanPengguna(distributor2.address, "CV Berkah Pangan",        3);

  const participants = [
    { role: "Admin (Owner)", name: "Admin AgriChain",        address: admin.address },
    { role: "Petani",        name: "Pak Budi Santoso",        address: petani.address },
    { role: "Auditor",       name: "Dinas Pertanian Malang",  address: auditor.address },
    { role: "Distributor",   name: "PT Agro Nusantara",       address: distributor.address },
    { role: "Petani",        name: "Bu Sri Wahyuni",          address: petani2.address },
    { role: "Distributor",   name: "CV Berkah Pangan",        address: distributor2.address },
  ];

  console.log("");
  console.log("  ┌─────────────────────┬──────────────────────────────┬────────────────────────────────────────────┐");
  console.log("  │ Role                │ Nama                         │ Address                                    │");
  console.log("  ├─────────────────────┼──────────────────────────────┼────────────────────────────────────────────┤");
  for (const p of participants) {
    console.log(`  │ ${p.role.padEnd(19)} │ ${p.name.padEnd(28)} │ ${p.address} │`);
  }
  console.log("  └─────────────────────┴──────────────────────────────┴────────────────────────────────────────────┘");
  console.log("");

  // ── Daftarkan Produk (tanpa harga — ditetapkan auditor) ─
  console.log("\n--- 2. Petani Daftarkan Produk (tanpa harga) ---");

  await (await contract.connect(petani).daftarkanProduk(
    "Beras Organik Sumber Makmur", "Sumbermanjing Wetan, Malang Selatan",
    500, "Organik - Tanpa Pestisida"
  )).wait();
  console.log("Produk #1 (petani): Beras Organik Sumber Makmur — menunggu audit");

  await (await contract.connect(petani2).daftarkanProduk(
    "Jagung Manis Jatim Premium", "Batu, Malang",
    300, "Organik - SOP Dinas Pertanian"
  )).wait();
  console.log("Produk #2 (petani2): Jagung Manis Jatim Premium — menunggu audit");

  await (await contract.connect(petani).daftarkanProduk(
    "Cabai Merah Organik", "Kepanjen, Malang",
    100, "Semi-Organik"
  )).wait();
  console.log("Produk #3 (petani): Cabai Merah Organik — menunggu audit (akan ditolak)");

  await (await contract.connect(petani2).daftarkanProduk(
    "Kedelai Hitam Premium Malang", "Tumpang, Malang",
    200, "Organik Tersertifikasi"
  )).wait();
  console.log("Produk #4 (petani2): Kedelai Hitam Premium — menunggu audit");

  await (await contract.connect(petani).daftarkanProduk(
    "Tomat Cherry Organik", "Pujon, Malang",
    80, "Hidroponik Organik"
  )).wait();
  console.log("Produk #5 (petani): Tomat Cherry Organik — dibiarkan menunggu audit");

  // ── Auditor Verifikasi + Tetapkan Harga & Tolak ───────
  console.log("\n--- 3. Auditor Verifikasi + Tetapkan Harga ---");

  await contract.connect(auditor).verifikasiDanTentukanHarga(
    1, ethers.parseEther("0.05"),
    "Lulus uji lab - kadar air 14%, bebas residu pestisida, kelas premium"
  );
  console.log("Produk #1 terverifikasi — harga: 0.05 ETH");

  await contract.connect(auditor).verifikasiDanTentukanHarga(
    2, ethers.parseEther("0.035"),
    "Kualitas premium, kadar gula tinggi, memenuhi standar ekspor"
  );
  console.log("Produk #2 terverifikasi — harga: 0.035 ETH");

  await contract.connect(auditor).tolakProduk(
    3, "Kadar capsaicin tidak memenuhi standar organik - ditemukan residu pestisida kelas B"
  );
  console.log("Produk #3 DITOLAK auditor");

  await contract.connect(auditor).verifikasiDanTentukanHarga(
    4, ethers.parseEther("0.02"),
    "Kualitas standar, bebas kontaminan, layak distribusi"
  );
  console.log("Produk #4 terverifikasi — harga: 0.02 ETH");

  console.log("Produk #5 dibiarkan MenungguAudit");

  // ── Pembelian & Escrow ────────────────────────────────
  console.log("\n--- 4. Distributor Beli Produk ---");

  const balPetani1Sebelum = await ethers.provider.getBalance(petani.address);
  await contract.connect(distributor).beliProduk(1, { value: ethers.parseEther("0.05") });
  console.log("Distributor 1 beli Produk #1 - escrow: 0.05 ETH");

  await contract.connect(distributor2).beliProduk(2, { value: ethers.parseEther("0.035") });
  console.log("Distributor 2 beli Produk #2 - escrow: 0.035 ETH");

  console.log("   Contract balance:", ethers.formatEther(await contract.getContractBalance()), "ETH");

  // ── Konfirmasi Produk #1 ──────────────────────────────
  console.log("\n--- 5. Auditor Konfirmasi Pengiriman Produk #1 ---");
  await contract.connect(auditor).konfirmasiPenerimaan(1, "Diterima dalam kondisi baik di gudang Surabaya");
  const balPetani1Sesudah = await ethers.provider.getBalance(petani.address);
  console.log("ETH cair ke Petani 1!");
  console.log("   Selisih balance:", ethers.formatEther(balPetani1Sesudah - balPetani1Sebelum), "ETH");
  console.log("   Produk #2 dibiarkan DalamPengiriman (demo state)");

  // ── Riwayat ───────────────────────────────────────────
  console.log("\n--- Riwayat Semua Produk ---");
  const statusNama = [
    "MenungguAudit","Terverifikasi","DalamPengiriman","DiDistributor","Terjual","Ditolak"
  ];

  for (let id = 1; id <= 5; id++) {
    const riwayat = await contract.getRiwayatProduk(id);
    const p = await contract.getProduk(id);
    const harga = p.hargaFinalAuditor > 0n ? `${ethers.formatEther(p.hargaFinalAuditor)} ETH` : "belum ditetapkan";
    console.log(`\n  #${id} "${p.nama}" [${statusNama[Number(p.status)]}] ${harga}`);
    riwayat.forEach((r, i) => {
      console.log(`      [${i+1}] ${statusNama[Number(r.status)]} — ${r.keterangan}`);
    });
  }

  // ── Summary ───────────────────────────────────────────
  console.log("\n=====================================================");
  console.log("  RINGKASAN DEPLOYMENT");
  console.log("=====================================================");
  console.log("Contract Address   :", addr);
  console.log("Total Produk       :", (await contract.totalProduk()).toString());
  console.log("Total Pengguna     :", (await contract.totalPengguna()).toString());
  console.log("\nStatus Produk:");
  for (let id = 1; id <= 5; id++) {
    const p = await contract.getProduk(id);
    const harga = p.hargaFinalAuditor > 0n ? `${ethers.formatEther(p.hargaFinalAuditor)} ETH` : "—";
    console.log(`  #${id} ${p.nama.padEnd(32)} [${statusNama[Number(p.status)]}] ${harga}`);
  }

  // ── Auto-update frontend/.env.local ──────────────────
  const envPath = path.join(__dirname, "..", "frontend", ".env.local");
  fs.writeFileSync(envPath, `VITE_CONTRACT_ADDRESS=${addr}\n`, "utf8");
  console.log("\nfrontend/.env.local diperbarui:", envPath);

  console.log("\n=====================================================");
  console.log("  FRONTEND SIAP DIGUNAKAN");
  console.log("  Buka http://localhost:3000 setelah npm run dev");
  console.log("=====================================================\n");
}

main().catch(err => {
  console.error("Deploy failed:", err.message ?? err);
  process.exit(1);
});
