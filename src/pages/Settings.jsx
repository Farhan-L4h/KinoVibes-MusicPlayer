import { useState } from 'react';
import {
  Settings2,
  PlayCircle,
  AudioLines,
  SlidersHorizontal,
  Blend,
  Mic2,
  Palette,
  Keyboard,
  ShieldCheck,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '../stores/settings';
import { useMusicStore } from '../stores/music';
import { useThemeStore } from '../hooks/useTheme';
import { EQ_BANDS, EQ_PRESETS } from '../player/analyser';
import { ytPlayer } from '../player/youtube';
import { toast } from '../stores/toast';
import Toggle from '../components/ui/Toggle';
import Slider from '../components/ui/Slider';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

const SECTIONS = [
  { id: 'general', label: 'Umum', icon: Settings2 },
  { id: 'playback', label: 'Pemutaran', icon: PlayCircle },
  { id: 'quality', label: 'Kualitas Audio', icon: AudioLines },
  { id: 'equalizer', label: 'Equalizer', icon: SlidersHorizontal },
  { id: 'crossfade', label: 'Crossfade', icon: Blend },
  { id: 'lyrics', label: 'Lirik', icon: Mic2 },
  { id: 'appearance', label: 'Tampilan', icon: Palette },
  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
  { id: 'privacy', label: 'Privasi & Data', icon: ShieldCheck },
];

const EQ_PRESET_LABELS = {
  flat: 'Flat',
  'bass-boost': 'Bass Boost',
  'treble-boost': 'Treble Boost',
  vocal: 'Vocal',
  classical: 'Classical',
  electronic: 'Electronic',
  rock: 'Rock',
  pop: 'Pop',
  custom: 'Custom',
};

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto (disarankan)' },
  { value: 'medium', label: '360p' },
  { value: 'large', label: '480p' },
  { value: 'hd720', label: '720p' },
  { value: 'hd1080', label: '1080p' },
  { value: 'highres', label: 'Tertinggi' },
];

const SHORTCUTS = [
  ['F10 / Ctrl+Shift+←', 'Lagu sebelumnya'],
  ['F11 / Ctrl+Shift+→', 'Lagu berikutnya'],
  ['Space', 'Putar / jeda'],
  ['← / →', 'Mundur / maju 5 detik'],
  ['M', 'Bisukan / bunyikan'],
  ['L', 'Buka lirik (Now Playing)'],
  ['/', 'Fokus pencarian'],
  ['Esc', 'Tutup modal / Now Playing'],
];

const Section = ({ title, description, children, onReset }) => (
  <section className="kv-card space-y-1 p-4 sm:p-6">
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-kv-ink-muted">{description}</p>}
      </div>
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 px-3">
          <RotateCcw size={13} /> Reset
        </Button>
      )}
    </div>
    <div className="divide-y divide-kv-line/70">{children}</div>
  </section>
);

const RangeRow = ({ id, label, description, value, min = 0, max = 100, step = 1, format, onChange, disabled }) => (
  <div className={cn('py-3', disabled && 'opacity-50')}>
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <span className="font-mono text-xs tabular-nums text-kv-ink-muted">{format ? format(value) : value}</span>
    </div>
    {description && <p className="mt-0.5 text-xs leading-relaxed text-kv-ink-muted">{description}</p>}
    <Slider
      id={id}
      className="mt-2"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </div>
);

const InfoNote = ({ children }) => (
  <p className="flex gap-2 py-3 text-xs leading-relaxed text-kv-ink-muted">
    <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);

