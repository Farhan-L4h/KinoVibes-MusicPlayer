baca PRD project 

# MASTER PROMPT — KINOVIBE MUSIC PLAYER ENHANCEMENT

## 1. ROLE & OBJECTIVE

Bertindaklah sebagai Senior Full-Stack Developer, UI/UX Designer, Music Streaming Engineer, dan Performance Optimization Specialist.

Saya ingin kamu melakukan audit, perbaikan, optimasi, dan pengembangan lanjutan terhadap website KinoVibe Music Player.

*Website:* https://kinovibe.han06.web.id/login

*Project repository:* https://github.com/Farhan-L4h/KinoVibes-MusicPlayer

Baca dan pahami terlebih dahulu PRD.md yang tersedia di dalam repository. Jadikan PRD tersebut sebagai acuan utama pengembangan.

PENTING:
•  Ini merupakan project yang sudah berjalan dan sudah memiliki banyak fitur.
•  Jangan membangun ulang aplikasi dari awal.
•  Jangan mengganti teknologi utama yang sudah digunakan.
•  Jangan menghapus fitur yang sudah berfungsi.
•  Jangan merusak integrasi Supabase, YouTube, Spotify, maupun sistem autentikasi.
•  Prioritaskan peningkatan kualitas implementasi yang sudah ada.
•  Lakukan audit kode sebelum mengubah komponen atau logic.
•  Semua fitur harus benar-benar berfungsi, bukan sekadar perubahan tampilan.

Target akhir: KinoVibe menjadi music player yang modern, cinematic, interaktif, ringan, responsif, dan memberikan pengalaman mendengarkan musik yang premium.

---

# 2. ARTIST DISCOVERY — HALAMAN ARTIS

Tambahkan fitur agar pengguna dapat membuka halaman atau daftar lagu berdasarkan artis yang dipilih.

### Perilaku yang diinginkan

Ketika pengguna mengklik nama artis pada:
•  Now Playing.
•  Hasil pencarian.
•  Daftar lagu.
•  Album.
•  Playlist.
•  Recently Played.
•  Rekomendasi musik.

Aplikasi harus membuka tampilan khusus artis tersebut.

### Konten halaman artis

Tampilkan:
1. Nama artis.
2. Foto atau artwork artis jika tersedia.
3. Deskripsi singkat jika tersedia dari sumber yang valid.
4. Daftar lagu milik artis.
5. Album artis jika tersedia.
6. Lagu populer berdasarkan data yang tersedia.
7. Tombol Play All.
8. Tombol Shuffle.
9. Informasi jumlah lagu.

### Interaksi

•  Klik lagu untuk langsung memutarnya.
•  Play All memasukkan lagu artis ke antrean secara berurutan.
•  Shuffle memutar lagu artis dengan urutan acak.
•  Klik album membuka detail album.
•  Tombol kembali mempertahankan konteks navigasi sebelumnya.

### Ketentuan teknis

•  Gunakan metadata artis dari hasil pencarian YouTube, Spotify, dan library lokal.
•  Jangan mengasumsikan semua artis memiliki ID yang sama di setiap provider.
•  Gunakan normalisasi nama artis untuk pencocokan.
•  Hindari duplikasi lagu.
•  Gunakan pagination atau infinite scrolling jika jumlah lagu banyak.
•  Terapkan caching agar halaman artis tidak selalu mengambil data dari awal.

Jika sumber tidak menyediakan informasi artis, tampilkan empty state yang rapi.

---

# 3. CINEMATIC NOW PLAYING — ADVANCED MUSIC EXPERIENCE

Ini merupakan salah satu prioritas utama pengembangan.

Referensi animasi dan pengalaman visual:

https://www.tiktok.com/@mus1cfreak17/video/7710936906061581600

Pelajari referensi tersebut untuk memahami karakter animasi lirik, transisi visual, motion, dan interaksi saat musik dimainkan.

Jangan sekadar menambahkan animasi biasa. Buat pengalaman Now Playing yang terasa hidup, responsif terhadap musik, dan menyatu dengan keseluruhan desain.

### A. Dynamic Lyrics Animation

Tingkatkan tampilan lirik dengan konsep cinematic synchronized lyrics.

Fitur yang diharapkan:

