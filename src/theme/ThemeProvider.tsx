import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_THEME, THEMES, ThemeName, ThemeTokens, applyThemeTokens } from './tokens';
import { getVsCodeApi } from '../utils/vscode';
import { ThemeSettings } from '../types/theme';

interface ThemeContextValue {
  themeName: ThemeName;
  tokens: ThemeTokens;
  reducedMotion: boolean;
  setThemeName: (theme: ThemeName) => void;
  setReducedMotion: (reduced: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const vscode = getVsCodeApi();
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME);
  const [reducedMotion, setReducedMotionState] = useState<boolean>(getSystemReducedMotion());
  const suppressBroadcastRef = useRef(false);
  const hasReceivedSettingsRef = useRef(!vscode);

  useEffect(() => {
    applyThemeTokens(THEMES[themeName], { reducedMotion });

    if (suppressBroadcastRef.current || !hasReceivedSettingsRef.current || !vscode) {
      suppressBroadcastRef.current = false;
      return;
    }

    vscode.postMessage({ command: 'setThemeSettings', theme: themeName, reducedMotion });
  }, [themeName, reducedMotion, vscode]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = event.data as { type?: string; settings?: ThemeSettings };
      if (message?.type === 'themeSettings' && message.settings) {
        hasReceivedSettingsRef.current = true;
        suppressBroadcastRef.current = true;
        setThemeNameState(message.settings.theme);
        setReducedMotionState(message.settings.reducedMotion);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const handler = (event: MediaQueryListEvent) => setReducedMotionState(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    themeName,
    tokens: THEMES[themeName],
    reducedMotion,
    setThemeName: (name: ThemeName) => setThemeNameState(name),
    setReducedMotion: (value: boolean) => setReducedMotionState(value),
  }), [themeName, reducedMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
