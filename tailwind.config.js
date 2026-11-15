/** @type {import('tailwindcss').Config} */

// Tokens are CSS variables, so Tailwind cannot compute alpha itself. color-mix
// keeps `bg-kv-ink/70` working instead of silently emitting no rule at all.
const kv = (name) => ({ opacityValue, opacityVariable }) => {
  const base = `var(--kv-${name})`;
  const alpha = Number(opacityValue);
  if (Number.isFinite(alpha)) return `color-mix(in oklab, ${base} ${alpha * 100}%, transparent)`;
  if (opacityVariable) return `color-mix(in oklab, ${base} calc(var(${opacityVariable}) * 100%), transparent)`;
  return base;
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kv: {
          bg: kv('bg'),
          panel: kv('panel'),
          surface: kv('surface'),
          muted: kv('surface-muted'),
          ink: kv('ink'),
          'ink-muted': kv('ink-muted'),
          line: kv('line'),
          'line-strong': kv('line-strong'),
          yellow: kv('yellow'),
          pink: kv('pink'),
          blue: kv('blue'),
          green: kv('green'),
          orange: kv('orange'),
          purple: kv('purple'),
          red: kv('red'),
          danger: kv('danger'),
          accent: kv('accent'),
          'accent-ink': kv('accent-ink'),
          success: kv('success'),
          warning: kv('warning'),
          info: kv('info'),
        },
      },
      fontFamily: {
        display: ['Silkscreen', '"Space Mono"', 'ui-monospace', 'monospace'],
        body: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderWidth: {
        3: '3px',
      },
      spacing: {
        'kv-sidebar': 'var(--kv-sidebar-w)',
        'kv-rail': 'var(--kv-rail-w)',
        'kv-miniplayer': 'var(--kv-miniplayer-h)',
        'kv-bottomnav': 'var(--kv-bottomnav-h)',
      },
      boxShadow: {
        kv: 'var(--kv-shadow)',
        'kv-lg': 'var(--kv-shadow-lg)',
        'kv-pressed': 'var(--kv-shadow-pressed)',
      },
      borderRadius: {
        kv: 'var(--kv-radius)',
        'kv-lg': 'var(--kv-radius-lg)',
        'kv-panel': 'var(--kv-radius-panel)',
      },
      transitionTimingFunction: {
        kv: 'cubic-bezier(0.22, 0.9, 0.28, 1)',
      },
      animation: {
        'pop-in': 'popIn 0.22s cubic-bezier(0.22, 0.9, 0.28, 1)',
        'slide-up': 'slideUp 0.32s cubic-bezier(0.22, 0.9, 0.28, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'eq-1': 'eq 0.9s ease-in-out infinite',
        'eq-2': 'eq 0.7s ease-in-out infinite 0.15s',
        'eq-3': 'eq 1.1s ease-in-out infinite 0.3s',
        marquee: 'marquee 22s linear infinite',
        'spin-slow': 'spin 6s linear infinite',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.96) translateY(6px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};