•  Lirik aktif memiliki ukuran dan penekanan visual yang lebih dominan.
•  Lirik sebelumnya dan berikutnya tampil dengan opacity berbeda.
•  Transisi antarbaris menggunakan smooth fade, blur, dan movement.
•  Baris aktif dapat memiliki animasi word-by-word jika data Enhanced LRC tersedia.
•  Animasi mengikuti timestamp lirik secara akurat.
•  Perpindahan lirik tidak terasa kaku atau melompat.
•  Pengguna dapat mengklik lirik untuk berpindah ke timestamp terkait.
•  Lirik otomatis mengikuti posisi pemutaran lagu.

Gunakan animasi seperti:
•  Smooth vertical translation.
•  Opacity transition.
•  Blur-to-focus.
•  Word highlight.
•  Subtle scale transition.
•  Gradient masking.

Jangan membuat seluruh lirik bergerak secara berlebihan.

### B. Dynamic Album Artwork

Tingkatkan interaksi album artwork.

Ketika musik dimainkan:
•  Artwork memiliki animasi visual yang halus.
•  Tambahkan ambient glow berdasarkan warna artwork.
•  Tambahkan efek depth dan subtle floating.
•  Gunakan transisi artwork yang halus ketika lagu berganti.
•  Artwork dapat memiliki efek rotasi atau scaling yang sangat subtle jika sesuai desain.

Ketika musik dijeda:
•  Animasi berhenti atau masuk ke kondisi idle.
•  Efek visual berkurang secara natural.

### C. Audio Reactive Visualizer

Optimalkan visualizer berdasarkan kemampuan sumber audio.

Untuk musik unggahan:
•  Gunakan Web Audio API AnalyserNode.
•  Visualizer mengambil data frekuensi aktual.
•  Animasi merespons bass, mid, dan treble.

Untuk YouTube dan Spotify:
•  Gunakan visualisasi fallback yang jujur dan tidak mengklaim sebagai FFT audio aktual jika data audio memang tidak tersedia.

Buat visualizer dengan desain:
•  Vertical spectrum.
•  Audio waveform.
•  Smooth amplitude transition.
•  Ambient particles jika tidak membebani performa.

### D. Motion & Interaction

Tambahkan:
•  Smooth transition saat berganti lagu.
•  Animated play/pause button.
•  Animated progress bar.
•  Hover interaction pada artwork.
•  Subtle button feedback.
•  Background ambient yang mengikuti warna album.
•  Transition antar-tab Lyrics dan Up Next.
•  Loading animation yang minimalis.

Gunakan prinsip motion design:
•  Durasi animasi sekitar 200–600 ms.
•  Easing natural.
•  Tidak menggunakan animasi berlebihan.
•  Tidak mengganggu kontrol musik.

Hormati prefers-reduced-motion.

---

# 4. SMART UP NEXT — MUSIC RECOMMENDATION ENGINE

Perbaiki secara menyeluruh logic Up Next dan autoplay rekomendasi.

Saat ini rekomendasi lagu harus dibuat lebih relevan, bukan hanya mengambil lagu random atau lagu yang kebetulan tersedia.

Gunakan pendekatan seperti YouTube Music.

### A. Recommendation Logic

Ketika lagu sedang dimainkan, sistem harus mempertimbangkan:

1. Genre musik.
2. Nama artis.
3. Kemiripan artis.
4. Judul lagu.
5. Mood musik jika metadata tersedia.
6. Album.
7. Related songs dari YouTube.
8. Riwayat lagu yang sering diputar.
9. Lagu yang pernah disukai.
10. Konteks playlist yang sedang dimainkan.

### B. Prioritas Rekomendasi

Gunakan urutan prioritas berikut:

1. Lagu dalam playlist aktif jika sedang memutar playlist.
2. Lagu dari artis yang sama.
3. Lagu dari genre yang sama.
4. Lagu yang memiliki kemiripan metadata.
5. Lagu related dari YouTube.
6. Rekomendasi berdasarkan riwayat pengguna.
7. Rekomendasi alternatif yang relevan.

Jangan terlalu sering memutar lagu yang sama.

### C. Smart Queue

Buat sistem antrean yang lebih cerdas:

