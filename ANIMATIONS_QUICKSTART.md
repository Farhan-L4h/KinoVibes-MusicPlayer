# 🎬 Quick Start - Animations

## Cara Menggunakan Animasi yang Telah Dibuat

### 1. Aurora Background 🌌
**Taruh di page mana aja untuk background cantik!**

```jsx
import AuroraBackground from '../components/AuroraBackground';

function MyPage() {
  return (
    <div className="relative">
      <AuroraBackground />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

---

### 2. Split Text 📝
**Buat text muncul karakter-karakter dengan efek keren!**

```jsx
import SplitText from '../components/SplitText';

<SplitText className="text-4xl font-bold" delay={0.2} duration={0.6} stagger={0.03}>
  Welcome to KinoVibes! 🎵
</SplitText>
```

**Props:**
- `delay` - Tunggu berapa detik sebelum mulai (default: 0)
- `duration` - Berapa lama tiap karakter muncul (default: 0.6)
- `stagger` - Jarak waktu antar karakter (default: 0.03)

---

### 3. Fade In View 🌊
**Buat element muncul satu-satu dengan smooth!**

```jsx
import FadeInView from '../components/FadeInView';

<FadeInView delay={0.5} stagger={0.15}>
  <Card1 />
  <Card2 />
  <Card3 />
  <Card4 />
</FadeInView>
```

**Props:**
- `delay` - Tunggu sebelum mulai (default: 0)
- `duration` - Durasi animasi (default: 0.8)
- `y` - Geser dari bawah berapa pixel (default: 30)
- `scale` - Mulai dari scale berapa (default: 0.95)
- `stagger` - Jarak antar child (default: 0.1)

---

### 4. Music Wave 🎼
**Visualizer bar yang bergerak sesuai musik!**

```jsx
import MusicWave from '../components/MusicWave';

<MusicWave isPlaying={true} barCount={5} />
```

**Props:**
- `isPlaying` - true/false untuk start/stop animasi
- `barCount` - Jumlah bar (default: 5)

---

### 5. Pulse Ring 💫
**Ring yang expand untuk indicator!**

```jsx
import PulseRing from '../components/PulseRing';

<div className="relative">
  <PulseRing isActive={isCurrentSong} size="md" />
  <YourContent />
</div>
```

**Props:**
- `isActive` - true/false untuk show/hide
- `size` - 'sm', 'md', 'lg'

---

### 6. Hover Card 🎴
**3D tilt effect saat hover!**

```jsx
import HoverCard from '../components/HoverCard';

<HoverCard className="retro-card p-6">
  <h3>Card Title</h3>
  <p>Card content...</p>
</HoverCard>
```

Automatic 3D effect + glow! Tinggal wrap aja!

---

### 7. Page Transition 🚪
**Smooth transition saat pindah page!**

```jsx
import PageTransition from '../components/PageTransition';

<Route path="/page" element={
  <Layout>
    <PageTransition>
      <YourPage />
    </PageTransition>
  </Layout>
} />
```

---

## 🎨 CSS Animations

### Fade In Up
```jsx
<div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
  Content
</div>
```

### Fade In
```jsx
<div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
  Content
</div>
```

---

## 💡 Tips & Tricks

### 1. Delay untuk sequence animation
```jsx
<SplitText delay={0.2}>Title</SplitText>
<p className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
  Subtitle
</p>
```

### 2. Combine animations
```jsx
<FadeInView delay={1}>
  <HoverCard>
    <Card />
  </HoverCard>
  <HoverCard>
    <Card />
  </HoverCard>
</FadeInView>
```

### 3. Conditional animations
```jsx
{isPlaying && <MusicWave isPlaying={true} />}
{isCurrentSong && <PulseRing isActive={true} />}
```

---

## 🚀 Common Patterns

### Dashboard Hero Section
```jsx
<div className="relative">
  <AuroraBackground />
  <div className="relative z-10">
    <SplitText delay={0.2} className="text-5xl font-bold">
      Welcome Back!
    </SplitText>
    <p className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
      Ready to listen?
    </p>
  </div>
</div>
```

### Stats Cards
```jsx
<FadeInView delay={1} stagger={0.15} className="grid grid-cols-4 gap-6">
  <HoverCard><StatsCard icon="music" value="150" label="Songs" /></HoverCard>
  <HoverCard><StatsCard icon="clock" value="24h" label="Played" /></HoverCard>
  <HoverCard><StatsCard icon="heart" value="89" label="Favorites" /></HoverCard>
  <HoverCard><StatsCard icon="list" value="12" label="Playlists" /></HoverCard>
</FadeInView>
```

### Now Playing Card
```jsx
<HoverCard className="bg-gray-800 rounded-xl p-4">
  <div className="relative">
    <PulseRing isActive={isPlaying} size="lg" />
    <img src={albumArt} className="rounded-lg" />
  </div>
  <div className="mt-4">
    <h3>{title}</h3>
    <p>{artist}</p>
    <MusicWave isPlaying={isPlaying} barCount={5} />
  </div>
</HoverCard>
```

---

## 🎯 Best Practices

### DO ✅
- Use aurora di page utama/hero sections
- Combine multiple animations untuk effect maksimal
- Set appropriate delays untuk flow yang natural
- Use hover effects di interactive elements
- Test di mobile devices

### DON'T ❌
- Jangan overuse - terlalu banyak animasi = confusing
- Jangan set delay terlalu lama (> 2s)
- Jangan animate heavy elements (large images)
- Jangan nest terlalu dalam
- Jangan lupa cleanup di useEffect

---

## 🐛 Troubleshooting

### Animasi tidak muncul?
```jsx
// Cek apakah ref sudah attached
const ref = useRef(null);
console.log(ref.current); // Should not be null

// Pastikan parent memiliki height
<div className="h-screen">
  <YourAnimatedComponent />
</div>
```

### Animasi lag?
```jsx
// Reduce complexity
<AuroraBackground /> {/* Remove if lag */}
<FadeInView stagger={0.05}> {/* Reduce stagger */}
```

### Animasi repeat terus?
```jsx
// Add hasAnimated ref
const hasAnimated = useRef(false);
if (hasAnimated.current) return;
// ... do animation
hasAnimated.current = true;
```

---

## 📚 More Info

- Full documentation: `ANIMATIONS_GUIDE.md`
- Implementation details: `ANIMATION_IMPLEMENTATION.md`
- GSAP docs: https://greensock.com/docs/

---

## 🎉 Have Fun!

Sekarang kamu punya semua tools untuk bikin aplikasi yang **KECE BADAI**! 🚀

**Questions?** Check dokumentasi lengkap di `ANIMATIONS_GUIDE.md`

**Found a bug?** No problem, tinggal tweak aja parameter-nya!

**Need more?** Combine-combine animations yang ada, endless possibilities! 🌟
