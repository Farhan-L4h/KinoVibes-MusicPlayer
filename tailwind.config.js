/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kv: {
          bg: 'var(--kv-bg)',
          surface: 'var(--kv-surface)',
          muted: 'var(--kv-surface-muted)',
          ink: 'var(--kv-ink)',
          'ink-muted': 'var(--kv-ink-muted)',
          yellow: 'var(--kv-yellow)',
          pink: 'var(--kv-pink)',
          blue: 'var(--kv-blue)',
          green: 'var(--kv-green)',
          orange: 'var(--kv-orange)',
          purple: 'var(--kv-purple)',
          red: 'var(--kv-red)',
          danger: 'var(--kv-danger)',
          accent: 'var(--kv-accent)',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderWidth: {
        3: '3px',
      },
      spacing: {
        'kv-sidebar': 'var(--kv-sidebar-w)',
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
      },
      transitionTimingFunction: {
        kv: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      animation: {
        'pop-in': 'popIn 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slideUp 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'eq-1': 'eq 0.9s ease-in-out infinite',
        'eq-2': 'eq 0.7s ease-in-out infinite 0.15s',
        'eq-3': 'eq 1.1s ease-in-out infinite 0.3s',
        marquee: 'marquee 22s linear infinite',
        'spin-slow': 'spin 6s linear infinite',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
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