•  Pisahkan antrean manual dan antrean rekomendasi otomatis.
•  Lagu yang ditambahkan pengguna harus memiliki prioritas.
•  Lagu yang sedang diputar tidak boleh muncul sebagai duplikat.
•  Hindari lagu yang sudah sering diputar dalam sesi yang sama.
•  Shuffle harus tetap mempertahankan logika relevansi.
•  Repeat One harus mengulang lagu yang sama.
•  Repeat All harus mengulang konteks playlist.
•  Jika antrean habis, cari rekomendasi berdasarkan lagu terakhir.

### D. Recommendation Scoring

Implementasikan sistem scoring sederhana yang mudah dikembangkan.

Contoh bobot awal:

•  Genre sama: +30.
•  Artis sama: +25.
•  Related song: +25.
•  Mood serupa: +10.
•  Kemiripan metadata: +10.
•  Lagu pernah diputar berulang: penalti.
•  Lagu yang sedang diputar: dikeluarkan.
•  Lagu duplikat: dikeluarkan.

Bobot harus dapat disesuaikan berdasarkan hasil pengujian.

Jangan mengarang genre atau mood jika metadata tidak tersedia.

### E. Up Next UI

Tampilkan:
•  Cover lagu.
•  Judul.
•  Nama artis.
•  Durasi.
•  Label Now Playing.
•  Label Recommended jika lagu berasal dari rekomendasi.
•  Tombol Play.
•  Tombol Remove.
•  Drag and drop untuk mengatur urutan antrean jika memungkinkan.

Pastikan antrean tetap konsisten dengan state player.

---

# 5. KEYBOARD SHORTCUT — F10 & F11

Tambahkan shortcut keyboard untuk mengontrol lagu sebelumnya dan selanjutnya.

Mapping yang diinginkan:

| Shortcut | Action |
|---|---|
| F10 | Previous Track |
| F11 | Next Track |
| Space | Play / Pause |
| Arrow Left | Seek Backward |
| Arrow Right | Seek Forward |
| M | Mute / Unmute |
| L | Toggle Lyrics |
| / | Focus Search |
| Escape | Close Modal / Now Playing |

### Ketentuan implementasi

•  Shortcut harus bekerja ketika aplikasi sedang aktif.
•  Jangan menjalankan shortcut saat pengguna sedang mengetik pada input, textarea, atau contenteditable.
•  Hindari konflik dengan shortcut browser.
•  Pastikan shortcut tidak memicu aksi ganda.
•  Integrasikan dengan global player state.
•  Sinkronkan dengan Media Session API jika memungkinkan.

CATATAN PENTING:
Browser dapat mengambil alih F11 untuk fullscreen sehingga JavaScript tidak selalu bisa mencegatnya. Implementasikan F11 sebagai Next Track pada kondisi browser mengizinkan, dan sediakan alternatif shortcut yang dapat dikonfigurasi apabila browser mengambil alih tombol tersebut.

Berikan feedback visual atau toast kecil ketika shortcut digunakan.

---

# 6. UI/UX REDESIGN — PREMIUM CINEMATIC INTERFACE

Lakukan evaluasi seluruh antarmuka KinoVibe.

Pertahankan identitas visual utama:
•  Monochrome.
•  Dark interface.
•  Ambient artwork.
•  Minimalist.
•  Cinematic.
•  Premium music experience.

Namun tingkatkan kualitas visual secara menyeluruh.

### A. Design Direction

Gunakan inspirasi desain dari:
•  Apple Music.
•  Spotify.
•  YouTube Music.
•  Aplikasi music player premium.
•  Modern editorial design.

Jangan menyalin desain secara langsung.

Buat identitas visual KinoVibe yang khas.

### B. Layout

Rapikan:
•  Sidebar.
•  Top navigation.
•  Home.
•  Search.
•  Artist page.
•  Album page.
•  Playlist.
•  Library.
•  Favorites.
•  Now Playing.
•  Up Next.
•  Profile.
•  Admin panel.

Pastikan seluruh halaman memiliki:
•  Spacing konsisten.
•  Alignment yang rapi.
•  Hierarki tipografi jelas.
•  Ukuran komponen konsisten.
•  Visual balance.
•  Empty state yang baik.
•  Loading state yang tidak mengganggu.

### C. Player UI

Mini Player harus:
•  Mudah diakses.
•  Tidak terlalu besar.
•  Memiliki artwork.
•  Menampilkan judul dan artis.
•  Memiliki play/pause.
•  Previous dan next.
•  Progress bar.
•  Volume control jika ruang memungkinkan.

