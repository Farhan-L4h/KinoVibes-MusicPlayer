# 🎨 Animation Features Documentation

## Overview
Aplikasi KinoVibes Music Player telah ditingkatkan dengan berbagai animasi interaktif menggunakan GSAP (GreenSock Animation Platform) untuk memberikan pengalaman pengguna yang lebih menarik dan modern.

## 🌟 Fitur Animasi yang Ditambahkan

### 1. **Aurora Background Effect**
- **Lokasi**: Dashboard (Home & HomeYT)
- **Deskripsi**: Background animasi aurora dengan orbs berwarna yang bergerak smooth
- **Warna**: Purple, Blue, Pink, Cyan
- **Teknologi**: Canvas API + GSAP
- **File**: `src/components/AuroraBackground.jsx`

**Cara Kerja:**
```jsx
import AuroraBackground from '../components/AuroraBackground';

<AuroraBackground />
```

Komponen ini membuat 4 orbs dengan gradient radial yang bergerak di background dengan efek blur 80px untuk tampilan aurora yang lembut.

---

### 2. **Split Text Animation**
- **Lokasi**: Welcome message & Lyrics preview
- **Deskripsi**: Animasi teks yang muncul karakter per karakter dengan efek 3D
- **File**: `src/components/SplitText.jsx`

**Props:**
- `children`: Text yang akan dianimasikan
- `className`: Custom CSS classes
- `delay`: Delay sebelum animasi mulai (default: 0)
- `duration`: Durasi animasi per karakter (default: 0.6s)
- `stagger`: Jeda antar karakter (default: 0.03s)

**Contoh Penggunaan:**
```jsx
<SplitText className="text-4xl font-bold" delay={0.2}>
  Welcome back, User! 👋
</SplitText>
```

**Efek:**
- Setiap karakter muncul dari bawah dengan rotasi 3D
- Animasi menggunakan `back.out` easing untuk bounce effect
- Smooth stagger untuk efek bergelombang

---

### 3. **Auto Scroll Lyrics dengan GSAP**
- **Lokasi**: Lyrics Page
- **Deskripsi**: Scroll otomatis yang smooth mengikuti lirik yang sedang diputar
- **File**: `src/components/Lyrics.jsx`

**Fitur:**
- Auto-scroll yang center lirik aktif di tengah layar
- Split text animation untuk setiap baris lirik saat menjadi aktif
- Smooth scroll dengan GSAP (0.6s duration)
- Manual scroll detection (auto-scroll pause selama 3 detik)
- Click lirik untuk jump ke timestamp

**Animasi Lirik:**
```jsx
const LyricLine = forwardRef(({ line, isCurrent, isPast, onClick }, ref) => {
  // Split text animation saat lirik menjadi aktif
  // Character-by-character reveal dengan stagger 0.02s
});
```

---

### 4. **Page Transition**
- **Lokasi**: Semua halaman aplikasi
- **Deskripsi**: Smooth fade-in dan scale animation saat pindah halaman
- **File**: `src/components/PageTransition.jsx`

**Efek:**
- Fade in dari opacity 0 ke 1
- Scale dari 0.98 ke 1.0
- Duration: 0.6s dengan `power3.out` easing

**Implementasi:**
```jsx
<Route path="/" element={
  <PrivateRoute>
    <Layout>
      <PageTransition>
        <Home />
      </PageTransition>
    </Layout>
  </PrivateRoute>
} />
```

---

### 5. **Fade In View**
- **Lokasi**: Stats cards, content sections
- **Deskripsi**: Animasi fade-in dengan stagger untuk multiple elements
- **File**: `src/components/FadeInView.jsx`

**Props:**
- `children`: Elements yang akan dianimasikan
- `className`: Custom CSS classes
- `delay`: Delay sebelum animasi (default: 0)
- `duration`: Durasi animasi (default: 0.8s)
- `y`: Translate Y awal (default: 30px)
- `scale`: Scale awal (default: 0.95)
- `stagger`: Jeda antar child elements (default: 0.1s)

**Contoh:**
```jsx
<FadeInView className="grid grid-cols-4 gap-6" delay={1} stagger={0.15}>
  <StatsCard />
  <StatsCard />
  <StatsCard />
  <StatsCard />
</FadeInView>
```

