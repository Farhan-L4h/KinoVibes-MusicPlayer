# PRD — KinoVibe Music Player

| Field | Value |
| --- | --- |
| Versi dokumen | 1.0 |
| Tanggal | 2026-11-21 |
| Status | Living document (mengikuti rilis `223d707`) |
| Pemilik | Farhan (pemilik repo `Farhan-L4h/KinoVibes-MusicPlayer`) |
| Production | https://kino-vibes-music-player.vercel.app · https://kinovibe.han06.web.id |
| Repo | https://github.com/Farhan-L4h/KinoVibes-MusicPlayer |

---

## 1. Ringkasan Produk

KinoVibe adalah pemutar musik web personal dengan estetika monokrom + ambient art, playback YouTube resmi (iframe), integrasi Spotify opsional, lirik tersinkron, visualizer audio reaktif, dan library musik unggahan sendiri. Akun masuk lewat Supabase Auth dan wajib lolos persetujuan admin sebelum dapat memakai aplikasi.

**Satu baris nilai:** "Semua musik yang kamu dengar — YouTube, Spotify, dan koleksi pribadi — dalam satu antarmuka yang tenang dan sinematik."

**Masalah yang diselesaikan**

1. Musik tersebar di banyak layanan; pengguna ingin satu antarmuka untuk YouTube, Spotify, dan file pribadi tanpa berpindah aplikasi.
2. UI pemutar musik populer padat iklan dan distraksi; pengguna ingin tampilan fokus dengan lirik dan visual yang menyatu dengan sampul album.
3. Koleksi audio pribadi (lagu daerah, rekaman pribadi, file legal) tidak punya rumah yang nyaman.

**Mengapa sekarang:** fondasi teknis (React 19, Supabase RLS, serverless proxy Innertube) sudah matang; fokus beralih dari membangun fitur ke kualitas, keamanan akun, dan stabilitas.

---

## 2. Tujuan dan Non-Tujuan

### 2.1 Tujuan (Goals)

| # | Tujuan | Ukuran keberhasilan |
| --- | --- | --- |
| G1 | Playback andal untuk tiga sumber (YouTube, Spotify, unggahan) | ≥ 95% sesi play berhasil tanpa error yang terlihat pengguna |
| G2 | Antarmuka "Now Playing" fullscreen yang utuh di semua ukuran layar | 0 overflow layout pada 6 viewport uji (1920×1080 s.d. 390×844) |
| G3 | Kontrol akses akun yang rapi | 100% akun baru `pending` sampai disetujui admin; aksi ban/limit langsung berlaku |
| G4 | Lirik tersinkron yang menyatu dengan visual | Lirik LRC aktif < 2 detik setelah track diputar (sumber tersedia) |
| G5 | Library pribadi yang aman | Audio & lirik privat hanya dapat diakses pemilik via signed URL / RLS |

### 2.2 Non-Tujuan (Out of Scope, permanen untuk v1)

- **Ekstraksi/unduhan audio YouTube** — melanggar ToS YouTube. Pemutaran hanya lewat iframe resmi yang terlihat.
- **Unduhan audio Spotify** — melanggar ToS; hanya streaming via Web Playback SDK resmi.
- **Transcoding audio** di server; dukungan codec mengikuti browser.
- **Offline playback penuh**; cache yang ada hanya cache pencarian/lirik/signed URL, bukan cache audio.
- **Sinkronisasi akun YouTube Music / library Spotify dua arah.**
- Aplikasi native (Android/iOS) — v1 berbasis web responsif.

---

## 3. Persona dan Peran

| Peran | Deskripsi | Hak akses |
| --- | --- | --- |
| Tamu | Belum login | Hanya `/login`, `/register`, `/reset-password` |
| `pending` | Sudah daftar, menunggu persetujuan | Layar gate "menunggu persetujuan"; tidak dapat memutar/mengunggah |
| `rejected` | Ditolak admin | Layar gate penolakan |
| `approved` / `user` | Pengguna biasa | Semua fitur pemutaran, library, playlist, favorit, profil |
| `approved` / `admin` | Pengelola konten | Semua hak user + **Upload musik** + panel Admin (setujui akun) |
| `approved` / `superadmin` | Pemilik sistem | Semua hak admin + ban, batasi (limit), hapus akun, ubah role |
| Banned | Diblokir | Ditolak saat login/gate; sesi diputus |
| Limited | Akses dibatasi | Gate pembatasan; tidak bisa memakai fitur utama |