Fullscreen Now Playing harus menjadi pengalaman visual terbaik dari seluruh aplikasi.

### D. Micro Interaction

Tambahkan interaksi yang konsisten:
•  Hover effect.
•  Active state.
•  Button feedback.
•  Smooth transition.
•  Skeleton loading.
•  Toast notification.
•  Dropdown animation.
•  Modal transition.

Jangan membuat UI terlalu ramai.

---

# 7. RESPONSIVE DESIGN — MOBILE FIRST

Pastikan aplikasi nyaman digunakan di desktop, tablet, dan HP.

Target viewport:
•  1920 × 1080.
•  1440 × 900.
•  1366 × 768.
•  1156 × 922.
•  1093 × 614.
•  390 × 844.
•  375 × 812.
•  320 × 640.

### Mobile requirements

•  Sidebar berubah menjadi mobile navigation atau drawer.
•  Mini Player tidak menutupi navigasi.
•  Now Playing menggunakan layout vertikal.
•  Artwork menyesuaikan lebar layar.
•  Lyrics tetap nyaman dibaca.
•  Up Next dapat dibuka melalui tab atau bottom sheet.
•  Tombol kontrol memiliki ukuran sentuh minimal 44px.
•  Search tetap mudah digunakan.
•  Modal tidak melebihi viewport.
•  Tidak ada horizontal overflow.

Perhatikan juga orientasi landscape dan layar dengan tinggi terbatas.

---

# 8. SEARCH ENGINE OPTIMIZATION — FAST & LIGHTWEIGHT SEARCH

Optimalkan seluruh sistem pencarian agar lebih cepat dan hemat resource.

Pertahankan endpoint dan arsitektur pencarian yang sudah ada.

Endpoint saat ini:
•  /api/yt-search
•  /api/yt-suggest
•  /api/yt-playlist

### A. Search Performance

Implementasikan:

1. Debounce sekitar 250–350 ms.
2. AbortController untuk membatalkan request lama.
3. Request deduplication.
4. In-memory caching.
5. Cache berdasarkan query.
6. Batas ukuran cache.
7. TTL cache.
8. Hindari request yang sama berulang.
9. Hindari pencarian ketika input belum memenuhi kondisi minimum.
10. Pagination atau incremental loading jika didukung.

### B. Search UX

•  Hasil muncul secepat mungkin.
•  Suggestion tidak menutupi player.
•  Dropdown memiliki z-index yang benar.
•  Loading indicator ringan.
•  Empty state informatif.
•  Error state dengan tombol retry.
•  Keyboard navigation.
•  Enter untuk memilih atau membuka hasil.
•  Escape untuk menutup dropdown.

### C. Search Architecture

Pisahkan:
•  Search service.
•  Search hooks.
•  Cache manager.
•  Search UI.
•  Suggestion handler.

Jangan menempatkan seluruh logic dalam satu komponen React.

Jangan menambahkan dependency besar hanya untuk mempercepat pencarian.

Target performa sesuai PRD:
•  Cold search p95 di bawah 3 detik.
•  Warm search p95 di bawah 1 detik.

---

# 9. GLOBAL PERFORMANCE OPTIMIZATION

Lakukan optimasi menyeluruh agar KinoVibe ringan dan tidak boros resource.

Prioritaskan optimasi nyata, bukan hanya mengurangi jumlah kode.

### A. React Optimization

•  Evaluasi penggunaan useMemo dan useCallback.
•  Hindari unnecessary re-render.
•  Optimalkan Zustand selectors.
•  Pisahkan komponen yang terlalu besar.
•  Gunakan React.lazy dan Suspense untuk route.
•  Hindari state global untuk data yang tidak diperlukan secara global.
•  Pastikan event listener dibersihkan.
•  Hindari memory leak.

Jangan menggunakan memoization secara berlebihan tanpa alasan.

### B. Animation Optimization

•  Utamakan transform dan opacity.
•  Hindari animasi layout yang mahal.
•  Batasi jumlah particle.
•  Gunakan requestAnimationFrame hanya saat diperlukan.
•  Hentikan visualizer ketika tidak terlihat atau tidak aktif.
•  Kurangi update state React untuk visualizer berfrekuensi tinggi.
•  Pertimbangkan CSS animation untuk efek sederhana.

### C. Asset Optimization

