export type Stage = 'chat' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';

export interface Task {
  id: string;
  title: string;
  stage: Stage;
  type?: string;
  phase?: string;
  agent?: string;
  tags?: string[];
  created: string;
  updated: string;
  filePath: string;
  userContent?: string;
  order?: number;
}

export const STAGES: Stage[] = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];

export const STAGE_LABELS: Record<Stage, string> = {
  chat: 'Chat',
  queue: 'Queue',
  plan: 'Plan',
  code: 'Code',
  audit: 'Audit',
  completed: 'Completed',
};

export const STAGE_ICONS: Record<Stage, string> = {
  chat: '💬',
  queue: '📋',
  plan: '📝',
  code: '💻',
  audit: '🔍',
  completed: '✅',
};
