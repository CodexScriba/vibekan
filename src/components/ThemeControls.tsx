import React from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeName } from '../theme/tokens';

const THEME_LABELS: Record<ThemeName, string> = {
  'dark-glass': 'Dark Glass',
  'low-glow': 'Low Glow',
};

export const ThemeControls: React.FC = () => {
  const { themeName, setThemeName, reducedMotion, setReducedMotion } = useTheme();

  return (
    <div className="theme-controls" aria-label="Theme and motion controls">
      <div className="theme-pill-group" role="group" aria-label="Theme selection">
        {(Object.keys(THEME_LABELS) as ThemeName[]).map((name) => (
          <button
            key={name}
            className={`theme-pill ${themeName === name ? 'active' : ''}`}
            onClick={() => setThemeName(name)}
            type="button"
          >
            {THEME_LABELS[name]}
          </button>
        ))}
      </div>

      <button
        className={`theme-pill reduced ${reducedMotion ? 'active' : ''}`}
        onClick={() => setReducedMotion(!reducedMotion)}
        type="button"
        aria-pressed={reducedMotion}
      >
        {reducedMotion ? 'Reduced motion' : 'Motion on'}
      </button>
    </div>
  );
};
