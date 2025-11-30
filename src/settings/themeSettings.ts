import * as vscode from 'vscode';

export type ThemeSettingName = 'dark-glass' | 'low-glow';

export interface ThemeSettings {
  theme: ThemeSettingName;
  reducedMotion: boolean;
}

export function getThemeSettings(): ThemeSettings {
  const config = vscode.workspace.getConfiguration('vibekan');
  const theme = config.get<string>('theme', 'dark-glass');
  const reducedMotion = config.get<boolean>('reducedMotion', false);

  const themeValue: ThemeSettingName = theme === 'low-glow' ? 'low-glow' : 'dark-glass';
  return { theme: themeValue, reducedMotion: !!reducedMotion };
}

export async function updateThemeSettingsConfig(theme: ThemeSettingName, reducedMotion: boolean): Promise<void> {
  const config = vscode.workspace.getConfiguration('vibekan');
  try {
    await config.update('theme', theme, vscode.ConfigurationTarget.Workspace);
    await config.update('reducedMotion', reducedMotion, vscode.ConfigurationTarget.Workspace);
  } catch (error) {
    console.error('[Vibekan] Failed to update theme settings', error);
  }
}
