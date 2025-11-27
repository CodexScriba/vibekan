export type ThemeName = 'dark-glass' | 'low-glow';

export interface ThemeTokens {
  name: ThemeName;
  label: string;
  background: {
    gradientStart: string;
    gradientEnd: string;
  };
  surfaces: {
    glass: string;
    card: string;
    button: string;
    muted: string;
  };
  borders: {
    default: string;
    strong: string;
    focus: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  accents: {
    primary: string;
    secondary: string;
    quiet: string;
  };
  shadows: {
    soft: string;
    strong: string;
  };
  blurs: {
    glass: string;
  };
  motion: {
    fast: string;
    medium: string;
    slow: string;
    stagger: string;
  };
  edgeLine: string;
}

export const DARK_GLASS: ThemeTokens = {
  name: 'dark-glass',
  label: 'Dark Glass',
  background: {
    gradientStart: '#050509',
    gradientEnd: '#090915',
  },
  surfaces: {
    glass: 'rgba(15, 20, 40, 0.72)',
    card: 'rgba(20, 25, 50, 0.82)',
    button: 'rgba(20, 25, 50, 0.82)',
    muted: 'rgba(20, 25, 50, 0.65)',
  },
  borders: {
    default: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.2)',
    focus: 'rgba(59, 245, 255, 0.7)',
  },
  text: {
    primary: '#F5F7FF',
    secondary: 'rgba(245, 247, 255, 0.72)',
  },
  accents: {
    primary: '#3BF5FF',
    secondary: '#FF3BCE',
    quiet: 'rgba(139, 92, 255, 0.5)',
  },
  shadows: {
    soft: '0 12px 40px rgba(0, 0, 0, 0.35)',
    strong: '0 16px 50px rgba(0, 0, 0, 0.45)',
  },
  blurs: {
    glass: '16px',
  },
  motion: {
    fast: '160ms',
    medium: '220ms',
    slow: '320ms',
    stagger: '60ms',
  },
  edgeLine: 'linear-gradient(180deg, rgba(59, 245, 255, 0.65), rgba(255, 59, 206, 0.35))',
};

export const LOW_GLOW: ThemeTokens = {
  name: 'low-glow',
  label: 'Low Glow',
  background: {
    gradientStart: '#050507',
    gradientEnd: '#0B0F18',
  },
  surfaces: {
    glass: 'rgba(12, 16, 28, 0.78)',
    card: 'rgba(18, 24, 40, 0.9)',
    button: 'rgba(18, 24, 40, 0.9)',
    muted: 'rgba(18, 24, 40, 0.75)',
  },
  borders: {
    default: 'rgba(255, 255, 255, 0.16)',
    strong: 'rgba(255, 255, 255, 0.26)',
    focus: 'rgba(255, 255, 255, 0.85)',
  },
  text: {
    primary: '#F7FAFF',
    secondary: 'rgba(247, 250, 255, 0.82)',
  },
  accents: {
    primary: '#5CE6FF',
    secondary: '#FF6AD5',
    quiet: 'rgba(140, 188, 255, 0.65)',
  },
  shadows: {
    soft: '0 10px 30px rgba(0, 0, 0, 0.3)',
    strong: '0 14px 44px rgba(0, 0, 0, 0.38)',
  },
  blurs: {
    glass: '12px',
  },
  motion: {
    fast: '150ms',
    medium: '210ms',
    slow: '280ms',
    stagger: '50ms',
  },
  edgeLine: 'linear-gradient(180deg, rgba(92, 230, 255, 0.5), rgba(140, 188, 255, 0.35))',
};

export const THEMES: Record<ThemeName, ThemeTokens> = {
  'dark-glass': DARK_GLASS,
  'low-glow': LOW_GLOW,
};

export const DEFAULT_THEME: ThemeName = 'dark-glass';

interface ApplyThemeOptions {
  reducedMotion?: boolean;
}

export function applyThemeTokens(theme: ThemeTokens, options: ApplyThemeOptions = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const reduced = !!options.reducedMotion;

  const setVar = (name: string, value: string) => {
    root.style.setProperty(name, value);
  };

  setVar('--bg-gradient-start', theme.background.gradientStart);
  setVar('--bg-gradient-end', theme.background.gradientEnd);
  setVar('--glass-bg', theme.surfaces.glass);
  setVar('--surface-card', theme.surfaces.card);
  setVar('--surface-button', theme.surfaces.button);
  setVar('--surface-muted', theme.surfaces.muted);
  setVar('--glass-border', theme.borders.default);
  setVar('--glass-border-strong', theme.borders.strong);
  setVar('--focus-outline', theme.borders.focus);
  setVar('--text-primary', theme.text.primary);
  setVar('--text-secondary', theme.text.secondary);
  setVar('--accent-primary', theme.accents.primary);
  setVar('--accent-secondary', theme.accents.secondary);
  setVar('--accent-quiet', theme.accents.quiet);
  setVar('--shadow-soft', theme.shadows.soft);
  setVar('--shadow-strong', theme.shadows.strong);
  setVar('--glass-blur', reduced ? '10px' : theme.blurs.glass);
  setVar('--motion-fast', reduced ? '0ms' : theme.motion.fast);
  setVar('--motion-medium', reduced ? '0ms' : theme.motion.medium);
  setVar('--motion-slow', reduced ? '0ms' : theme.motion.slow);
  setVar('--motion-stagger', reduced ? '0ms' : theme.motion.stagger);
  setVar('--edge-line', theme.edgeLine);

  root.dataset.theme = theme.name;
  root.dataset.reducedMotion = reduced ? 'true' : 'false';
}
