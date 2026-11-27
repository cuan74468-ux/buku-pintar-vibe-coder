# Pustaka Digital Linggau AI Studio

Dapur Vibe Coder — Meracik Ide Menjadi Produk Digital Bersama AI, karya Ferry. Buku gratis Rp0, tanpa login member. Pustaka menyediakan pembaca online, PDF, EPUB, dan materi Chapter 1.

- Situs: https://cuan74468-ux.github.io/buku-pintar-vibe-coder/
- Reader: `baca.html`
- Katalog: `data/books.json`
- RSS: `feed.xml`
- Sampul buku: `Dapur_Vibe_Coder_Sampul.jpg`; mockup: `Dapur_Vibe_Coder_Mockup.jpg`.
- PDF/EPUB: `Dapur_Vibe_Coder.pdf` dan `Dapur_Vibe_Coder.epub`; nama file lama tetap tersedia sebagai alias kompatibilitas.

## QA

`node --test tests/site.test.cjs` dan workflow browser Chromium untuk desktop 1440px dan mobile 360px. Reader menggunakan EPUB lokal dan sanitasi DOM; tidak menjalankan skrip dari EPUB.

Rilis memerlukan pemeriksaan aset, unduhan, reader, tautan, CI dan Pages. Jangan menyatakan GO LIVE hanya berdasarkan commit kandidat.

## Catatan pengelola

Tanggal publikasi asli katalog dipertahankan, pembaruan metadata dicatat terpisah. Nomor versi teknis tidak ditampilkan kepada pembaca. Backup sumber lama tersedia di commit 3776a77.

## Hak cipta dan distribusi

Buku gratis untuk penggunaan pribadi. Lihat [ketentuan distribusi](HAK-CIPTA.md). Repository publik bukan pemberian lisensi komersial atas buku.