•  Lazy-load artwork.
•  Gunakan ukuran gambar yang sesuai.
•  Hindari memuat gambar besar jika tidak diperlukan.
•  Gunakan placeholder.
•  Hindari duplikasi asset.
•  Optimalkan penggunaan font.
•  Jangan menambahkan library animasi besar jika CSS sudah cukup.

### D. Memory & Network

•  Bersihkan audio instance lama.
•  Hentikan request yang tidak diperlukan.
•  Hindari fetch berulang.
•  Gunakan cache yang memiliki batas.
•  Jangan preload seluruh audio library.
•  Pertahankan sesi playback ketika navigasi.
•  Hindari download audio YouTube atau Spotify.

### E. Performance Target

Target:
•  First paint < 2.5 detik pada jaringan 4G.
•  Search cold p95 < 3 detik.
•  Search warm p95 < 1 detik.
•  Animasi stabil dan tidak membebani CPU.
•  Tidak ada memory leak yang ditemukan dalam pengujian.
•  Tidak ada horizontal overflow.

---

# 10. ARCHITECTURE & SECURITY PRESERVATION

Seluruh pengembangan wajib mempertahankan arsitektur existing.

Stack:
•  React 19.
•  Vite 7.
•  React Router 7.
•  Zustand 5.
•  Tailwind CSS 3.4.
•  Supabase.
•  Howler.js.
•  YouTube IFrame Player API.
•  Spotify Web Playback SDK.
•  Vercel Serverless Functions.

### Security requirements

Jangan pernah:
•  Mengekspos Supabase service_role key.
•  Menaruh secret di frontend.
•  Membuat bucket audio privat menjadi publik.
•  Menghilangkan RLS.
•  Mengubah sistem approval akun tanpa alasan.
•  Membuka fitur upload untuk user biasa.
•  Memberikan akses admin kepada user biasa.
•  Menghapus pembatasan role superadmin.

Semua fitur baru harus mengikuti aturan akses yang sudah ada.

### Playback requirements

•  YouTube tetap menggunakan iframe resmi yang terlihat.
•  Spotify tetap menggunakan integrasi resmi.
•  File upload tetap menggunakan Supabase Storage privat.
•  Gunakan signed URL.
•  Jangan menambahkan sistem ekstraksi audio.
•  Jangan mengunduh audio dari YouTube atau Spotify.

---

# 11. IMPLEMENTATION PRIORITY

Kerjakan secara bertahap agar tidak merusak fitur existing.

### PHASE 1 — Audit & Stabilization

•  Pelajari seluruh struktur repository.
•  Pelajari PRD.
•  Audit player state.
•  Audit queue logic.
•  Audit search service.
•  Audit Now Playing.
•  Audit responsive layout.
•  Identifikasi bottleneck performa.
•  Catat masalah dan rencana perbaikan.

### PHASE 2 — Artist Discovery

•  Implementasi artist click interaction.
•  Buat halaman artist.
•  Implementasi daftar lagu artis.
•  Album dan popular tracks.
•  Integrasi dengan search dan player.

### PHASE 3 — Smart Queue

•  Perbaiki recommendation engine.
•  Implementasikan similarity scoring.
•  Perbaiki autoplay.
•  Sinkronisasi manual dan automatic queue.
•  Implementasikan Up Next UI.

### PHASE 4 — Cinematic Player

•  Redesign Now Playing.
•  Dynamic lyrics.
•  Word-level animation jika tersedia.
•  Album artwork transition.
•  Ambient background.
•  Audio reactive visualizer.
•  Micro interactions.

### PHASE 5 — Keyboard & Search

•  F10/F11.
•  Shortcut handling.
•  Search debounce.
•  AbortController.
•  Request caching.
•  Search UI optimization.

### PHASE 6 — Responsive & Performance

•  Mobile optimization.
•  Tablet optimization.
•  Component optimization.
•  Asset optimization.
•  Memory optimization.
•  Animation optimization.

### PHASE 7 — Regression Testing

Uji seluruh fitur existing dan fitur baru.

---

# 12. ACCEPTANCE CRITERIA

Pekerjaan belum dianggap selesai apabila hanya UI yang berubah.

Pastikan seluruh poin berikut terpenuhi:

### Artist
•  [ ] Klik nama artis membuka halaman artis.
•  [ ] Daftar lagu artis tampil.
•  [ ] Play All berfungsi.
•  [ ] Shuffle berfungsi.
•  [ ] Album dapat dibuka.

