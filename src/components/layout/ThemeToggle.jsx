import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../hooks/useTheme';

const ORDER = ['light', 'dark', 'system'];
const ICONS = { light: Sun, dark: Moon, system: Monitor };
const LABELS = { light: 'Terang', dark: 'Gelap', system: 'Ikuti sistem' };

const ThemeToggle = ({ className }) => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const Icon = ICONS[theme] || Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])}
      aria-label={`Tema: ${LABELS[theme]}. Klik untuk ganti.`}
      title={`Tema: ${LABELS[theme]}`}
      className={`kv-press flex h-11 w-11 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-surface shadow-kv ${className || ''}`}
    >
      <Icon size={18} />
    </button>
  );
};

export default ThemeToggle;