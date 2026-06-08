// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriChain {

    enum Role { TidakTerdaftar, Petani, Auditor, Distributor, Admin }
    enum Status {
        MenungguAudit,   // 0 - Baru didaftarkan, menunggu auditor
        Terverifikasi,   // 1 - Diverifikasi auditor + harga ditetapkan, siap dijual
        DalamPengiriman, // 2 - ETH terkunci di escrow
        DiDistributor,   // 3 - (legacy, tidak digunakan)
        Terjual,         // 4 - ETH dicairkan ke petani
        Ditolak          // 5 - Ditolak auditor
    }

    struct Pengguna {
        string nama;
        Role role;
        bool aktif;
    }

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

    struct Riwayat {
        uint256 waktu;
        address pelaku;
        Status status;
        string keterangan;
    }

    address public owner;
    uint256 public totalProduk;
    uint256 public totalPengguna;

    mapping(address => Pengguna) public pengguna;
    mapping(uint256 => Produk) public produk;
    mapping(uint256 => Riwayat[]) public riwayat;
    mapping(uint256 => uint256) public escrow;
    mapping(uint256 => address) public pembeli;

    event PenggunaTerdaftar(address indexed alamat, string nama, Role role);
    event ProdukDidaftarkan(uint256 indexed id, string nama, address indexed petani);
    event ProdukDiverifikasi(uint256 indexed id, address indexed auditor, uint256 harga);
    event ProdukDitolak(uint256 indexed id, address indexed auditor, string catatan);
    event ETHDikunci(uint256 indexed id, address indexed pembeli, uint256 nilai);
    event ETHDicairkan(uint256 indexed id, address indexed petani, uint256 nilai);
    event ETHDiRefund(uint256 indexed id, address indexed pembeli, uint256 nilai);

    modifier hanyaAdmin() {
        require(pengguna[msg.sender].role == Role.Admin, "AgriChain: Hanya admin");
        _;
    }
    modifier hanyaAuditor() {
        require(pengguna[msg.sender].role == Role.Auditor, "AgriChain: Hanya auditor");
        _;
    }
    modifier hanyaPetani() {
        require(pengguna[msg.sender].role == Role.Petani, "AgriChain: Hanya petani terdaftar");
        _;
    }
    modifier hanyaDistributor() {
        require(pengguna[msg.sender].role == Role.Distributor, "AgriChain: Hanya distributor");
        _;
    }

    constructor() {
        owner = msg.sender;
        pengguna[msg.sender] = Pengguna("Admin AgriChain", Role.Admin, true);
        totalPengguna = 1;
    }

    // ── PENGGUNA ──────────────────────────────────────────
    function daftarkanPengguna(address _alamat, string memory _nama, Role _role) public hanyaAdmin {
        require(_alamat != address(0), "AgriChain: Alamat tidak valid");
        require(bytes(_nama).length > 0, "AgriChain: Nama tidak boleh kosong");
        require(pengguna[_alamat].role == Role.TidakTerdaftar, "AgriChain: Sudah terdaftar");
        pengguna[_alamat] = Pengguna(_nama, _role, true);
        totalPengguna++;
        emit PenggunaTerdaftar(_alamat, _nama, _role);
    }

    // ── DAFTARKAN PRODUK (harga ditetapkan oleh auditor saat verifikasi) ─
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
            Status.MenungguAudit,
            0,
            address(0)
        );
        riwayat[totalProduk].push(Riwayat(
            block.timestamp, msg.sender, Status.MenungguAudit,
            "Produk didaftarkan, menunggu audit"
        ));
        emit ProdukDidaftarkan(totalProduk, _nama, msg.sender);
        return totalProduk;
    }

    // ── VERIFIKASI + TETAPKAN HARGA (auditor) ────────────
    function verifikasiDanTentukanHarga(
        uint256 _id,
        uint256 _hargaFinal,
        string memory _catatan
    ) public hanyaAuditor {
        require(produk[_id].status == Status.MenungguAudit, "AgriChain: Harus berstatus MenungguAudit");
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

    // ── TOLAK VERIFIKASI (auditor) ────────────────────────
    function tolakProduk(uint256 _id, string memory _catatan) public hanyaAuditor {
        require(produk[_id].status == Status.MenungguAudit, "AgriChain: Harus berstatus MenungguAudit untuk ditolak");
        require(bytes(_catatan).length > 0, "AgriChain: Alasan penolakan tidak boleh kosong");
        produk[_id].status = Status.Ditolak;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Ditolak, _catatan));
        emit ProdukDitolak(_id, msg.sender, _catatan);
    }

    // ── ESCROW: BELI ──────────────────────────────────────
    function beliProduk(uint256 _id) public payable hanyaDistributor {
        require(produk[_id].status == Status.Terverifikasi, "AgriChain: Produk harus berstatus Terverifikasi");
        require(escrow[_id] == 0, "AgriChain: Sudah ada escrow aktif untuk produk ini");
        require(msg.value == produk[_id].hargaFinalAuditor, "AgriChain: Nilai ETH tidak sesuai harga produk");
        escrow[_id] = msg.value;
        pembeli[_id] = msg.sender;
        produk[_id].status = Status.DalamPengiriman;
        riwayat[_id].push(Riwayat(
            block.timestamp, msg.sender, Status.DalamPengiriman,
            "Dibeli - ETH dikunci di escrow"
        ));
        emit ETHDikunci(_id, msg.sender, msg.value);
    }

    // ── ESCROW: KONFIRMASI PENERIMAAN (auditor) ───────────
    function konfirmasiPenerimaan(uint256 _id, string memory _catatan) public hanyaAuditor {
        require(escrow[_id] > 0, "AgriChain: Tidak ada escrow aktif untuk produk ini");
        uint256 nilai = escrow[_id];
        address petaniAddr = produk[_id].petani;
        escrow[_id] = 0;
        produk[_id].status = Status.Terjual;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Terjual, _catatan));
        (bool ok,) = payable(petaniAddr).call{value: nilai}("");
        require(ok, "AgriChain: Transfer ke petani gagal");
        emit ETHDicairkan(_id, petaniAddr, nilai);
    }

    // ── ESCROW: TOLAK PENGIRIMAN (auditor) ────────────────
    function tolakPengiriman(uint256 _id, string memory _alasan) public hanyaAuditor {
        require(escrow[_id] > 0, "AgriChain: Tidak ada escrow aktif untuk produk ini");
        uint256 nilai = escrow[_id];
        address pembeliAddr = pembeli[_id];
        escrow[_id] = 0;
        produk[_id].status = Status.Terverifikasi;
        riwayat[_id].push(Riwayat(
            block.timestamp, msg.sender, Status.Ditolak,
            string(abi.encodePacked("Pengiriman ditolak: ", _alasan))
        ));
        (bool ok,) = payable(pembeliAddr).call{value: nilai}("");
        require(ok, "AgriChain: Refund ke distributor gagal");
        emit ETHDiRefund(_id, pembeliAddr, nilai);
    }

    // ── READ ──────────────────────────────────────────────
    function getPengguna(address _alamat) public view returns (Pengguna memory) { return pengguna[_alamat]; }
    function getProduk(uint256 _id) public view returns (Produk memory) { return produk[_id]; }
    function getRiwayatProduk(uint256 _id) public view returns (Riwayat[] memory) { return riwayat[_id]; }
    function getTotalRiwayat(uint256 _id) public view returns (uint256) { return riwayat[_id].length; }
    function getEscrow(uint256 _id) public view returns (uint256) { return escrow[_id]; }
    function getContractBalance() public view returns (uint256) { return address(this).balance; }
}
