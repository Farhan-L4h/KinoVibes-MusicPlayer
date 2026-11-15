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
      className={`kv-press flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-kv-line bg-kv-surface text-kv-ink hover:bg-kv-muted ${className || ''}`}
    >
      <Icon size={16} />
    </button>
  );
};

export default ThemeToggle;