### Now Playing
•  [ ] Animasi lirik berjalan.
•  [ ] Lirik tersinkron dengan playback.
•  [ ] Artwork memiliki transisi.
•  [ ] Visualizer berfungsi sesuai sumber audio.
•  [ ] Play/pause memiliki feedback.
•  [ ] Tidak ada layout overflow.

### Queue
•  [ ] Rekomendasi lebih relevan.
•  [ ] Genre dan artis dipertimbangkan.
•  [ ] Tidak ada duplikasi.
•  [ ] Manual queue tetap diprioritaskan.
•  [ ] Autoplay bekerja.
•  [ ] Repeat dan shuffle konsisten.

### Keyboard
•  [ ] F10 menjalankan previous track jika tidak diambil browser.
•  [ ] F11 menjalankan next track jika tidak diambil browser.
•  [ ] Alternatif shortcut tersedia.
•  [ ] Tidak mengganggu input pengguna.

### Search
•  [ ] Debounce bekerja.
•  [ ] Request lama dibatalkan.
•  [ ] Cache bekerja.
•  [ ] Hasil pencarian tidak duplikat.
•  [ ] Search dropdown tidak tertutup player.

### Responsive
•  [ ] Desktop rapi.
•  [ ] Tablet rapi.
•  [ ] Mobile rapi.
•  [ ] Tidak ada horizontal overflow.
•  [ ] Semua tombol dapat diakses.

### Performance & Stability
•  [ ] Build berhasil.
•  [ ] Tidak ada error baru pada console.
•  [ ] Tidak ada memory leak yang ditemukan.
•  [ ] Tidak ada regresi pada playback.
•  [ ] Tidak ada regresi pada autentikasi.
•  [ ] Tidak ada regresi pada Supabase RLS.
•  [ ] Tidak ada regresi pada fitur admin.

---

# 13. FINAL EXECUTION INSTRUCTIONS

Sebelum mulai:
1. Periksa struktur repository.
2. Baca PRD.md.
3. Pahami implementasi existing.
4. Identifikasi komponen yang dapat digunakan kembali.
5. Buat daftar pekerjaan berdasarkan prioritas.

Selama pengerjaan:
1. Kerjakan secara bertahap.
2. Jangan membuat ulang fitur yang sebenarnya sudah ada.
3. Hindari duplikasi logic.
4. Gunakan komponen reusable.
5. Pertahankan konsistensi design system.
6. Pastikan seluruh interaksi benar-benar berfungsi.
7. Jalankan build dan pengujian setelah perubahan signifikan.

Setelah selesai, berikan laporan yang berisi:

•  Fitur yang berhasil ditambahkan.
•  Komponen yang diperbaiki.
•  File yang diubah.
•  Logic yang dioptimalkan.
•  Hasil pengujian.
•  Hasil build.
•  Masalah yang masih tersisa.
•  Rekomendasi pengembangan berikutnya.

*FINAL GOAL:*

Jadikan KinoVibe sebagai personal music streaming experience yang memiliki kualitas visual premium, cinematic synchronized lyrics, smart music recommendation, artist discovery, smooth interaction, responsive mobile experience, dan performa yang ringan.

Jangan mengorbankan stabilitas, keamanan, maupun fitur existing demi perubahan visual.

Kerjakan dengan standar production-ready, bukan sekadar prototype atau mockup.

# 14. ADVANCED AUDIO SETTINGS & PLAYBACK CUSTOMIZATION

Tambahkan sistem pengaturan audio dan playback yang lengkap, modern, dan dapat dikustomisasi oleh pengguna.

Tujuannya adalah memberikan kontrol lebih besar terhadap pengalaman mendengarkan musik, seperti aplikasi desktop music player premium.

Jangan hanya membuat UI pengaturan. Seluruh konfigurasi harus benar-benar terhubung dengan logic player dan tersimpan secara persisten.

## A. CROSSFADE — TRANSISI ANTARLAGU

Implementasikan fitur Crossfade untuk menciptakan transisi yang halus antara lagu sebelumnya dan lagu berikutnya.

### Fitur:

•  Toggle Enable/Disable Crossfade.
•  Slider durasi crossfade.
•  Durasi yang dapat diatur dari 0–12 detik.
•  Default sekitar 5 detik.
•  Preview atau indikator durasi crossfade.
•  Transisi volume secara bertahap antara dua lagu.