Catatan: admin di bawah superadmin hanya dapat menyetujui pendaftaran; aksi destruktif (ban/hapus/limit/role) hanya superadmin. Superadmin awal di-seed oleh migrasi `002_roles_approval.sql` (`muhanmedan06@gmail.com`), yang harus sudah terdaftar & confirmed saat migrasi dijalankan.

---

## 4. Ruang Lingkup Fungsional

### 4.1 Auth dan Persetujuan Akun

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-AUTH-1 | Login email/password dan Google OAuth via Supabase | P0 | Login sukses membawa sesi persisten; logout menghapus sesi |
| FR-AUTH-2 | Registrasi membuat profil `status=pending` | P0 | Akun baru langsung melihat gate; tidak bisa mengakses route aplikasi |
| FR-AUTH-3 | Admin menyetujui pendaftaran dari panel Admin | P0 | Setelah approve, pengguna dapat masuk penuh tanpa login ulang manual (refresh ≤ 1 menit) |
| FR-AUTH-4 | Ban / batasi / hapus akun oleh superadmin | P0 | Aksi berlaku pada login berikutnya dan memutus sesi aktif (bila terdeteksi) |
| FR-AUTH-5 | Reset kata sandi via email | P1 | Tautan mengarah ke `/reset-password` dan dapat mengganti sandi |
| FR-AUTH-6 | Gate notice informatif per status | P1 | pending/rejected/banned/limited menampilkan pesan spesifik dan tombol keluar |

### 4.2 Pencarian

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-SEARCH-1 | Pencarian YouTube (judul, artis, album) via proxy serverless | P0 | Hasil muncul; klik memutar lagu |
| FR-SEARCH-2 | Saran pencarian (suggest) live di TopBar | P1 | Debounce; dropdown di atas video player (z-index benar) |
| FR-SEARCH-3 | Halaman hasil berbentuk baris cepat dengan cover | P1 | Setiap baris: cover, judul, artis, durasi, tombol putar |
| FR-SEARCH-4 | Impor playlist YouTube dari tautan | P1 | Tautan playlist valid → pilih lagu → simpan sebagai playlist |
| FR-SEARCH-5 | Pencarian katalog Spotify (jika terhubung) | P2 | Hasil bergabung dengan sumber lain; klik memutar preview/SDK |

### 4.3 Pemutaran

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-PLAY-1 | YouTube: iframe resmi terlihat, bukan ekstraksi audio | P0 | Video ≥ 200×200; pindah ke corner dock bila slot terlalu kecil |
| FR-PLAY-2 | Unggahan: streaming HTML5 via Howler | P0 | Seek, volume, volume mute, retry audio terbatas |
| FR-PLAY-3 | Spotify: Web Playback SDK (Premium) dengan fallback preview 30 detik | P1 | Full track untuk Premium; preview/toast untuk akun gratis |
| FR-PLAY-4 | Transport: play/pause, prev/next, shuffle, repeat off/all/one | P0 | State konsisten dengan UI dan Media Session |
| FR-PLAY-5 | Seek via waveform / slider waktu | P1 | Seek presisi; berlaku untuk semua sumber yang bisa di-seek |
| FR-PLAY-6 | Media Session + keyboard shortcuts | P1 | Media keys OS bekerja; `Space` play/pause, `←/→` seek, `M` mute, `L` lirik, `/` fokus pencarian |
| FR-PLAY-7 | Antrean dinamis + autoplay rekomendasi | P2 | Habis antrean → lagu rekomendasi diputar otomatis; panel Up Next |
| FR-PLAY-8 | Sesi pemutaran bertahan antar navigasi halaman dan refresh | P0 | Video/audio tidak restart saat pindah route |
| FR-PLAY-9 | Toast tidak menumpuk saat auto-skip berantai | P2 | Pesan identik me-reset timer, hanya 1 toast tampil |

### 4.4 Now Playing Fullscreen

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-NP-1 | Tampilan fullscreen dengan cover, spektrum vertikal, metadata, transport | P0 | Layout utuh tanpa scroll di desktop ≥ 1024px lebar, tinggi ≥ 614px |
| FR-NP-2 | Tipografi sadar-tinggi (bukan hanya lebar) | P0 | Font lirik mengecil di layar pendek; 0 overflow di 6 viewport uji |
| FR-NP-3 | Cover flex-fit + halo ambient | P1 | Cover tidak melampaui kolom; halo tidak menimbulkan scrollbar horizontal |
| FR-NP-4 | Tab Lirik / Up Next | P1 | Tab dapat dioperasikan keyboard; dua panel scrollable sendiri |
| FR-NP-5 | Focus trap + Escape menutup | P1 | Fokus terkurung di dialog; Esc menutup dialog |
| FR-NP-6 | Video YouTube tampil inline di dalam slot layar | P0 | Slot minimum 200×200; cover-crop 16:9 |