const SettingsPage = () => {
  const settings = useSettingsStore();
  const update = settings.update;
  const resetKeys = settings.resetKeys;
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const autoplay = useMusicStore((s) => s.autoplay);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const [actualQuality, setActualQuality] = useState(null);
  const [active, setActive] = useState('general');

  const changeEqPreset = (preset) => {
    if (preset === 'custom') {
      update({ eqPreset: preset });
      return;
    }
    update({ eqPreset: preset, eqGains: EQ_PRESETS[preset] || EQ_PRESETS.flat });
  };

  const changeEqGain = (index, value) => {
    const next = [...settings.eqGains];
    next[index] = value;
    update({ eqGains: next, eqPreset: 'custom' });
  };

  const clearLocal = (label, keys) => {
    for (const key of keys) localStorage.removeItem(key);
    toast.success(`${label} dihapus`);
  };

  const checkQuality = () => {
    const q = ytPlayer.getActualQuality();
    setActualQuality(q);
    toast.info(q ? `Kualitas YouTube aktif: ${q}` : 'Belum ada video YouTube yang aktif.');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="font-display text-xl leading-relaxed sm:text-2xl">Pengaturan</h1>
        <p className="mt-1 text-sm text-kv-ink-muted">
          Preferensi tersimpan di perangkat ini dan langsung diterapkan ke pemutar.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
        <nav aria-label="Kategori pengaturan" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActive(id)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors lg:rounded-kv',
                active === id
                  ? 'bg-kv-ink text-kv-panel'
                  : 'text-kv-ink-muted hover:bg-kv-muted hover:text-kv-ink'
              )}
            >
              <Icon size={15} />
              {label}
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          <div id="general" className="scroll-mt-4">
            <Section
              title="Umum"
              description="Perilaku dasar aplikasi saat dibuka kembali."
              onReset={() => resetKeys(['resumeSession', 'rememberPosition', 'rememberVolume'])}
            >
              <Toggle
                id="resume-session"
                label="Lanjutkan sesi terakhir"
                description="Kembalikan lagu dan antrean terakhir setelah refresh atau membuka aplikasi lagi."
                checked={settings.resumeSession}
                onChange={(v) => update({ resumeSession: v })}
              />
              <Toggle
                id="remember-position"
                label="Ingat posisi pemutaran"
                description="Lanjutkan dari detik terakhir saat sesi dipulihkan."
                checked={settings.rememberPosition}
                onChange={(v) => update({ rememberPosition: v })}
              />
              <Toggle
                id="remember-volume"
                label="Ingat volume"
                description="Simpan level volume dan status bisu antar sesi."
                checked={settings.rememberVolume}
                onChange={(v) => update({ rememberVolume: v })}
              />
            </Section>
          </div>

          <div id="playback" className="scroll-mt-4">
            <Section
              title="Pemutaran"
              description="Kontrol antrean, rekomendasi, dan volume."
              onReset={() => resetKeys(['autoPlayOnSelect', 'smartRecommendations'])}
            >
              <Toggle
                id="autoplay-next"
                label="Autoplay lagu berikutnya"
                description="Lanjut otomatis saat antrean habis."
                checked={autoplay}
                onChange={(v) => useMusicStore.getState().setAutoplay(v)}
              />
              <Toggle
                id="smart-recommendations"
                label="Rekomendasi pintar"
                description="Isi Up Next dengan lagu terkait dari artis dan metadata yang sama, bukan lagu acak."
                checked={settings.smartRecommendations}
                onChange={(v) => update({ smartRecommendations: v })}
              />
              <Toggle
                id="auto-play-select"
                label="Putar otomatis saat memilih lagu"
                description="Matikan untuk memuat lagu dalam keadaan jeda."
                checked={settings.autoPlayOnSelect}
                onChange={(v) => update({ autoPlayOnSelect: v })}
              />
              <Toggle
                id="shuffle-default"
                label="Mode acak"
                checked={shuffle}
                onChange={(v) => useMusicStore.getState().setShuffle(v)}
              />
              <div className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Mode ulang</p>
                  <p className="mt-0.5 text-xs text-kv-ink-muted">Ulangi satu lagu, seluruh antrean, atau mati.</p>
                </div>
                <Select
                  label="Mode ulang"
                  value={repeat}
                  onChange={(e) => useMusicStore.getState().setRepeat(e.target.value)}
                  options={[
                    { value: 'off', label: 'Mati' },
                    { value: 'all', label: 'Semua' },
                    { value: 'one', label: 'Satu lagu' },
                  ]}
                />
              </div>
              <RangeRow
                id="master-volume"
                label="Volume master"
                value={Math.round(volume * 100)}
                max={100}
                format={(v) => `${v}%`}
                onChange={(v) => useMusicStore.getState().setVolume(v / 100)}
              />
              <Toggle
                id="mute-toggle"
                label="Bisukan"
                checked={muted}
                onChange={() => useMusicStore.getState().toggleMute()}
              />
              <InfoNote>
                Gapless playback belum didukung untuk YouTube dan Spotify karena keterbatasan API resmi. Lagu upload
                memakai transisi normal; aktifkan Crossfade untuk transisi bertumpuk.
              </InfoNote>
            </Section>
          </div>

          <div id="quality" className="scroll-mt-4">
            <Section
              title="Kualitas Audio"
              description="Kualitas hanya berlaku jika sumber mendukungnya."
              onReset={() => resetKeys(['youtubeQuality'])}
            >
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Kualitas YouTube</p>
                  <p className="mt-0.5 text-xs text-kv-ink-muted">
                    IFrame API memperlakukan pilihan ini sebagai saran. Resolusi aktual bisa lebih rendah
                    tergantung video dan jaringan.
                  </p>
                </div>
                <Select
                  label="Kualitas YouTube"
                  value={settings.youtubeQuality}
                  onChange={(e) => update({ youtubeQuality: e.target.value })}
                  options={QUALITY_OPTIONS}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 py-3">
                <Button size="sm" variant="secondary" onClick={checkQuality}>Periksa kualitas aktual</Button>
                <span className="font-mono text-xs text-kv-ink-muted">{actualQuality || 'belum diperiksa'}</span>
              </div>
              <InfoNote>
                Spotify Web Playback SDK mengatur kualitas sendiri (normal/high tergantung akun dan jaringan), jadi
                tidak ada pilihan resolusi palsu di sini.
              </InfoNote>
              {currentTrack && (
                <InfoNote>
                  Lagu aktif: {currentTrack.source === 'spotify' ? 'Spotify' : currentTrack.source === 'youtube' ? 'YouTube' : 'Upload'}
                  {currentTrack.audioPath ? ` · file ${currentTrack.audioPath.split('.').pop()?.toUpperCase()}` : ''}
                  {currentTrack.duration ? ` · ${Math.round(currentTrack.duration)} detik` : ''}. Detail bitrate/sample rate
                  tidak disimpan aplikasi dan tidak dihitung ulang.
                </InfoNote>
              )}
            </Section>
          </div>

          <div id="equalizer" className="scroll-mt-4">
            <Section
              title="Equalizer"
              description="BiquadFilter 7 band."
              onReset={() => resetKeys(['eqEnabled', 'eqPreset', 'eqGains'])}
            >
              <Toggle
                id="eq-enabled"
                label="Aktifkan equalizer"
                description="Hanya berlaku pada audio yang bisa diproses Web Audio API (upload dan preview Spotify)."
                checked={settings.eqEnabled}
                onChange={(v) => update({ eqEnabled: v })}
              />
              <div className="flex items-center justify-between gap-3 py-3">
                <label htmlFor="eq-preset" className="text-sm font-semibold">Preset</label>
                <Select
                  id="eq-preset"
                  label="Preset equalizer"
                  value={settings.eqPreset}
                  onChange={(e) => changeEqPreset(e.target.value)}
                  options={Object.keys(EQ_PRESET_LABELS).map((value) => ({ value, label: EQ_PRESET_LABELS[value] }))}
                />
              </div>
              {EQ_BANDS.map((freq, i) => (
                <RangeRow
                  key={freq}
                  id={`eq-${freq}`}
                  label={freq >= 1000 ? `${freq / 1000} kHz` : `${freq} Hz`}
                  value={settings.eqGains[i]}
                  min={-12}
                  max={12}
                  step={0.5}
                  disabled={!settings.eqEnabled}
                  format={(v) => `${v > 0 ? '+' : ''}${v} dB`}
                  onChange={(v) => changeEqGain(i, v)}
                />
              ))}
              <InfoNote>
                YouTube iframe dan Spotify SDK tidak mengizinkan akses audio untuk filter, jadi EQ tidak berlaku di
                sumber tersebut. Status ini bukan tombol kosong.
              </InfoNote>
            </Section>
          </div>

          <div id="crossfade" className="scroll-mt-4">
            <Section
              title="Crossfade"
              description="Transisi volume bertumpuk antar lagu."
              onReset={() => resetKeys(['crossfadeEnabled', 'crossfadeSeconds'])}
            >
              <Toggle
                id="crossfade-enabled"
                label="Aktifkan crossfade"
                checked={settings.crossfadeEnabled}
                onChange={(v) => update({ crossfadeEnabled: v })}
                description="Lagu berikutnya mulai sebelum lagu sekarang selesai, dengan volume saling bertukar."
              />
              <RangeRow
                id="crossfade-seconds"
                label="Durasi crossfade"
                description="0 detik berarti transisi normal."
                value={settings.crossfadeSeconds}
                max={12}
                step={1}
                disabled={!settings.crossfadeEnabled}
                format={(v) => `${v} detik`}
                onChange={(v) => update({ crossfadeSeconds: v })}
              />
              <InfoNote>
                Crossfade penuh hanya untuk lagu upload (Howler). YouTube dan Spotify memakai transisi normal karena
                API resmi tidak menyediakan dua dek audio yang bisa diatur volumenya secara bersamaan.
              </InfoNote>
            </Section>
          </div>

          <div id="lyrics" className="scroll-mt-4">
            <Section
              title="Lirik"
              description="Tampilan dan sinkronisasi lirik."
              onReset={() => resetKeys(['lyricsFontScale', 'lyricsSpeed', 'lyricsBlur', 'lyricsActiveHighlight', 'lyricsAutoScroll', 'lyricsOffsetMs'])}
            >
              <RangeRow
                id="lyrics-scale"
                label="Ukuran font lirik"
                value={settings.lyricsFontScale}
                min={0.8}
                max={1.8}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => update({ lyricsFontScale: v })}
              />
              <RangeRow
                id="lyrics-speed"
                label="Kecepatan animasi"
                description="Lebih tinggi berarti transisi lebih cepat."
                value={settings.lyricsSpeed}
                min={0.4}
                max={2}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(v) => update({ lyricsSpeed: v })}
              />
              <Toggle
                id="lyrics-blur"
                label="Efek blur"
                description="Baris non-aktif tampak blur dan fokus saat menjadi aktif."
                checked={settings.lyricsBlur}
                onChange={(v) => update({ lyricsBlur: v })}
              />
              <Toggle
                id="lyrics-highlight"
                label="Sorot baris aktif"
                description="Baris aktif membesar dan mendapat bayangan cahaya."
                checked={settings.lyricsActiveHighlight}
                onChange={(v) => update({ lyricsActiveHighlight: v })}
              />
              <Toggle
                id="lyrics-autoscroll"
                label="Gulir otomatis"
                description="Lirik mengikuti posisi pemutaran; gulir manual tetap bisa mematikan sementara."
                checked={settings.lyricsAutoScroll}
                onChange={(v) => update({ lyricsAutoScroll: v })}
              />
              <RangeRow
                id="lyrics-offset"
                label="Offset sinkronisasi global"
                description="Koreksi keterlambatan semua lagu. Offset per lagu tetap tersedia di tampilan lirik."
                value={settings.lyricsOffsetMs}
                min={-2000}
                max={2000}
                step={50}
                format={(v) => `${v > 0 ? '+' : ''}${v} ms`}
                onChange={(v) => update({ lyricsOffsetMs: v })}
              />
            </Section>
          </div>

          <div id="appearance" className="scroll-mt-4">
            <Section
              title="Tampilan"
              description="Tema monokrom tetap menjadi default."
              onReset={() => resetKeys(['ambientArtwork', 'animatedArtwork', 'visualizerEnabled', 'visualizerStyle', 'reduceMotion', 'compactPlayer'])}
            >
              <div className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Tema</p>
                  <p className="mt-0.5 text-xs text-kv-ink-muted">Terang, gelap, atau ikuti sistem.</p>
                </div>
                <Select
                  label="Tema"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  options={[
                    { value: 'system', label: 'Sistem' },
                    { value: 'dark', label: 'Gelap' },
                    { value: 'light', label: 'Terang' },
                  ]}
                />
              </div>
              <Toggle
                id="ambient-art"
                label="Ambient artwork"
                description="Warna cover menyinari latar aplikasi."
                checked={settings.ambientArtwork}
                onChange={(v) => update({ ambientArtwork: v })}
              />
              <Toggle
                id="animated-art"
                label="Artwork bergerak"
                description="Cover melayang halus saat musik diputar."
                checked={settings.animatedArtwork}
                onChange={(v) => update({ animatedArtwork: v })}
              />
              <Toggle
                id="visualizer-enabled"
                label="Visualizer"
                description="Spektrum/waveform di pemutar."
                checked={settings.visualizerEnabled}
                onChange={(v) => update({ visualizerEnabled: v })}
              />
              <div className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">Gaya visualizer</p>
                  <p className="mt-0.5 text-xs text-kv-ink-muted">
                    FFT asli dipakai saat audio bisa diakses; sumber lain memakai fallback jujur.
                  </p>
                </div>
                <Select
                  label="Gaya visualizer"
                  value={settings.visualizerStyle}
                  disabled={!settings.visualizerEnabled}
                  onChange={(e) => update({ visualizerStyle: e.target.value })}
                  options={[
                    { value: 'wave', label: 'Waveform' },
                    { value: 'bars', label: 'Spectrum' },
                  ]}
                />
              </div>
              <Toggle
                id="reduce-motion"
                label="Kurangi animasi"
                description="Hormati prefers-reduced-motion dan matikan animasi dekoratif."
                checked={settings.reduceMotion}
                onChange={(v) => update({ reduceMotion: v })}
              />
              <Toggle
                id="compact-player"
                label="Mini player ringkas"
                description="Sembunyikan visualizer di mini player agar ruang layar lebih lega."
                checked={settings.compactPlayer}
                onChange={(v) => update({ compactPlayer: v })}
              />
            </Section>
          </div>

          <div id="keyboard" className="scroll-mt-4">
            <Section title="Keyboard Shortcuts" description="Shortcut aktif kecuali saat mengetik di input.">
              <Toggle
                id="keyboard-enabled"
                label="Aktifkan shortcut keyboard"
                checked={settings.keyboardShortcuts}
                onChange={(v) => update({ keyboardShortcuts: v })}
              />
              <div className="py-3">
                <ul className="space-y-1.5">
                  {SHORTCUTS.map(([keys, action]) => (
                    <li key={keys} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono font-bold text-kv-ink">{keys}</span>
                      <span className="text-right text-kv-ink-muted">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <InfoNote>
                Browser dapat mengambil alih F11 untuk fullscreen. Gunakan Ctrl+Shift+← / → sebagai alternatif yang
                selalu tersedia.
              </InfoNote>
            </Section>
          </div>

          <div id="privacy" className="scroll-mt-4">
            <Section title="Privasi & Data" description="Data lokal, media session, dan notifikasi.">
              <Toggle
                id="media-session"
                label="Desktop Media Session"
                description="Tampilkan lagu aktif di kontrol media sistem dan kunci layar."
                checked={settings.mediaSessionEnabled}
                onChange={(v) => update({ mediaSessionEnabled: v })}
              />
              <Toggle
                id="track-toast"
                label="Toast perubahan lagu"
                description="Notifikasi kecil setiap lagu berganti."
                checked={settings.trackChangeToast}
                onChange={(v) => update({ trackChangeToast: v })}
              />
              <RangeRow
                id="toast-duration"
                label="Durasi notifikasi"
                value={settings.toastDurationMs}
                min={1000}
                max={8000}
                step={500}
                format={(v) => `${(v / 1000).toFixed(1)} detik`}
                onChange={(v) => update({ toastDurationMs: v })}
              />
              <InfoNote>
                Yang disimpan hanya preferensi dan cache lokal (riwayat pencarian, lagu terakhir). Token autentikasi
                tidak pernah disimpan di pengaturan ini.
              </InfoNote>
              <div className="flex flex-wrap gap-2 py-3">
                <Button size="sm" variant="secondary" onClick={() => clearLocal('Riwayat pencarian', ['kv-searches'])}>
                  Hapus riwayat pencarian
                </Button>
                <Button size="sm" variant="secondary" onClick={() => clearLocal('Lagu terakhir diputar', ['kv-recent'])}>
                  Hapus recently played
                </Button>
                <Button size="sm" variant="secondary" onClick={() => clearLocal('Sesi pemutaran', ['kv-session'])}>
                  Hapus sesi pemutaran
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    settings.resetAll();
                    toast.success('Semua pengaturan dikembalikan ke default');
                  }}
                >
                  Reset semua pengaturan
                </Button>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
