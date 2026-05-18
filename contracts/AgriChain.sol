// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriChain {

    enum Role { TidakTerdaftar, Petani, Auditor, Distributor, Admin }
    enum Status { Didaftarkan, Terverifikasi, DalamPengiriman, DiDistributor, Terjual }

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
        uint256 hargaWei;
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

    event PenggunaTerdaftar(address alamat, string nama, Role role);
    event ProdukDidaftarkan(uint256 id, string nama, address petani);
    event ProdukDiverifikasi(uint256 id, address auditor);
    event ETHDikunci(uint256 id, address pembeli, uint256 nilai);
    event ETHDicairkan(uint256 id, address petani, uint256 nilai);
    event ETHDiRefund(uint256 id, address pembeli, uint256 nilai);

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

    // ── PRODUK ────────────────────────────────────────────
    function daftarkanProduk(
        string memory _nama,
        string memory _lokasi,
        uint256 _berat,
        string memory _metode,
        uint256 _hargaWei
    ) public hanyaPetani returns (uint256) {
        require(bytes(_nama).length > 0, "AgriChain: Nama tidak boleh kosong");
        require(_berat > 0, "AgriChain: Berat harus > 0");
        require(_hargaWei > 0, "AgriChain: Harga harus > 0");
        totalProduk++;
        produk[totalProduk] = Produk(totalProduk, _nama, _lokasi, _berat, _metode, msg.sender, Status.Didaftarkan, _hargaWei);
        riwayat[totalProduk].push(Riwayat(block.timestamp, msg.sender, Status.Didaftarkan, "Produk didaftarkan petani"));
        emit ProdukDidaftarkan(totalProduk, _nama, msg.sender);
        return totalProduk;
    }

    // ── VERIFIKASI ────────────────────────────────────────
    function verifikasiProduk(uint256 _id, string memory _catatan) public hanyaAuditor {
        require(produk[_id].status == Status.Didaftarkan, "AgriChain: Harus berstatus Didaftarkan");
        produk[_id].status = Status.Terverifikasi;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Terverifikasi, _catatan));
        emit ProdukDiverifikasi(_id, msg.sender);
    }

    // ── ESCROW: BELI ──────────────────────────────────────
    function beliProduk(uint256 _id) public payable hanyaDistributor {
        require(produk[_id].status == Status.Terverifikasi, "AgriChain: Belum terverifikasi");
        require(escrow[_id] == 0, "AgriChain: Sudah ada escrow");
        require(msg.value == produk[_id].hargaWei, "AgriChain: Nilai ETH tidak sesuai harga");
        escrow[_id] = msg.value;
        pembeli[_id] = msg.sender;
        produk[_id].status = Status.DalamPengiriman;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.DalamPengiriman, "ETH dikunci di escrow"));
        emit ETHDikunci(_id, msg.sender, msg.value);
    }

    // ── ESCROW: KONFIRMASI ────────────────────────────────
    function konfirmasiPenerimaan(uint256 _id, string memory _catatan) public hanyaAuditor {
        require(escrow[_id] > 0, "AgriChain: Tidak ada escrow");
        uint256 nilai = escrow[_id];
        address petaniAddr = produk[_id].petani;
        escrow[_id] = 0;
        produk[_id].status = Status.Terjual;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Terjual, _catatan));
        (bool ok,) = payable(petaniAddr).call{value: nilai}("");
        require(ok, "AgriChain: Transfer gagal");
        emit ETHDicairkan(_id, petaniAddr, nilai);
    }

    // ── ESCROW: TOLAK ─────────────────────────────────────
    function tolakProduk(uint256 _id, string memory _alasan) public hanyaAuditor {
        require(escrow[_id] > 0, "AgriChain: Tidak ada escrow");
        uint256 nilai = escrow[_id];
        address pembeliAddr = pembeli[_id];
        escrow[_id] = 0;
        produk[_id].status = Status.Terverifikasi;
        riwayat[_id].push(Riwayat(block.timestamp, msg.sender, Status.Terverifikasi, string(abi.encodePacked("DITOLAK: ", _alasan))));
        (bool ok,) = payable(pembeliAddr).call{value: nilai}("");
        require(ok, "AgriChain: Refund gagal");
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
