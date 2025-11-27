import { Stage } from '../types/task';
import { TaskTemplate } from '../types/template';

export interface TemplateRenderData {
  title: string;
  stage: Stage;
  phase?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  content?: string;
}

export const DEFAULT_TEMPLATE_NAME = 'Default';

export const DEFAULT_TASK_TEMPLATE = `# {{title}}

## Summary
{{content}}

## Stage
{{stage}}

## Phase
{{phase}}

## Agent
{{agent}}

## Contexts
{{contexts}}

## Tags
{{tags}}
`;

export function renderTemplate(template: string, data: TemplateRenderData): string {
  const replacements: Record<string, string> = {
    title: data.title ?? '',
    stage: data.stage ?? '',
    phase: data.phase ?? '',
    agent: data.agent ?? '',
    contexts: (data.contexts ?? []).join(', '),
    tags: (data.tags ?? []).join(', '),
    content: data.content ?? '',
  };

  return template.replace(/{{\s*(\w+)\s*}}/g, (_match, key: string) => replacements[key] ?? '');
}

export function withDefaultTemplate(templates: TaskTemplate[]): TaskTemplate[] {
  const existingNames = new Set(templates.map((t) => t.name.toLowerCase()));
  const list = [...templates];

  if (!existingNames.has(DEFAULT_TEMPLATE_NAME.toLowerCase())) {
    list.unshift({ name: DEFAULT_TEMPLATE_NAME, content: DEFAULT_TASK_TEMPLATE });
  }

  return list;
}
