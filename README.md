# Buku Pintar Vibe Coder

Landing page untuk **Buku Pintar Vibe Coder — Edisi 1**, karya Ferry. eBook tersedia gratis sebagai PDF dan EPUB.

## Struktur

- **index.html** — konten, SEO, navigasi, tautan unduhan.
- **css/site.css** — design tokens, dark mode, responsivitas, motion.
- **js/site.js** — toggle tema, scroll progress, reveal ringan.
- **sampul.png** — gambar sampul asli, dipertahankan.
- **Buku_Pintar_Vibe_Coder_Edisi1.pdf** dan **Buku_Pintar_Vibe_Coder_Edisi1.epub** — file eBook asli, dipertahankan.
- **tests/site.test.cjs** — pemeriksaan integritas konten, aksesibilitas dasar, dan file unduhan.

## Dasar desain

Proyek mengadopsi [Linggau Design System V1.2](https://docs.google.com/document/d/1mKuw7ztdgixwH71shkifZxM8D_2SWTgf2WSpNiBykz8/edit) — prinsip **Clean · Human · Alive**.

| Keputusan | Penyesuaian untuk eBook |
| --- | --- |
| ADOPT | White space, Geist, Plus Jakarta Sans, Instrument Serif sebagai aksen editorial, palet netral, pastel lembut, komponen modern |
| ADAPT | Hero editorial dengan sampul asli, daftar bahasan, label bukti, dan dua opsi unduhan |
| OMIT | Ring 3D, karakter Canvas, Matter.js, dashboard atau CMS yang tidak diperlukan landing unduhan |
| PRESERVE | Naskah substantif halaman, metadata edisi/versi, tiga label pembuktian, file buku, dan disclaimer |

Warna utama: paper #FAFAFC, ink #15161C, sun #FFD25E, sky #5EC4FF, lilac #B9A3FF. Mode gelap opsional disimpan lokal pada browser; tidak ada analytics atau cookie tracking.

Motion mengikuti tingkat **M1 — Subtle**: hover sampul, feedback tombol, scroll reveal dan indikator progres. Animasi menghormati reduced motion. Buku tetap dapat diunduh saat JavaScript tidak berjalan.

## Cara mengubah

1. Edit teks, metadata, atau tautan PDF/EPUB di **index.html** lewat GitHub Web.
2. Edit warna, ukuran, spacing, dan animasi di **css/site.css**.
3. Ganti gambar sampul dengan mengunggah aset baru, lalu sesuaikan sumber gambar di HTML. Jangan menimpa gambar lama jika dibutuhkan untuk rollback.
4. Saat menerbitkan edisi baru, unggah PDF/EPUB baru dan perbarui semua link serta metadata edisi/tanggal yang relevan.
5. Commit ke repository; GitHub Pages menerbitkan sesuai konfigurasi deployment repository.

Tidak memerlukan Vercel, server database, maupun Node build step. Font diambil dari Google Fonts dengan fallback sistem.

## Pemeriksaan

GitHub Actions menjalankan pemeriksaan sintaks JavaScript dan tes source pada **tests/site.test.cjs**. Tes ini menjaga file unduhan, konten awal, semantik halaman, anchor, dan tokens desain.

**Batas verifikasi:** CI bukan pengganti inspeksi visual di browser nyata, uji download langsung, ataupun Lighthouse/performa Android. Laporkan pengujian tersebut secara terpisah.

## Perubahan versi desain

Versi landing lama: halaman krem/merah tua, Georgia/Fraunces, satu kolom, download sederhana.

Versi editorial Linggau: halaman terang, hero dua kolom di desktop, sampul lebih dominan, area baca bertahap, label bukti yang jelas, CTA unduh atas/bawah, dan pengalaman mobile yang lebih rapi. Seluruh materi unduhan lama tetap utuh.
