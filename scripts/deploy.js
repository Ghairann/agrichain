const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=====================================================");
  console.log("  AgriChain — Deploy & Demo Escrow Smart Contract");
  console.log("=====================================================\n");

  const [admin, petani, auditor, distributor] = await ethers.getSigners();

  console.log("Deployer (Admin) :", admin.address);
  console.log("Balance Admin    :", ethers.formatEther(await ethers.provider.getBalance(admin.address)), "ETH\n");

  // Deploy
  console.log("Deploying AgriChain...");
  const AgriChain = await ethers.getContractFactory("AgriChain");
  const contract = await AgriChain.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("✅ Contract deployed:", addr, "\n");

  // ─── Setup Pengguna ───────────────────────────────────────
  console.log("--- 1. Setup Pengguna ---");
  await contract.daftarkanPengguna(petani.address, "Pak Budi Santoso", 1);
  console.log("✅ Petani:", petani.address);
  await contract.daftarkanPengguna(auditor.address, "Dinas Pertanian Malang", 2);
  console.log("✅ Auditor:", auditor.address);
  await contract.daftarkanPengguna(distributor.address, "PT Agro Nusantara", 3);
  console.log("✅ Distributor:", distributor.address);

  // ─── Daftarkan Produk ─────────────────────────────────────
  console.log("\n--- 2. Petani Daftarkan Produk ---");
  const hargaWei = ethers.parseEther("0.05");
  const tx = await contract.connect(petani).daftarkanProduk(
    "Beras Organik Sumber Makmur",
    "Sumbermanjing Wetan, Malang Selatan",
    500,
    "Organik - Tanpa Pestisida",
    hargaWei
  );
  await tx.wait();
  console.log("✅ Produk #1 terdaftar | Harga:", ethers.formatEther(hargaWei), "ETH");

  // ─── Verifikasi ───────────────────────────────────────────
  console.log("\n--- 3. Auditor Verifikasi Produk ---");
  await contract.connect(auditor).verifikasiProduk(
    1,
    "Lulus uji lab — kadar air 14%, bebas residu pestisida, kelas premium"
  );
  console.log("✅ Produk #1 terverifikasi");

  // ─── Beli + Escrow ────────────────────────────────────────
  console.log("\n--- 4. Distributor Beli Produk (ETH masuk Escrow) ---");
  const balSebelum = await ethers.provider.getBalance(petani.address);
  await contract.connect(distributor).beliProduk(1, { value: hargaWei });
  const escrowSaldo = await contract.getEscrow(1);
  console.log("✅ ETH terkunci di escrow:", ethers.formatEther(escrowSaldo), "ETH");
  console.log("   Contract balance:", ethers.formatEther(await contract.getContractBalance()), "ETH");

  // ─── Konfirmasi & ETH Cair ────────────────────────────────
  console.log("\n--- 5. Auditor Konfirmasi → ETH Cair ke Petani ---");
  await contract.connect(auditor).konfirmasiPenerimaan(
    1,
    "Diterima dalam kondisi baik di gudang Surabaya"
  );
  const balSesudah = await ethers.provider.getBalance(petani.address);
  console.log("✅ ETH cair ke petani!");
  console.log("   Selisih balance petani:", ethers.formatEther(balSesudah - balSebelum), "ETH");
  console.log("   Escrow sisa:", ethers.formatEther(await contract.getEscrow(1)), "ETH");

  // ─── Riwayat ─────────────────────────────────────────────
  console.log("\n--- Riwayat Perjalanan Produk #1 ---");
  const riwayat = await contract.getRiwayatProduk(1);
  const statusNama = ["Didaftarkan","Terverifikasi","DalamPengiriman","DiDistributor","Terjual"];
  riwayat.forEach((r, i) => {
    console.log(`  [${i+1}] ${statusNama[r.status]} — ${r.keterangan}`);
  });

  // ─── Summary ─────────────────────────────────────────────
  console.log("\n=====================================================");
  console.log("  RINGKASAN DEPLOYMENT");
  console.log("=====================================================");
  console.log("Contract Address :", addr);
  console.log("Total Produk     :", (await contract.totalProduk()).toString());
  console.log("Total Pengguna   :", (await contract.totalPengguna()).toString());
  const produk = await contract.getProduk(1);
  console.log("Status Produk #1 :", statusNama[produk.status]);
  console.log("\n✅ Salin address berikut untuk frontend:");
  console.log("CONTRACT_ADDRESS =", addr);

  // Auto-update frontend/.env.local so Vite picks up the new address
  const envPath = path.join(__dirname, "..", "frontend", ".env.local");
  fs.writeFileSync(envPath, `VITE_CONTRACT_ADDRESS=${addr}\n`, "utf8");
  console.log("✅ frontend/.env.local diperbarui:", envPath);

  console.log("\n=====================================================");
  console.log("  Akun Hardhat Localhost");
  console.log("=====================================================");
  console.log("Admin       :", admin.address);
  console.log("Petani      :", petani.address);
  console.log("Auditor     :", auditor.address);
  console.log("Distributor :", distributor.address);
  console.log("\nImpor salah satu akun ini ke MetaMask menggunakan");
  console.log("private key dari output 'npm run node'.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error("❌", err); process.exit(1); });
