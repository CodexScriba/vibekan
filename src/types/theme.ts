import { ThemeName } from '../theme/tokens';

export interface ThemeSettings {
  theme: ThemeName;
  reducedMotion: boolean;
}

export interface ThemeSettingsMessage {
  type: 'themeSettings';
  settings: ThemeSettings;
}
