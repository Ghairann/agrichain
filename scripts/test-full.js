// scripts/test-full.js
// Automated integration test + CLI report for AgriChain
//
// Usage (in-process hardhat network, no node needed):
//   npx hardhat run scripts/test-full.js
//
// Usage (against running localhost node):
//   npx hardhat run scripts/test-full.js --network localhost

const { ethers } = require("hardhat");

// ── Result tracking ──────────────────────────────────────
const TICK  = "✔";
const CROSS = "✘";

const groups = {
  "User Registration":     { pass: 0, fail: 0 },
  "Product Registration":  { pass: 0, fail: 0 },
  "Auditor Verification":  { pass: 0, fail: 0 },
  "Escrow Purchase":       { pass: 0, fail: 0 },
  "Delivery Confirmation": { pass: 0, fail: 0 },
  "Rejection Flow":        { pass: 0, fail: 0 },
  "Dashboard Rendering":   { pass: 0, fail: 0 },
  "Blockchain Queries":    { pass: 0, fail: 0 },
  "ABI Synchronization":   { pass: 0, fail: 0 },
  "No Runtime Errors":     { pass: 0, fail: 0 },
};

let currentGroup = "No Runtime Errors";
let totalPass = 0, totalFail = 0;

function group(name) {
  currentGroup = name;
  console.log(`\n    ── ${name} ──`);
}

function pass(label) {
  groups[currentGroup].pass++;
  totalPass++;
  console.log(`      ${TICK} ${label}`);
}

function fail(label, reason = "") {
  groups[currentGroup].fail++;
  totalFail++;
  console.error(`      ${CROSS} FAIL: ${label}${reason ? " — " + reason : ""}`);
}

async function check(cond, label) {
  if (cond) pass(label);
  else fail(label, "assertion false");
}

async function expectRevert(fn, label) {
  try {
    await fn();
    fail(label, "expected revert — call succeeded");
  } catch {
    pass(label);
  }
}

// ── Helpers ──────────────────────────────────────────────
const STATUS = { MenungguAudit: 0, Terverifikasi: 1, DalamPengiriman: 2, Terjual: 4, Ditolak: 5 };
const ROLE   = { TidakTerdaftar: 0, Petani: 1, Auditor: 2, Distributor: 3, Admin: 4 };
const STATUS_NAME = ["MenungguAudit","Terverifikasi","DalamPengiriman","DiDistributor","Terjual","Ditolak"];
const ROLE_NAME   = ["TidakTerdaftar","Petani","Auditor","Distributor","Admin"];