---

### 6. **Hover Card with 3D Effect**
- **Lokasi**: Music cards, playlists
- **Deskripsi**: Interactive 3D tilt effect dengan glow
- **File**: `src/components/HoverCard.jsx`

**Fitur:**
- 3D tilt effect mengikuti posisi mouse
- Scale up saat hover (1.02x)
- Glow effect dengan gradient radial purple
- Smooth animation dengan GSAP

**Penggunaan:**
```jsx
<HoverCard className="retro-card p-6">
  <YourContent />
</HoverCard>
```

---

## 🎯 CSS Animations

### Custom Keyframes
File: `src/index.css`

**1. Fade In Up**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**2. Fade In**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Penggunaan:**
```jsx
<div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
  Content
</div>
```

---

## 📦 Dependencies

### GSAP (GreenSock Animation Platform)
```bash
npm install gsap
```

**Mengapa GSAP?**
- Performance terbaik untuk web animations
- Timeline control yang powerful
- Smooth 60fps animations
- Cross-browser compatibility
- Mudah digunakan dengan React

---

## 🚀 Performance Tips

1. **Use `will-change` CSS property** untuk animasi yang sering terjadi:
```css
.animated-element {
  will-change: transform, opacity;
}
```

2. **Animate transform dan opacity** (bukan left, top, width, height):
```jsx
// ✅ Good
gsap.to(element, { x: 100, opacity: 1 })

// ❌ Avoid
gsap.to(element, { left: 100 })
```

3. **Use `useRef` untuk DOM manipulation** dalam React:
```jsx
const elementRef = useRef(null);
gsap.to(elementRef.current, { x: 100 });
```

4. **Cleanup animations** di useEffect:
```jsx
useEffect(() => {
  const tl = gsap.timeline();
  // ... animations
  
  return () => tl.kill();
}, []);
```

---

## 🎨 Customization

### Mengubah Warna Aurora
Edit `src/components/AuroraBackground.jsx`:
```jsx
const colors = [
  { r: 139, g: 92, b: 246 },  // Purple - ubah values ini
  { r: 59, g: 130, b: 246 },  // Blue
  { r: 236, g: 72, b: 153 },  // Pink
  { r: 34, g: 211, b: 238 },  // Cyan
];
```

### Mengubah Timing Animasi
Edit props di komponen:
```jsx
<SplitText delay={0.5} duration={0.8} stagger={0.05}>
  Custom timing
</SplitText>
```

### Disable Animasi (untuk testing)
```jsx
// Set hasAnimated ke true untuk skip animasi
const hasAnimated = useRef(true); // skip animation
```

---

## 🐛 Troubleshooting

### Animasi tidak muncul
1. Cek apakah GSAP sudah terinstall: `npm list gsap`
2. Periksa console untuk error
3. Pastikan ref sudah terhubung ke DOM element

### Performance issues
1. Reduce jumlah animated elements
2. Lower stagger value
3. Disable aurora background di low-end devices

### Scroll tidak smooth
1. Cek browser support untuk smooth scroll
2. Pastikan container memiliki overflow-y-auto
3. Adjust GSAP duration (coba 0.3 - 0.8s)

---

## 📚 Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [GSAP React Guide](https://greensock.com/react/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

---

## ✨ Future Enhancements

Ide untuk pengembangan selanjutnya:

1. **Particle System** untuk background alternatif
2. **Music Visualizer** dengan audio reactive animations
3. **Gesture-based Interactions** untuk mobile
4. **Theme Transitions** dengan smooth color morphing
5. **Loading Skeleton** dengan shimmer effect
6. **Micro-interactions** untuk buttons dan controls

---

## 🎉 Summary

Aplikasi sekarang memiliki:
- ✅ Aurora background effect di dashboard
- ✅ Split text animations di welcome & lyrics
- ✅ Auto-scroll dengan GSAP di lyrics
- ✅ Page transitions yang smooth
- ✅ Fade-in stagger untuk content
- ✅ 3D hover effects
- ✅ CSS keyframe animations

Semua animasi dioptimalkan untuk performance dan memberikan pengalaman pengguna yang premium! 🚀
