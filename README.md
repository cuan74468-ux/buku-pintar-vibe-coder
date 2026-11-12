# Pustaka eBook Linggau AI Studio

Katalog eBook gratis karya Ferry. Halaman utama kini menjadi **perpustakaan yang dapat berkembang**, sedangkan *Buku Pintar Vibe Coder — Edisi 1* dipertahankan sebagai halaman detail tersendiri.

**Website:** https://cuan74468-ux.github.io/buku-pintar-vibe-coder/

## Struktur

- `index.html` — beranda katalog, status rilis pekan ini, dan tombol berbagi.
- `buku-pintar-vibe-coder-edisi-1.html` — detail eBook pertama, materi, label bukti dan tautan unduhan asli.
- `data/books.json` — **satu file data katalog**. Menambah buku cukup lewat GitHub Web.
- `js/library.js` — katalog dinamis dan status Senin–Minggu (WIB), pencarian muncul untuk 4+ buku.
- `css/site.css` / `js/site.js` — desain Linggau, dark mode, scroll progress, responsif.
- `feed.xml` — RSS untuk mengikuti rilis; diperbarui manual saat buku baru terbit.
- `sampul.png`, `Buku_Pintar_Vibe_Coder_Edisi1.pdf` dan `Buku_Pintar_Vibe_Coder_Edisi1.epub` — file asli, tidak dihapus.
- `tests/site.test.cjs` — pengujian file, data, keamanan dan logika pekan.

**Tanpa Vercel, database, Google Apps Script, langganan, atau Node build step.** GitHub Pages saja cukup.

## Cara menambahkan eBook kedua lewat GitHub Web

1. Siapkan sampul (misalnya `sampul-buku-02.webp`) dan berkas PDF (`buku-02.pdf`). EPUB boleh opsional.
2. Di repository pilih **Add file → Upload files**. Unggah file di root atau subfolder. Catat path relatifnya dan commit.
3. Buka `data/books.json` → **Edit this file** (ikon pensil).
4. Dalam array `books`, tambahkan objek buku baru setelah objek lama (pisahkan dengan koma). Contoh berikut **hanya ilustrasi**, bukan buku yang sudah diumumkan:

~~~json
{
  "id": "buku-kedua",
  "title": "Judul Buku Kedua",
  "subtitle": "Kalimat pendek yang menjelaskan isi.",
  "summary": "Ringkasan singkat.",
  "author": "Ferry",
  "category": "Panduan Praktis",
  "edition": "Edisi 1",
  "publishedAt": "2026-12-01",
  "status": "draft",
  "cover": "sampul-buku-02.webp",
  "detailUrl": "",
  "downloads": {
    "pdf": "buku-02.pdf",
    "epub": ""
  }
}
~~~

5. Simpan dahulu dengan `"status": "draft"`. Buku draft **tidak ditampilkan** pada publik.
6. Ketika buku dan file sudah sungguh-sungguh siap, ubah status menjadi `"published"`, isi `publishedAt` dengan tanggal rilis sebenarnya, dan ubah `lastUpdated` di atas file ke tanggal perbaruan. **Commit changes** ke `main`.

Jika `detailUrl` kosong (`""`), pengunjung bisa mengunduh file langsung dari kartu. **Tidak perlu membuat HTML baru.** Jika ingin detail editorial khusus seperti buku pertama, buat file detail HTML dan isi `detailUrl` dengan path file tersebut.

Buku berstatus `"scheduled"` hanya boleh digunakan jika tanggal penerbitan telah dikonfirmasi. Buku baru hanya ditampilkan jika berstatus `published` **dan** tanggal terbit tidak melewati tanggal hari ini (WIB). Jangan membuat judul/tanggal palsu untuk mengisi rak.

## Mengapa status “Minggu ini?” berubah otomatis?

Browser menghitung pekan Senin–Minggu dengan zona waktu Asia/Jakarta. Jika ada buku yang terbit pada pekan berjalan, pengumumannya otomatis tampil. Jika belum, pengunjung melihat pesan “Belum ada eBook baru yang diumumkan untuk pekan ini”. Tanggal tinjauan terakhir katalog juga terlihat.

**Tidak berarti buku terbit otomatis.** Pemilik repository tetap harus mengunggah buku dan memperbarui `data/books.json`. Tidak ada janji penerbitan setiap minggu, hitung mundur palsu, atau formulir email yang tidak memiliki backend.

Jika katalog JSON tidak bisa dimuat, buku pertama tetap tersedia dalam HTML statis. Status pekan ini akan dianggap belum dapat diverifikasi.

## Mengikuti rilis lewat RSS

`feed.xml` memberi pilihan bagi pembaca yang menggunakan aplikasi RSS. Saat eBook baru benar-benar terbit, tambahkan satu elemen `<item>` baru berisi judul, tautan halaman/file, GUID unik, dan deskripsi. Bila menyertakan enclosure PDF, gunakan URL serta ukuran file yang sebenarnya. RSS **tidak disinkronkan otomatis** dari JSON; file tersebut juga harus diperbarui agar pelanggan feed mendapat kabar.

## Dasar desain dan transparansi

Mengadopsi [LINGGAU DESIGN SYSTEM V1.2](https://docs.google.com/document/d/1mKuw7ztdgixwH71shkifZxM8D_2SWTgf2WSpNiBykz8/edit): **Clean · Human · Alive**, Geist, Plus Jakarta Sans, Instrument Serif, palet paper #FAFAFC, ink #15161C, sun #FFD25E, sky #5EC4FF, lilac #B9A3FF. Motion ringan dan menghormati reduced motion.

Detail buku edisi pertama tetap menyampaikan tiga label “Dipakai di lapangan”, “Contoh ilustrasi”, “Belum diuji” dan peringatan bahwa edisi pertama **belum final**. File PDF, EPUB, sampul, dan isi editorial dipertahankan.

Kode katalog menggunakan text node, bukan `innerHTML`, dan memvalidasi nama/path berkas untuk menghindari URL berbahaya. Tidak ada analytics atau pendaftaran data pribadi.

## Pemeriksaan

GitHub Actions menjalankan pengecekan sintaks, data katalog, status mingguan WIB, file unduhan, SEO dasar, dan layout source. **CI tidak menggantikan uji visual dan unduh di browser/Android**, yang masih perlu diperiksa langsung.
