import * as vscode from 'vscode';
import { CopyMode, CopySettings } from '../types/copy';

export function resolveCopyMode(mode: string | undefined, fallback: CopyMode): CopyMode {
  if (mode === 'task' || mode === 'context' || mode === 'full') {
    return mode;
  }
  return fallback;
}

export function getCopySettings(): CopySettings {
  const config = vscode.workspace.getConfiguration('vibekan');
  const defaultMode = config.get<string>('copyMode.default', 'full');
  const xmlFormatting = config.get<string>('copyMode.xmlFormatting', 'pretty');

  return {
    defaultMode: resolveCopyMode(defaultMode, 'full'),
    includeTimestamps: config.get<boolean>('copyMode.includeTimestamps', true),
    includeArchitecture: config.get<boolean>('copyMode.includeArchitecture', true),
    xmlFormatting: xmlFormatting === 'compact' ? 'compact' : 'pretty',
    showToast: config.get<boolean>('copyMode.showToast', true),
    toastDuration: config.get<number>('copyMode.toastDuration', 3000),
  };
}