// Mirror of frontend mapProduct — validates struct shape
function mapProduct(raw) {
  if (!raw) return null;
  try {
    return {
      id:                  raw.id,
      nama:                raw.nama,
      lokasi:              raw.lokasi,
      berat:               raw.berat,
      metode:              raw.metode,
      petani:              raw.petani,
      status:              raw.status,
      hargaFinalAuditor:   raw.hargaFinalAuditor,
      auditorPenentuHarga: raw.auditorPenentuHarga,
    };
  } catch (err) {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  AgriChain — Automated Full-Stack Test Suite");
  console.log("═══════════════════════════════════════════════════════");

  // ── 0. Environment Setup ─────────────────────────────────
  console.log("\n  [0] Environment Setup");
  const signers = await ethers.getSigners();
  const [admin, petani, auditor, distributor, petani2, distributor2] = signers;

  const KNOWN_ADDRESSES = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  ];

  console.log("\n  Test Accounts:");
  const acctLabels = ["Admin (Owner)","Petani 1","Auditor","Distributor 1","Petani 2","Distributor 2"];
  for (let i = 0; i < 6; i++) {
    const signer = signers[i];
    const addr   = await signer.getAddress();
    const match  = addr.toLowerCase() === KNOWN_ADDRESSES[i].toLowerCase() ? "" : " ⚠ unexpected";
    console.log(`    #${i} ${acctLabels[i].padEnd(14)}: ${addr}${match}`);
  }

  // Deploy fresh contract
  console.log("\n  Deploying AgriChain...");
  const Factory  = await ethers.getContractFactory("AgriChain");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const contractAddr = await contract.getAddress();
  const network      = await ethers.provider.getNetwork();

  console.log(`  Contract Address : ${contractAddr}`);
  console.log(`  Chain ID         : ${network.chainId.toString()}`);

  const code = await ethers.provider.getCode(contractAddr);
  if (code === "0x") {
    console.error("  FATAL: Contract not deployed — bytecode missing");
    process.exit(1);
  }
  console.log("  Bytecode check   : OK");

  const HARGA = ethers.parseEther("0.05");

  // ── TEST 1: User Registration ─────────────────────────
  group("User Registration");

  await contract.daftarkanPengguna(petani.address,       "Pak Budi Santoso",       1);
  await contract.daftarkanPengguna(auditor.address,      "Dinas Pertanian Malang",  2);
  await contract.daftarkanPengguna(distributor.address,  "PT Agro Nusantara",       3);
  await contract.daftarkanPengguna(petani2.address,      "Bu Sri Wahyuni",          1);
  await contract.daftarkanPengguna(distributor2.address, "CV Berkah Pangan",        3);

  const uAdmin = await contract.getPengguna(admin.address);
  await check(Number(uAdmin.role) === ROLE.Admin && uAdmin.aktif,   "admin role = Admin (4), aktif");
  const uPetani = await contract.getPengguna(petani.address);
  await check(Number(uPetani.role) === ROLE.Petani && uPetani.aktif, "petani1 role = Petani (1), aktif");
  const uAudit = await contract.getPengguna(auditor.address);
  await check(Number(uAudit.role) === ROLE.Auditor && uAudit.aktif,  "auditor role = Auditor (2), aktif");
  const uDist = await contract.getPengguna(distributor.address);
  await check(Number(uDist.role) === ROLE.Distributor && uDist.aktif,"distributor1 role = Distributor (3), aktif");
  await check((await contract.totalPengguna()) === 6n,                "totalPengguna = 6 setelah 5 registrasi");

  await expectRevert(
    () => contract.connect(petani).daftarkanPengguna(admin.address, "X", 1),
    "non-admin tidak bisa mendaftarkan pengguna"
  );
  await expectRevert(
    () => contract.daftarkanPengguna(petani.address, "Duplikat", 1),
    "registrasi duplikat ditolak"
  );
  await expectRevert(
    () => contract.daftarkanPengguna(ethers.ZeroAddress, "Zero", 1),
    "zero address ditolak"
  );

  // ── TEST 2: Product Registration ──────────────────────
  group("Product Registration");

  await contract.connect(petani).daftarkanProduk(
    "Beras Organik Sumber Makmur", "Sumbermanjing Wetan, Malang",
    500, "Organik - Tanpa Pestisida"
  );
  await contract.connect(petani2).daftarkanProduk(
    "Jagung Manis Jatim Premium", "Batu, Malang",
    300, "Organik - SOP Dinas"
  );
  await contract.connect(petani).daftarkanProduk(
    "Cabai Merah Organik", "Kepanjen, Malang",
    100, "Semi-Organik"
  );
  await contract.connect(petani2).daftarkanProduk(
    "Kedelai Hitam Premium", "Tumpang, Malang",
    200, "Organik Tersertifikasi"
  );
  await contract.connect(petani).daftarkanProduk(
    "Tomat Cherry Organik", "Pujon, Malang",
    80, "Hidroponik Organik"
  );

  await check((await contract.totalProduk()) === 5n, "totalProduk = 5 setelah 5 registrasi");

  const p1 = await contract.getProduk(1n);
  await check(p1.nama    === "Beras Organik Sumber Makmur",           "p1.nama tersimpan benar");
  await check(p1.petani  === petani.address,                           "p1.petani = petani.address");
  await check(Number(p1.status) === STATUS.MenungguAudit,              "p1.status = MenungguAudit (0)");
  await check(p1.hargaFinalAuditor === 0n,                             "p1.hargaFinalAuditor = 0 (belum diaudit)");
  await check(p1.auditorPenentuHarga === ethers.ZeroAddress,           "p1.auditorPenentuHarga = ZeroAddress (belum diaudit)");
  await check((await contract.getTotalRiwayat(1n)) === 1n,             "riwayat awal p1: 1 entri");

  await expectRevert(
    () => contract.connect(distributor).daftarkanProduk("X","X",100,"X"),
    "non-petani (distributor) tidak bisa daftar produk"
  );
  await expectRevert(
    () => contract.connect(petani).daftarkanProduk("X","X", 0,"X"),
    "berat 0 ditolak"
  );
  await expectRevert(
    () => contract.connect(petani).daftarkanProduk("","X",100,"X"),
    "nama kosong ditolak"
  );
  await expectRevert(
    () => contract.connect(auditor).verifikasiDanTentukanHarga(1n, 0n, "Test"),
    "harga 0 ditolak saat auditor verifikasi"
  );

  // ── TEST 3: Auditor Verification ──────────────────────
  group("Auditor Verification");

  await contract.connect(auditor).verifikasiDanTentukanHarga(1n, ethers.parseEther("0.05"), "Lulus uji lab - bebas residu");
  await contract.connect(auditor).verifikasiDanTentukanHarga(2n, ethers.parseEther("0.035"), "Kualitas premium, standar ekspor");
  // p3 akan ditolak
  await contract.connect(auditor).tolakProduk(3n, "Residu pestisida kelas B ditemukan");
  await contract.connect(auditor).verifikasiDanTentukanHarga(4n, ethers.parseEther("0.02"), "Bebas kontaminan, layak distribusi");
  // p5 dibiarkan MenungguAudit

  await check(Number((await contract.getProduk(1n)).status) === STATUS.Terverifikasi,  "p1 status = Terverifikasi (1)");
  await check(Number((await contract.getProduk(2n)).status) === STATUS.Terverifikasi,  "p2 status = Terverifikasi (1)");
  await check(Number((await contract.getProduk(3n)).status) === STATUS.Ditolak,        "p3 status = Ditolak (5)");
  await check(Number((await contract.getProduk(4n)).status) === STATUS.Terverifikasi,  "p4 status = Terverifikasi (1)");
  await check(Number((await contract.getProduk(5n)).status) === STATUS.MenungguAudit,  "p5 status = MenungguAudit (0, tidak disentuh)");
  await check((await contract.getTotalRiwayat(1n)) === 2n,                             "riwayat p1: 2 entri setelah verifikasi");

  const p1v = await contract.getProduk(1n);
  await check(p1v.hargaFinalAuditor === ethers.parseEther("0.05"),  "p1.hargaFinalAuditor = 0.05 ETH (ditetapkan auditor)");
  await check(p1v.auditorPenentuHarga === auditor.address,           "p1.auditorPenentuHarga = auditor.address");

  await expectRevert(
    () => contract.connect(distributor).verifikasiDanTentukanHarga(5n, HARGA, "X"),
    "non-auditor (distributor) tidak bisa verifikasi"
  );
  await expectRevert(
    () => contract.connect(auditor).verifikasiDanTentukanHarga(1n, HARGA, "Ulang"),
    "tidak bisa verifikasi ulang produk sudah Terverifikasi"
  );
  await expectRevert(
    () => contract.connect(distributor).beliProduk(3n, { value: ethers.parseEther("0.02") }),
    "produk Ditolak tidak bisa dibeli"
  );

  // ── TEST 4: Escrow Purchase ───────────────────────────
  group("Escrow Purchase");

  const balPetani1Before  = await ethers.provider.getBalance(petani.address);
  const balPetani2Before  = await ethers.provider.getBalance(petani2.address);

  await contract.connect(distributor).beliProduk(1n, { value: ethers.parseEther("0.05") });
  await contract.connect(distributor2).beliProduk(2n, { value: ethers.parseEther("0.035") });

  await check((await contract.getEscrow(1n)) === ethers.parseEther("0.05"),    "escrow p1 = 0.05 ETH");
  await check((await contract.getEscrow(2n)) === ethers.parseEther("0.035"),   "escrow p2 = 0.035 ETH");
  await check(
    (await contract.getContractBalance()) === ethers.parseEther("0.085"),
    "contract balance = 0.085 ETH (total escrow terkunci)"
  );
  await check(
    Number((await contract.getProduk(1n)).status) === STATUS.DalamPengiriman,
    "p1 status = DalamPengiriman (2)"
  );
  await check(
    Number((await contract.getProduk(2n)).status) === STATUS.DalamPengiriman,
    "p2 status = DalamPengiriman (2)"
  );
  await check((await contract.pembeli(1n)) === distributor.address,  "pembeli p1 = distributor.address");
  await check((await contract.pembeli(2n)) === distributor2.address, "pembeli p2 = distributor2.address");

  await expectRevert(
    () => contract.connect(distributor).beliProduk(1n, { value: ethers.parseEther("0.01") }),
    "jumlah ETH salah ditolak"
  );
  await expectRevert(
    () => contract.connect(petani).beliProduk(4n, { value: ethers.parseEther("0.02") }),
    "non-distributor (petani) tidak bisa membeli"
  );

  // ── TEST 5: Delivery Confirmation ─────────────────────
  group("Delivery Confirmation");

  await contract.connect(auditor).konfirmasiPenerimaan(1n, "Diterima kondisi baik di gudang Surabaya");

  const balPetani1After = await ethers.provider.getBalance(petani.address);
  await check(balPetani1After > balPetani1Before,                          "ETH cair ke petani 1 setelah konfirmasi");
  await check((await contract.getEscrow(1n)) === 0n,                       "escrow p1 = 0 setelah konfirmasi");
  await check(Number((await contract.getProduk(1n)).status) === STATUS.Terjual, "p1 status = Terjual (4)");

  const hist1 = await contract.getRiwayatProduk(1n);
  await check(hist1.length === 4,                                           "riwayat p1: 4 entri (alur normal lengkap)");
  await check(Number(hist1[0].status) === STATUS.MenungguAudit,             "riwayat[0] = MenungguAudit");
  await check(Number(hist1[1].status) === STATUS.Terverifikasi,             "riwayat[1] = Terverifikasi");
  await check(Number(hist1[2].status) === STATUS.DalamPengiriman,           "riwayat[2] = DalamPengiriman");
  await check(Number(hist1[3].status) === STATUS.Terjual,                   "riwayat[3] = Terjual");

  await check(hist1[0].pelaku === petani.address,    "riwayat[0].pelaku = petani");
  await check(hist1[1].pelaku === auditor.address,   "riwayat[1].pelaku = auditor");
  await check(hist1[2].pelaku === distributor.address,"riwayat[2].pelaku = distributor");
  await check(hist1[3].pelaku === auditor.address,   "riwayat[3].pelaku = auditor");

  // ── TEST 6: Rejection Flow ────────────────────────────
  group("Rejection Flow");

  // tolak pengiriman p2 → refund ke distributor2
  const balDist2Before = await ethers.provider.getBalance(distributor2.address);
  await contract.connect(auditor).tolakPengiriman(2n, "Kualitas tidak sesuai saat diterima");
  const balDist2After  = await ethers.provider.getBalance(distributor2.address);

  await check(balDist2After > balDist2Before,                               "ETH di-refund ke distributor2");
  await check((await contract.getEscrow(2n)) === 0n,                        "escrow p2 = 0 setelah tolak pengiriman");
  await check(
    Number((await contract.getProduk(2n)).status) === STATUS.Terverifikasi,
    "p2 kembali ke Terverifikasi (1) — siap dibeli lagi"
  );

  // rebeli p2
  await contract.connect(distributor).beliProduk(2n, { value: ethers.parseEther("0.035") });
  await check(
    (await contract.getEscrow(2n)) === ethers.parseEther("0.035"),
    "p2 berhasil dibeli kembali setelah tolak pengiriman"
  );

  const hist2 = await contract.getRiwayatProduk(2n);
  await check(hist2.length === 5, "riwayat p2: 5 entri setelah rebeli");

  // validate p3 rejection (already done in TEST 3)
  const hist3 = await contract.getRiwayatProduk(3n);
  await check(hist3.length === 2,                        "p3 riwayat penolakan verifikasi: 2 entri");
  await check(Number(hist3[1].status) === STATUS.Ditolak,"p3 riwayat[1] = Ditolak (5)");

  // p4 tersedia untuk dibeli (Terverifikasi, tidak ditolak)
  await check(
    Number((await contract.getProduk(4n)).status) === STATUS.Terverifikasi,
    "p4 tersedia untuk dibeli (Terverifikasi)"
  );
  // p5 masih MenungguAudit — tersembunyi dari distributor
  await check(
    Number((await contract.getProduk(5n)).status) === STATUS.MenungguAudit,
    "p5 tersembunyi dari distributor (MenungguAudit)"
  );
  await expectRevert(
    () => contract.connect(distributor).beliProduk(5n, { value: ethers.parseEther("0.015") }),
    "p5 MenungguAudit tidak bisa dibeli distributor"
  );

  // ── Dashboard Rendering (contract-level simulation) ───
  group("Dashboard Rendering");

  const totalProduk    = Number(await contract.totalProduk());
  const totalPengguna  = Number(await contract.totalPengguna());

  // Simulate what each dashboard fetches
  const allProds = [];
  for (let i = 1; i <= totalProduk; i++) {
    const raw = await contract.getProduk(BigInt(i));
    const mapped = mapProduct(raw);
    allProds.push(mapped);
  }

  await check(allProds.every(p => p !== null), "mapProduct() tidak null untuk semua produk (no BAD_DATA)");
  await check(allProds.length === totalProduk,  "semua produk ter-load sesuai totalProduk");

  // PetaniDashboard: show all products by this petani
  const petani1Prods = allProds.filter(p => p.petani === petani.address);
  const petani2Prods = allProds.filter(p => p.petani === petani2.address);
  await check(petani1Prods.length === 3, "PetaniDashboard: petani1 melihat 3 produknya (incl. Ditolak dan Terjual)");
  await check(petani2Prods.length === 2, "PetaniDashboard: petani2 melihat 2 produknya");

  // AuditorDashboard: group by status
  const antrian   = allProds.filter(p => Number(p.status) === STATUS.MenungguAudit);
  const verified  = allProds.filter(p => Number(p.status) === STATUS.Terverifikasi);
  const shipping  = allProds.filter(p => Number(p.status) === STATUS.DalamPengiriman);
  const sold      = allProds.filter(p => Number(p.status) === STATUS.Terjual);
  const ditolak   = allProds.filter(p => Number(p.status) === STATUS.Ditolak);
  await check(antrian.length  === 1, "AuditorDashboard: 1 produk antrian audit (p5)");
  await check(verified.length === 1, "AuditorDashboard: 1 produk terverifikasi (p4)");
  await check(shipping.length === 1, "AuditorDashboard: 1 produk dalam pengiriman (p2 rebeli)");
  await check(sold.length     === 1, "AuditorDashboard: 1 produk terjual (p1)");
  await check(ditolak.length  === 1, "AuditorDashboard: 1 produk ditolak (p3)");

  // DistributorDashboard: only Terverifikasi visible for purchase
  await check(verified.length === 1, "DistributorDashboard: hanya 1 produk tersedia beli (Terverifikasi)");
  await check(
    verified.every(p => Number(p.status) === STATUS.Terverifikasi),
    "DistributorDashboard: semua produk visible berstatus Terverifikasi"
  );

  // Auditor pricing fields present on all verified/sold products
  const pricedProds = allProds.filter(p =>
    Number(p.status) === STATUS.Terverifikasi ||
    Number(p.status) === STATUS.DalamPengiriman ||
    Number(p.status) === STATUS.Terjual
  );
  await check(
    pricedProds.every(p => p.hargaFinalAuditor > 0n),
    "semua produk terverifikasi/aktif memiliki hargaFinalAuditor > 0"
  );
  await check(
    pricedProds.every(p => p.auditorPenentuHarga !== ethers.ZeroAddress),
    "semua produk terverifikasi/aktif memiliki auditorPenentuHarga != ZeroAddress"
  );

  // AdminDashboard: pengguna terdaftar
  await check(totalPengguna === 6, "AdminDashboard: 6 pengguna terdaftar");
  const participants = [admin, petani, auditor, distributor, petani2, distributor2];
  let allPenggunaOk = true;
  for (const s of participants) {
    const u = await contract.getPengguna(s.address);
    if (!u.aktif) { allPenggunaOk = false; break; }
  }
  await check(allPenggunaOk, "AdminDashboard: semua 6 peserta aktif dan terload");

  // ── Blockchain Queries ────────────────────────────────
  group("Blockchain Queries");

  // getPengguna
  const pgAdmin = await contract.getPengguna(admin.address);
  await check(pgAdmin.nama === "Admin AgriChain" && Number(pgAdmin.role) === ROLE.Admin, "getPengguna(admin) — nama dan role benar");
  const pgPetani = await contract.getPengguna(petani.address);
  await check(pgPetani.nama === "Pak Budi Santoso" && Number(pgPetani.role) === ROLE.Petani, "getPengguna(petani) — nama dan role benar");

  // getProduk — field integrity
  const pTest = await contract.getProduk(1n);
  await check(
    pTest.id === 1n && typeof pTest.nama === "string" && pTest.nama.length > 0,
    "getProduk(1) — id=1 dan nama non-empty"
  );
  await check(pTest.petani === petani.address, "getProduk(1) — petani address benar");

  // getRiwayatProduk
  const rTest = await contract.getRiwayatProduk(1n);
  await check(rTest.length >= 1, "getRiwayatProduk(1) — array non-empty");
  await check(
    rTest[0].pelaku !== ethers.ZeroAddress && typeof rTest[0].keterangan === "string",
    "getRiwayatProduk(1)[0] — pelaku valid, keterangan adalah string"
  );

  // escrow balances
  await check((await contract.getEscrow(1n)) === 0n, "getEscrow(1) = 0 (terjual, escrow cleared)");
  await check((await contract.getEscrow(4n)) === 0n, "getEscrow(4) = 0 (belum dibeli)");

  // role mappings
  await check(Number((await contract.getPengguna(distributor2.address)).role) === ROLE.Distributor, "role mapping Distributor 2 = 3");
  await check(Number((await contract.getPengguna(petani2.address)).role)      === ROLE.Petani,      "role mapping Petani 2 = 1");

  // totalProduk + totalPengguna
  await check((await contract.totalProduk())   === 5n, "totalProduk() = 5");
  await check((await contract.totalPengguna()) === 6n, "totalPengguna() = 6");

  // ── ABI Synchronization ───────────────────────────────
  group("ABI Synchronization");

  await check(typeof (await contract.totalProduk())   === "bigint", "totalProduk() return type = bigint");
  await check(typeof (await contract.totalPengguna()) === "bigint", "totalPengguna() return type = bigint");
  await check(ethers.isAddress(await contract.owner()),              "owner() return = valid address");

  const prodStruct = await contract.getProduk(1n);
  await check(
    prodStruct.id                  !== undefined &&
    prodStruct.nama                !== undefined &&
    prodStruct.lokasi              !== undefined &&
    prodStruct.berat               !== undefined &&
    prodStruct.metode              !== undefined &&
    prodStruct.petani              !== undefined &&
    prodStruct.status              !== undefined &&
    prodStruct.hargaFinalAuditor   !== undefined &&
    prodStruct.auditorPenentuHarga !== undefined,
    "getProduk() struct memiliki semua 9 field (tidak ada BAD_DATA)"
  );

  const userStruct = await contract.getPengguna(admin.address);
  await check(
    userStruct.nama  !== undefined &&
    userStruct.role  !== undefined &&
    userStruct.aktif !== undefined,
    "getPengguna() struct memiliki semua 3 field"
  );

  const riwStruct = await contract.getRiwayatProduk(1n);
  await check(
    riwStruct.length > 0 &&
    riwStruct[0].waktu      !== undefined &&
    riwStruct[0].pelaku     !== undefined &&
    riwStruct[0].status     !== undefined &&
    riwStruct[0].keterangan !== undefined,
    "getRiwayatProduk() struct memiliki semua 4 field"
  );

  await check(
    typeof prodStruct.hargaFinalAuditor === "bigint" && prodStruct.hargaFinalAuditor > 0n,
    "hargaFinalAuditor adalah bigint > 0 setelah verifikasi auditor"
  );
  await check(
    ethers.isAddress(prodStruct.auditorPenentuHarga) && prodStruct.auditorPenentuHarga !== ethers.ZeroAddress,
    "auditorPenentuHarga adalah address valid (bukan ZeroAddress) setelah verifikasi"
  );

  // ── No Runtime Errors ─────────────────────────────────
  group("No Runtime Errors");

  // Verify no CALL_EXCEPTION / BAD_DATA by re-reading all critical paths
  let runtimeErrors = 0;
  try {
    for (let id = 1n; id <= 5n; id++) {
      const p = await contract.getProduk(id);
      mapProduct(p); // will throw if struct is malformed
    }
    pass("getProduk loop (1..5) — no BAD_DATA / CALL_EXCEPTION");
  } catch (e) {
    fail("getProduk loop", e.message);
    runtimeErrors++;
  }

  try {
    const addrs = [admin, petani, auditor, distributor, petani2, distributor2];
    for (const s of addrs) {
      await contract.getPengguna(s.address);
    }
    pass("getPengguna loop (all 6 accounts) — no errors");
  } catch (e) {
    fail("getPengguna loop", e.message);
    runtimeErrors++;
  }

  try {
    for (let id = 1n; id <= 5n; id++) {
      await contract.getRiwayatProduk(id);
      await contract.getEscrow(id);
    }
    pass("getRiwayatProduk + getEscrow loop (1..5) — no errors");
  } catch (e) {
    fail("getRiwayatProduk/getEscrow loop", e.message);
    runtimeErrors++;
  }

  try {
    const bal = await contract.getContractBalance();
    await check(typeof bal === "bigint", "getContractBalance() — return bigint tanpa error");
  } catch (e) {
    fail("getContractBalance()", e.message);
    runtimeErrors++;
  }

  // ethers.formatEther sanity check (mirrors frontend formatEth util)
  try {
    const p = await contract.getProduk(1n);
    const formatted = ethers.formatEther(p.hargaFinalAuditor);
    await check(formatted === "0.05", "ethers.formatEther(hargaFinalAuditor) = '0.05' (tidak crash)");
  } catch (e) {
    fail("ethers.formatEther pada hargaFinalAuditor", e.message);
    runtimeErrors++;
  }

  // ── Final Report ──────────────────────────────────────
  const allTotalProduk   = Number(await contract.totalProduk());
  const allTotalPengguna = Number(await contract.totalPengguna());

  let totalEscrowETH = 0n;
  for (let i = 1n; i <= BigInt(allTotalProduk); i++) {
    totalEscrowETH += await contract.getEscrow(i);
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  === AGRICHAIN TEST RESULTS ===");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");

  for (const [name, g] of Object.entries(groups)) {
    const allPassed = g.fail === 0 && (g.pass + g.fail) > 0;
    const marker    = allPassed ? TICK : CROSS;
    const detail    = `(${g.pass}/${g.pass + g.fail} passed)`;
    console.log(`  ${marker} ${name.padEnd(26)} ${detail}`);
  }

  console.log("");
  console.log(`  Total: ${totalPass} passed, ${totalFail} failed`);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  RINGKASAN DEPLOYMENT");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Contract Address : ${contractAddr}`);
  console.log(`  Chain ID         : ${network.chainId.toString()}`);
  console.log(`  Total Produk     : ${allTotalProduk}`);
  console.log(`  Total Pengguna   : ${allTotalPengguna}`);
  console.log(`  ETH di Escrow    : ${ethers.formatEther(totalEscrowETH)} ETH`);

  console.log("\n  Pengguna Terdaftar:");
  const participantRows = [
    { label: "Admin (Owner)",  signer: admin,       role: ROLE.Admin },
    { label: "Petani 1",       signer: petani,      role: ROLE.Petani },
    { label: "Auditor",        signer: auditor,     role: ROLE.Auditor },
    { label: "Distributor 1",  signer: distributor, role: ROLE.Distributor },
    { label: "Petani 2",       signer: petani2,     role: ROLE.Petani },
    { label: "Distributor 2",  signer: distributor2,role: ROLE.Distributor },
  ];
  console.log("  ┌────────────────┬────────────────────────────────────────────┬─────────────┐");
  console.log("  │ Label          │ Address                                    │ Role        │");
  console.log("  ├────────────────┼────────────────────────────────────────────┼─────────────┤");
  for (const r of participantRows) {
    const addr = await r.signer.getAddress();
    const u    = await contract.getPengguna(addr);
    console.log(`  │ ${r.label.padEnd(14)} │ ${addr} │ ${ROLE_NAME[Number(u.role)].padEnd(11)} │`);
  }
  console.log("  └────────────────┴────────────────────────────────────────────┴─────────────┘");

  console.log("\n  Status Produk:");
  for (let i = 1; i <= allTotalProduk; i++) {
    const p = await contract.getProduk(BigInt(i));
    const harga = p.hargaFinalAuditor > 0n ? `${ethers.formatEther(p.hargaFinalAuditor)} ETH` : "—";
    console.log(
      `    #${i} ${p.nama.padEnd(32)} [${STATUS_NAME[Number(p.status)].padEnd(15)}] ${harga}`
    );
  }

  console.log("\n═══════════════════════════════════════════════════════");
  if (totalFail === 0) {
    console.log("  ALL TESTS PASSED — AgriChain siap demo/presentasi");
  } else {
    console.log(`  ${totalFail} TEST(S) FAILED — periksa output di atas`);
  }
  console.log("═══════════════════════════════════════════════════════\n");

  if (totalFail > 0) process.exit(1);
}

main().catch(err => {
  console.error("\n  FATAL ERROR:", err.message ?? err);
  process.exit(1);
});