### 4.5 Lirik

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-LYR-1 | Lirik tersinkron LRC dari unggahan atau LRCLIB | P0 | Baris aktif mengikuti waktu; klik baris = seek |
| FR-LYR-2 | Lirik biasa (tanpa timing) tetap tampil | P1 | Preformatted, dapat discroll |
| FR-LYR-3 | Enhanced LRC (tag kata) tidak menampilkan timestamp mentah | P0 | Tidak ada `<mm:ss.xx>` di teks baris |
| FR-LYR-4 | Tampilan menyatu dengan background ambient + fade atas/bawah | P1 | Mask gradient; blur/opacity bertingkat per jarak baris |
| FR-LYR-5 | Tambah/edit lirik manual | P2 | Modal tersimpan ke track dan langsung dipakai |

### 4.6 Library, Album, Playlist, Favorit

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-LIB-1 | Library musik unggahan dengan pencarian/sort/filter | P0 | Hanya berisi track milik pengguna (RLS) |
| FR-LIB-2 | Pengelompokan album dari metadata | P1 | Tab Album; klik album memutar/menampilkan track |
| FR-PL-1 | Buat/ubah/hapus playlist dan isinya | P0 | Urutan track tersimpan; pemilik saja yang bisa mengubah |
| FR-PL-2 | Tambah ke playlist dari mana pun (modal) | P1 | Modal menampilkan playlist pengguna; aksi idempoten |
| FR-FAV-1 | Favorit (like) per track | P1 | Toggle tersimpan; halaman Favorit akurat |
| FR-HOME-1 | Home: hero "sekarang diputar", Baru diputar, Sering diputar, Rekomendasi, Koleksi, Lagu & Album kamu | P1 | Section muncul dengan data kosong yang ramah saat belum ada lagu |
| FR-DL-1 | Unduh hanya file unggahan sendiri (signed URL) | P2 | Tombol unduh tidak muncul untuk YouTube/Spotify |

### 4.7 Upload Musik (Admin+)

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-UP-1 | Form upload audio + metadata (judul, artis, album) | P0 | Validasi tipe/ukuran; progres upload; error jelas |
| FR-UP-2 | Upload sampul dan lirik opsional | P1 | `.lrc`/`.txt`; batas bucket ditegakkan server-side |
| FR-UP-3 | Hanya role admin/superadmin yang dapat membuka halaman Upload | P0 | User biasa melihat gate; sidebar menyembunyikan menu Upload untuk user |
| FR-UP-4 | File masuk Supabase Storage (bukan `public/`) | P0 | Bucket `music` privat; akses via signed URL bertimeout |

### 4.8 Profile dan Spotify

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-PROF-1 | Lihat info akun, role, status, keluar | P1 | Logout membersihkan sesi |
| FR-SPOT-1 | Hubungkan Spotify (OAuth PKCE, tanpa client secret) | P1 | Token tersimpan aman; tombol disconnect tersedia |
| FR-SPOT-2 | Impor lagu tersimpan & playlist ke library | P2 | Progres impor terlihat; duplikat tidak membuat entri ganda |
| FR-SPOT-3 | Status setup jelas bila `VITE_SPOTIFY_CLIENT_ID` kosong | P2 | Kartu menampilkan instruksi, bukan error mentah |

### 4.9 Panel Admin

| ID | Requirement | Prioritas | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-ADM-1 | Daftar akun dengan filter: semua, menunggu, disetujui, banned, dibatasi | P0 | Jumlah per filter akurat; pencarian akun |
| FR-ADM-2 | Aksi approve / ban / limit / hapus / ubah role | P0 | Konfirmasi untuk aksi destruktif; hasil tercermin di tabel |
| FR-ADM-3 | Hanya superadmin dapat melakukan aksi destruktif | P0 | Tombol tidak tampil/hilang untuk role lebih rendah; API menolak |

---

## 5. Arsitektur Ringkas

