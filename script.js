
import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// KONFIGURASI SUPABASE
const SUPABASE_URL = "MASUKKAN_URL_SUPABASE";
const SUPABASE_KEY = "MASUKKAN_PUBLISHABLE_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("formKasir");
const idInput = document.getElementById("id_kasir");
const namaInput = document.getElementById("nama_makanan");
const hargaInput = document.getElementById("harga");
const daftar = document.getElementById("daftarMakanan");
const pesan = document.getElementById("pesan");

let semuaData = [];

document.getElementById("tanggal").textContent =
    new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

function rupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);
}

function tampilPesan(teks, gagal = false) {
    pesan.textContent = teks;
    pesan.style.color = gagal ? "red" : "green";
}

// SELECT
async function tampilkanData() {
    daftar.innerHTML =
        '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabase
        .from("kasir")
        .select("*")
        .order("id_kasir", { ascending: true });

    if (error) {
        daftar.innerHTML =
            `<tr><td colspan="4">Gagal: ${error.message}</td></tr>`;
        return;
    }

    semuaData = data;
    tampilkanTabel(data);
    hitungStatistik();
}

// MENAMPILKAN TABEL
function tampilkanTabel(data) {
    daftar.innerHTML = "";

    if (!data.length) {
        daftar.innerHTML =
            '<tr><td colspan="4">Belum ada data makanan.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement("tr");

        const id = document.createElement("td");
        id.textContent = item.id_kasir;

        const nama = document.createElement("td");
        nama.textContent = item.nama_makanan;

        const harga = document.createElement("td");
        harga.textContent = rupiah(item.harga);

        const aksi = document.createElement("td");

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.className = "btn-edit";
        edit.addEventListener("click", () => editData(item));

        const hapus = document.createElement("button");
        hapus.textContent = "Hapus";
        hapus.className = "btn-delete";
        hapus.addEventListener("click", () => hapusData(item.id_kasir));

        aksi.append(edit, hapus);
        tr.append(id, nama, harga, aksi);

        daftar.appendChild(tr);
    });
}

// INSERT DAN UPDATE
form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const id = idInput.value;
    const nama = namaInput.value.trim();
    const harga = Number(hargaInput.value);

    if (!nama || !Number.isFinite(harga) || harga <= 0) {
        tampilPesan("Isi nama dan harga dengan benar.", true);
        return;
    }

    const tombol = document.getElementById("btnSimpan");
    tombol.disabled = true;

    let result;

    if (id) {
        // UPDATE
        result = await supabase
            .from("kasir")
            .update({
                nama_makanan: nama,
                harga: harga
            })
            .eq("id_kasir", id);
    } else {
        // INSERT
        result = await supabase
            .from("kasir")
            .insert([{
                nama_makanan: nama,
                harga: harga
            }]);
    }

    tombol.disabled = false;

    if (result.error) {
        tampilPesan("Gagal: " + result.error.message, true);
        return;
    }

    tampilPesan(id
        ? "Data berhasil diperbarui!"
        : "Makanan berhasil ditambahkan!");

    resetForm();
    await tampilkanData();
});

// EDIT
function editData(item) {
    idInput.value = item.id_kasir;
    namaInput.value = item.nama_makanan;
    hargaInput.value = item.harga;

    document.getElementById("judulForm").textContent = "Edit Makanan";
    document.getElementById("btnSimpan").textContent = "Simpan Perubahan";
    document.getElementById("btnBatal").hidden = false;

    document.querySelector(".form-card").scrollIntoView({
        behavior: "smooth"
    });
}

// RESET FORM
function resetForm() {
    form.reset();
    idInput.value = "";

    document.getElementById("judulForm").textContent = "Tambah Makanan";
    document.getElementById("btnSimpan").textContent = "+ Tambah Makanan";
    document.getElementById("btnBatal").hidden = true;
}

// BATAL EDIT
document.getElementById("btnBatal").addEventListener("click", () => {
    resetForm();
    tampilPesan("Edit dibatalkan.");
});

// DELETE
async function hapusData(id) {
    const yakin = confirm("Apakah kamu yakin ingin menghapus makanan ini?");

    if (!yakin) return;

    const { error } = await supabase
        .from("kasir")
        .delete()
        .eq("id_kasir", id);

    if (error) {
        tampilPesan("Gagal menghapus: " + error.message, true);
        return;
    }

    tampilPesan("Data berhasil dihapus!");
    await tampilkanData();
}

// PENCARIAN
document.getElementById("pencarian").addEventListener("input", function() {
    const kata = this.value.toLowerCase();

    const hasil = semuaData.filter(item =>
        item.nama_makanan.toLowerCase().includes(kata) ||
        String(item.id_kasir).includes(kata)
    );

    tampilkanTabel(hasil);
});

// STATISTIK
function hitungStatistik() {
    document.getElementById("jumlahMenu").textContent =
        semuaData.length;

    const total = semuaData.reduce(
        (jumlah, item) => jumlah + Number(item.harga), 0
    );

    document.getElementById("totalHarga").textContent =
        rupiah(total);
}

// JALANKAN WEBSITE
tampilkanData();
