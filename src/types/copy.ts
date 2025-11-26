export type CopyMode = 'full' | 'task' | 'context';

export interface CopySettings {
  defaultMode: CopyMode;
  includeTimestamps: boolean;
  includeArchitecture: boolean;
  xmlFormatting: 'pretty' | 'compact';
  showToast: boolean;
  toastDuration: number;
}

export interface CopySuccessMessage {
  type: 'copySuccess';
  characterCount: number;
  mode: CopyMode;
  duration?: number;
  showToast?: boolean;
}

export interface CopyErrorMessage {
  type: 'copyError';
  error: string;
}

export interface CopySettingsMessage {
  type: 'copySettings';
  settings: CopySettings;
}