| Layer | Teknologi | Catatan |
| --- | --- | --- |
| Frontend | React 19.1, Vite 7, React Router 7.9, Zustand 5 | Lazy-loaded routes, SPA rewrite di Vercel |
| Styling | Tailwind CSS 3.4, CSS variables (OKLCH-tinted tokens) | Design system monokrom + ambient |
| Audio | Howler.js 2.2 (html5 mode) + WebAudio AnalyserNode | Analyser real FFT untuk unggahan & preview; YouTube/SDK = fallback stilasi |
| YouTube | youtubei.js 18.3 (proxy Innertube di `api/`) + IFrame Player API | Tidak mengekstrak audio |
| Spotify | OAuth PKCE + Web Playback SDK (browser) | Tanpa client secret di frontend; API resmi |
| Backend/DB | Supabase (Auth, Postgres + RLS, Storage) | Migrasi `001_security_hardening.sql`, `002_roles_approval.sql` |
| Serverless | `api/*.js` di Vercel (Node) + `vite-plugin-api.js` untuk dev | `yt-search`, `yt-suggest`, `yt-playlist`, `yt-related`, `lyrics` |
| Deploy | Vercel; push ke `main` = auto-deploy ~60 detik | Domain kustom via Cloudflare |

**Endpoint serverless**

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/yt-search?q=` | Pencarian YouTube (Innertube) |
| `GET /api/yt-suggest?q=` | Saran pencarian |
| `GET /api/yt-playlist?list=` | Metadata playlist YouTube untuk impor |
| `GET /api/yt-related?videoId=` | Rekomendasi/related untuk autoplay |
| `GET /api/lyrics?title=&artist=&album=&duration=` | Lirik dari LRCLIB dengan pencocokan |

---

## 6. Model Data

| Tabel | Isi utama | Akses |
| --- | --- | --- |
| `users` | Profil; `role` (user/admin/superadmin), `status` (pending/approved/rejected), `is_banned`, `is_limited`, `approved_at/by` | Pemilik baca/ubah field terbatas; role/status hanya admin (RPC definer) |
| `music_library` | Track unggahan: judul, artis, album, path audio/art/lirik, durasi | RLS per pemilik |
| `albums` | Metadata album turunan | RLS per pemilik |
| `playlists`, `playlist_tracks` | Playlist dan isi (urutan) | RLS per pemilik |
| `favorites` | Like per user per track | RLS per pemilik |

**Storage:** `music` (privat), `lyrics` (privat), `album-art` (`album-art` publik). Klien memakai signed URL sementara untuk audio/lirik privat.

**Env wajib:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Opsional: `VITE_SPOTIFY_CLIENT_ID`. Tidak boleh ada `service_role` key, password DB, atau client secret di frontend/repo.

---

## 7. Alur Pengguna Utama

1. **Daftar → disetujui → memutar**
   Register → status `pending` + gate → admin/superadmin approve → pengguna masuk → Home menampilkan rekomendasi/album → klik lagu → playback + lirik + spectrum.
2. **Cari & putar YouTube**
   Ketik di TopBar/Search → saran & hasil dengan cover → klik baris → video tampil inline/corner dock → Now Playing menampilkan lirik.
3. **Impor playlist YouTube**
   Playlists → Impor → tempel tautan → pilih lagu → simpan playlist → putar dari Playlist Detail.
4. **Unggah (admin)**
   Upload → pilih audio + metadata + cover/lirik → simpan ke Storage → tampil di Library/Home.
5. **Spotify (opsional)**
   Profil → Hubungkan Spotify → impor library → putar full track (Premium) atau preview 30 detik.

---

## 8. Non-Functional Requirements

| Kategori | Target |
| --- | --- |
| Performa | First paint aplikasi < 2.5 dtk di 4G; pencarian p95 < 3 dtk (cold) / < 1 dtk (warm); mulai putar < 1.5 dtk setelah pilih lagu (jaringan normal) |
| Responsif | Utuh di 320–1920px, termasuk 1366×768 dan scaling 125% (1093×614); 0 horizontal overflow |
| Animasi | Fade/transisi 200–600 ms; spectrum 60 fps; menghormati preferensi pengurangan gerak bila diaktifkan |
| Aksesibilitas | Fokus terlihat, focus trap di dialog, label ARIA pada kontrol ikon, kontras teks utama ≥ 4.5:1, target sentuh ≥ 44px |
| Keamanan | RLS aktif semua tabel; audio/lirik privat; tidak ada secret di bundle; aksi admin lewat RPC definer + cek role server-side |
| Privasi | Tidak ada telemetri pihak ketiga di luar yang diperlukan Supabase/YouTube/Spotify |
| Ketahanan | Retry playback dibatasi; error YouTube (101/150, region, autoplay) ditampilkan sebagai toast + auto-skip, bukan layar rusak |
| Browser | Chrome/Edge/Firefox/Safari versi terkini; codec mengikuti browser |

---

## 9. Metrik Produk

1. **Aktivasi:** % akun baru yang disetujui dalam 24 jam sejak daftar.
2. **Core usage:** jumlah sesi pemutaran/hari per user aktif; rasio sumber (YouTube/unggahan/Spotify).
3. **Kualitas playback:** % sesi tanpa error playback; insiden autoplay diblokir.
4. **Lirik:** % track yang berhasil mendapat lirik tersinkron.
5. **Retensi:** D7/D30 user aktif.
6. **Kesehatan operasional:** jumlah 5xx dari `/api/*`, waktu deploy, error rate frontend (uncaught).

---

## 10. Batasan dan Risiko

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| YouTube membatasi embedding (error 101/150, region, autoplay) | Lagu gagal diputar | Toast jelas, auto-skip, rekomendasi alternatif; iframe tetap resmi |
| Migrasi `001`/`002` belum diterapkan ke DB live | Gate/RLS tidak aktif di production | Jalankan manual di SQL Editor setelah review; verifikasi RLS pasca-terap |
| Kebijakan ToS YouTube/Spotify | Fitur unduhan tidak diizinkan | Non-goal permanen; hanya streaming resmi |
| Spotify Premium tidak dimiliki pengguna | Lagu tidak penuh | Fallback preview 30 detik + pesan informatif |
| File audio besar / codec tak didukung | Gagal putar | Validasi ukuran (≤ 60 MiB form, batas bucket), pesan error spesifik |
| Ketersediaan LRCLIB | Lirik tidak muncul | Tampilkan empty state; opsi unggah lirik manual |
| Migrasi ulang tidak sengaja | Policy/trigger bentrok, bucket kembali publik | Migrasi idempoten + dokumentasi "jangan jalankan schema penuh sebagai perbaikan umum" |

---

## 11. Kriteria Rilis (Definition of Done)

Rilis dianggap layak production jika seluruh poin berikut terpenuhi:

1. Build produksi sukses (`npm run build`) dan lint 0 error.
2. Uji regresi browser Phase G **22/22 PASS**, termasuk:
   - dropdown pencarian di atas video,
   - corner dock ≥ 200×200 dan tombol maximize,
   - lirik tanpa timestamp mentah, blend + mask,
   - spectrum nyata untuk audio yang bisa ditap (FFT) dan fallback jujur untuk YouTube,
   - admin panel + gate upload,
   - toast dedupe,
   - mobile tanpa overflow horizontal.
3. Fit fullscreen Now Playing tanpa overflow pada 6 viewport (1920×1080, 1440×900, 1366×768, 1156×922, 1093×614, 390×844) dan tombol play selalu terlihat.
4. Deploy Vercel live di kedua domain dan hash bundle sama dengan build terverifikasi.
5. Tidak ada secret di repo/bundle; state uji browser dibersihkan.

---

## 12. Roadmap

| Fase | Isi | Status |
| --- | --- | --- |
| A–F | Fondasi, design system, player, YouTube, lirik, Spotify, polish | Selesai & ter-deploy |
| G | Persetujuan akun + role, admin panel, upload admin-only, spectrum nyata, search row, lirik menyatu, Now Playing fullscreen | Selesai, commit `223d707` |
| H (usulan) | Terapkan migrasi 001/002 ke DB live + verifikasi RLS, audit akses admin, empty states, onboarding gate | Berikutnya |
| I (usulan) | Peningkatan kualitas lirik (offset koreksi manual), pencarian gabungan lintas sumber, EQ/audio enhancement, statistik mendengarkan | Ide |

---

## 13. Pertanyaan Terbuka

1. Apakah approval akun tetap manual selamanya, atau perlu undangan (invite-only)?
2. Perlukup playlist kolaboratif (multi-user) di rilis berikutnya?
3. Apakah perlu kebijakan retensi data akun yang dihapus (soft delete vs hard delete)?
4. Batas ukuran/kuota Storage per pengguna perlu ditetapkan eksplisit?
