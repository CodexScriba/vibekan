export type Stage = 'idea' | 'queue' | 'plan' | 'code' | 'audit' | 'completed';

export interface Task {
  id: string;
  title: string;
  stage: Stage;
  type?: string;
  phase?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  created: string;
  updated: string;
  filePath: string;
  userContent?: string;
  order?: number;
}

export const STAGES: Stage[] = ['idea', 'queue', 'plan', 'code', 'audit', 'completed'];

export const STAGE_LABELS: Record<Stage, string> = {
  idea: 'Idea',
  queue: 'Queue',
  plan: 'Plan',
  code: 'Code',
  audit: 'Audit',
  completed: 'Completed',
};

export const STAGE_ICONS: Record<Stage, string> = {
  idea: '💡',
  queue: '📋',
  plan: '📝',
  code: '💻',
  audit: '🔍',
  completed: '✅',
};