### Perilaku:

1. Ketika lagu hampir selesai, lagu berikutnya mulai diputar sebelum lagu sebelumnya selesai.
2. Volume lagu sebelumnya turun secara bertahap.
3. Volume lagu berikutnya naik secara bertahap.
4. Tidak boleh ada jeda yang mengganggu.
5. Pastikan tidak terjadi audio overlap yang tidak terkendali.
6. Crossfade harus dapat dihentikan atau dibatalkan ketika pengguna memilih lagu lain.

### Kompatibilitas:

•  Implementasikan crossfade penuh untuk audio upload yang dikontrol melalui Howler.js/HTML5 Audio.
•  Untuk YouTube dan Spotify, periksa batasan API resmi dan kemampuan kontrol volume masing-masing.
•  Jika crossfade tidak dapat dilakukan secara konsisten pada sumber tertentu, tampilkan informasi kompatibilitas dan gunakan transisi normal.
•  Jangan menjanjikan crossfade universal jika API sumber tidak mendukungnya.

## B. AUDIO QUALITY & RESOLUTION SETTINGS

Tambahkan pengaturan kualitas pemutaran video/audio.

### YouTube Playback Quality

Sediakan pilihan kualitas:

•  Auto.
•  144p.
•  240p.
•  360p.
•  480p.
•  720p.
•  1080p.
•  Highest Available.

Ketentuan:

•  Gunakan YouTube IFrame Player API untuk membaca dan mengatur kualitas jika didukung.
•  Gunakan setPlaybackQuality jika masih didukung oleh player.
•  Periksa kualitas aktual melalui API yang tersedia.
•  Tampilkan Auto sebagai rekomendasi default.
•  Jika resolusi yang dipilih tidak tersedia, berikan fallback dan informasi yang jelas.
•  Jangan membuat kontrol palsu yang tidak memengaruhi kualitas aktual.

### Spotify Quality

Jangan membuat pengaturan resolusi palsu untuk Spotify.

Tampilkan informasi kualitas berdasarkan kemampuan Spotify Web Playback SDK dan konfigurasi yang tersedia.

### Uploaded Audio

Tampilkan informasi:

•  Format audio.
•  Bitrate jika tersedia.
•  Sample rate jika tersedia.
•  Channel audio.
•  Durasi.
•  Ukuran file.

Jangan melakukan transcoding otomatis hanya untuk menampilkan informasi tersebut.

## C. EQUALIZER (EQ)

Tambahkan Equalizer untuk mengatur karakter suara.

Preset:

•  Flat.
•  Bass Boost.
•  Treble Boost.
•  Vocal.
•  Classical.
•  Electronic.
•  Rock.
•  Pop.
•  Custom.

### Custom Equalizer

Sediakan slider untuk:

•  60 Hz.
•  150 Hz.
•  400 Hz.
•  1 kHz.
•  2.4 kHz.
•  6 kHz.
•  15 kHz.

Fitur:

•  Pengaturan gain per frequency band.
•  Reset ke default.
•  Simpan preset.
•  Pilih preset.
•  Toggle Equalizer.

Gunakan Web Audio API BiquadFilterNode untuk audio yang dapat diakses dan diproses secara legal oleh browser.

Penting:

•  Jangan mengklaim EQ bekerja pada YouTube iframe atau Spotify jika audio tidak tersedia untuk diproses melalui Web Audio API.
•  Untuk sumber yang tidak kompatibel, tampilkan status unsupported secara informatif.

## D. PLAYBACK SETTINGS

Tambahkan pengaturan:

1. Autoplay Next Song.
2. Smart Recommendations.
3. Crossfade.
4. Shuffle.
5. Repeat Mode.
6. Gapless Playback jika memungkinkan.
7. Remember Last Playback Position jika sesuai sumber.
8. Resume Playback After Refresh.
9. Auto Play When Selecting a Song.
10. Reduce Motion.

Semua pengaturan harus terhubung dengan global player state.

## E. VOLUME SETTINGS

Tambahkan:

•  Master Volume.
•  Mute.
•  Remember Volume.
•  Volume Normalization jika memungkinkan.
•  Fade In ketika mulai memutar lagu.
•  Fade Out ketika menghentikan lagu.

