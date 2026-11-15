# KinoVibes Music Player

Pemutar musik web dengan desain monokrom lembut, turntable, dan lirik tersinkron. Menggunakan React 19, Vite 7, Tailwind CSS, Zustand, Howler.js, serta Supabase untuk Auth, PostgreSQL, dan Storage.

Aplikasi publik: https://kino-vibes-music-player.vercel.app

## Musik dan batasan

- Unggah musik sendiri, kelola library, playlist, dan favorit. Unduhan hanya untuk file unggahan dari Storage yang dapat diakses pengguna.
- Pencarian YouTube memakai proxy `api/yt-search.js` dan `api/yt-suggest.js` melalui `youtubei.js`. Pemutaran memakai iframe resmi YouTube yang tetap terlihat, bukan ekstraksi audio. Tidak ada unduhan/offline YouTube atau sinkronisasi akun YouTube Music.
- Lirik berasal dari unggahan pengguna atau LRCLIB melalui `api/lyrics.js`. LRC bertimestamp mendukung sinkronisasi; teks biasa tidak memiliki timing. Ketersediaan dan kecocokan lirik bergantung pada sumbernya.
- Audio unggahan memakai streaming native browser melalui Howler HTML5. Retry playback dibatasi; cache pencarian, lirik, dan signed URL memiliki batas ukuran serta masa berlaku. Ini bukan cache audio offline dan tidak menjamin playback tanpa bandwidth yang cukup.
- Aplikasi tidak melakukan transcoding. Dukungan codec bergantung pada browser; file berbitrate tinggi membutuhkan lebih banyak bandwidth. YouTube dapat membatasi embedding, wilayah, atau autoplay.

## Pengembangan lokal

Gunakan Node.js 22.12+ dan npm, serta proyek Supabase. Di root repository, isi `.env` dengan dua variabel wajib berikut menggunakan nilai dari pengaturan API proyek Supabase:

```dotenv
VITE_SUPABASE_URL=<URL proyek Supabase>
VITE_SUPABASE_ANON_KEY=<anon/public key proyek Supabase>
```

Variabel `VITE_*` masuk ke bundle browser. Jangan gunakan service-role key, password database, atau OAuth client secret; jangan commit `.env`.

```bash
npm ci
npm run dev
```

Buka alamat yang ditampilkan Vite. `vite-plugin-api.js` melayani `/api/*` saat development; tidak perlu server Express terpisah. Setelah perubahan, jalankan pemeriksaan secara terpisah:

```bash
npm run lint
npm run build
node --experimental-vm-modules --test playback-resilience.test.mjs
```

Tes terakhir berjalan offline tanpa database atau jaringan: ia memuat modul sumber ke dalam VM dan memeriksa retry audio, pembatalan, cache signed URL/lirik, serta batas penulisan sesi. Perintah tersebut adalah instruksi, bukan laporan hasil pengujian. `npm run preview` hanya menyajikan build frontend, bukan handler API Vercel.

## Setup Supabase

**Migrasi keamanan belum divalidasi atau diterapkan pada database live.** Pemilik proyek harus meninjau SQL, memvalidasinya pada lingkungan terpisah, lalu menerapkannya sendiri. Keamanan production belum dapat dinyatakan terverifikasi.

### Proyek baru

1. Buat proyek Supabase untuk setup awal, lalu tinjau [supabase-full-schema.sql](supabase-full-schema.sql). File ini menyediakan tabel `users`, `music_library`, `albums`, `playlists`, `playlist_tracks`, `favorites`, serta bucket `music`, `album-art`, dan `lyrics`.
2. Setelah review, pemilik menjalankan schema melalui Supabase SQL Editor pada database kosong. Schema dasar masih membuat bucket publik dan kebijakan akses longgar; jangan mengisinya dengan data pribadi atau membukanya untuk pengguna sebelum hardening selesai.
3. Tinjau dan validasi [001_security_hardening.sql](supabase/migrations/001_security_hardening.sql), kemudian terapkan setelah schema. Targetnya membatasi akses berdasarkan pemilik, menjadikan audio dan lirik privat, serta mempertahankan sampul `album-art` publik. Klien menggunakan signed URL sementara untuk audio/lirik privat.

### Upgrade database yang sudah ada

Backup terlebih dahulu. Cocokkan schema live, tipe UUID pemilik, `users.id`, kebijakan yang ada, dan path Storage berbentuk `{userId}/nama-file`. Migrasi hardening bukan pembuat schema atau pemindah data lama. Tinjau dampaknya pada playlist lintas pengguna dan bucket lain yang memakai kebijakan global yang dihapus.

Jangan menjalankan ulang schema penuh sebagai perbaikan umum: policy/trigger dapat bentrok dan pengaturan bucket dapat kembali publik. [supabase-quick-setup.sql](supabase-quick-setup.sql), [supabase-storage-setup.sql](supabase-storage-setup.sql), dan [supabase_rls_policies.sql](supabase_rls_policies.sql) adalah referensi lama, bukan rangkaian upgrade. Quick setup menghapus kebijakan Storage secara luas; skrip RLS lama memakai `users.uid` dan asumsi ID teks yang berbeda.

Pemilik perlu memeriksa RLS, akses antar-akun, signed URL, serta status bucket pada database tujuan setelah penerapan.

## Auth dan callback

Aktifkan provider Email di Supabase Auth. Untuk login Google, konfigurasi OAuth client di Google Cloud dan provider Google di Supabase; simpan client secret hanya pada konfigurasi provider.

Salin callback Supabase yang ditampilkan dashboard proyek ke daftar authorized redirect URI Google. Ini berbeda dari allowlist tujuan aplikasi di Supabase **Authentication > URL Configuration**: tetapkan Site URL ke alamat production di atas dan izinkan origin aplikasi yang benar-benar digunakan, dengan `/` di akhir sesuai `redirectTo` pada `src/services/supabaseAuth.js`. Tambahkan alamat lokal/preview aktual bila diperlukan; jangan menebak callback atau mengizinkan semua domain.

Alur reset kata sandi mengirim email ke `/reset-password`, jadi tambahkan `https://<domain>/reset-password` (dan padanan lokal/preview) ke Redirect URLs. Tanpa entri itu Supabase menolak tautan reset dan pengguna tidak pernah sampai ke formulir ganti kata sandi.

## Unggah dan gunakan

Login, buka Upload, pilih audio, isi judul/artis, lalu tambahkan sampul dan lirik `.lrc` atau `.txt` bila ada. Contoh timing LRC: `[00:12.00]Baris lirik`. File masuk langsung ke Supabase Storage, bukan folder `public/`.

Schema dasar membatasi audio 50 MiB, sampul 10 MiB, dan lirik 1 MiB. Form audio menerima hingga 60 MiB, tetapi batas dan MIME bucket tetap menentukan keberhasilan upload. Gunakan file yang hak penggunaannya Anda miliki. Aset dalam `public/` tetap publik dan tidak dilindungi migrasi Supabase.

## Deployment Vercel

Gunakan proyek Vercel yang sudah ada untuk alamat publik di atas. Atur dua variabel Supabase pada environment yang dituju, lalu redeploy setelah mengubah nilainya. Konfigurasi `vercel.json` menggunakan Vite, `npm run build`, output `dist`, handler serverless `api/*.js`, dan rewrite SPA yang mengecualikan `/api/`. Periksa allowlist Auth untuk domain deployment aktual.