Gunakan batas volume yang aman dan jangan meningkatkan gain secara tidak terkendali.

## F. APPEARANCE SETTINGS

Tambahkan pengaturan tampilan:

•  Dark Mode.
•  Light Mode jika didukung design system.
•  System Theme.
•  Accent Color.
•  Ambient Artwork Background.
•  Dynamic Background.
•  Animated Artwork.
•  Lyrics Animation.
•  Visualizer Enable/Disable.
•  Visualizer Style.
•  Reduced Motion.
•  Compact Player Mode.

Perubahan harus langsung terlihat melalui live preview.

Pertahankan identitas monokrom KinoVibe sebagai tema default.

## G. LYRICS SETTINGS

Sediakan konfigurasi:

•  Lyrics Font Size.
•  Lyrics Position.
•  Lyrics Animation Speed.
•  Word Highlight.
•  Active Line Highlight.
•  Lyrics Blur Effect.
•  Auto Scroll Lyrics.
•  Lyrics Offset / Synchronization Correction.

Lyrics Offset memungkinkan pengguna mengoreksi keterlambatan atau kecepatan sinkronisasi lirik.

Sediakan tombol Reset Offset.

## H. NOTIFICATION & KEYBOARD SETTINGS

Pengaturan:

•  Enable Desktop Media Session.
•  Enable Keyboard Shortcuts.
•  Enable Playback Notifications jika didukung browser.
•  Customize Keyboard Shortcuts jika memungkinkan.
•  Show Track Change Toast.
•  Notification Duration.

Pastikan shortcut tidak mengganggu input form dan tidak menyebabkan aksi ganda.

## I. SETTINGS PAGE UI/UX

Buat halaman Settings dengan desain premium dan konsisten dengan KinoVibe.

Gunakan kategori navigasi:

1. General.
2. Playback.
3. Audio Quality.
4. Equalizer.
5. Crossfade.
6. Lyrics.
7. Appearance.
8. Keyboard Shortcuts.
9. Privacy & Data.

Setiap kategori memiliki:

•  Judul.
•  Deskripsi.
•  Toggle.
•  Slider.
•  Select.
•  Informasi kompatibilitas.
•  Tombol reset jika relevan.

Gunakan layout sidebar untuk desktop dan navigasi yang lebih ringkas untuk mobile.

Pastikan pengaturan mudah dipahami pengguna awam.

## J. PERSISTENT SETTINGS

Semua preferensi pengguna harus tersimpan.

Gunakan pendekatan:

•  Zustand untuk state management.
•  Persist middleware atau mekanisme penyimpanan yang sesuai.
•  LocalStorage untuk preferensi non-sensitif.
•  Sinkronisasi ke Supabase jika memang diperlukan untuk preferensi lintas perangkat.

Ketentuan:

•  Pengaturan tetap tersimpan setelah refresh.
•  Pengaturan tidak hilang saat navigasi.
•  Perubahan diterapkan secara real-time jika memungkinkan.
•  Berikan default value yang aman.
•  Validasi nilai slider.
•  Tangani konfigurasi yang tidak valid.
•  Jangan menyimpan token atau credential di LocalStorage.

## K. SETTINGS ACCEPTANCE CRITERIA

•  [ ] Crossfade bekerja untuk audio upload yang kompatibel.
•  [ ] Durasi crossfade dapat diubah.
•  [ ] Crossfade dapat dinonaktifkan.
•  [ ] Pengaturan kualitas YouTube mengikuti kemampuan API aktual.
•  [ ] EQ bekerja untuk sumber audio yang kompatibel.
•  [ ] Preset EQ dapat digunakan.
•  [ ] Volume tersimpan.
•  [ ] Playback settings bekerja.
•  [ ] Lyrics settings bekerja.
•  [ ] Appearance settings bekerja.
•  [ ] Preferensi tersimpan setelah refresh.
•  [ ] Tidak ada kontrol pengaturan palsu.
•  [ ] Pengaturan mobile mudah digunakan.
•  [ ] Tidak ada konflik dengan player state.
•  [ ] Tidak menyebabkan memory leak atau audio instance ganda.

FINAL REQUIREMENT:

Buat KinoVibe memiliki sistem pengaturan yang setara dengan aplikasi music player premium, tetapi tetap ringan, intuitif, dan tidak membebani pengguna dengan terlalu banyak opsi yang tidak diperlukan.