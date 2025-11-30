import * as vscode from 'vscode';
import { TaskTemplate } from '../types/template';
import { slugify } from '../core';
import { ensureVibekanRoot } from '../workspace';
import { readTextIfExists, listFilesWithoutExtension, createTemplateFile } from './fileSystem';
import { withDefaultTemplate } from '../utils/templates';

export interface ContextData {
  phases: string[];
  agents: string[];
  contexts: string[];
  templates: TaskTemplate[];
}

export async function loadTemplates(vibekanUri: vscode.Uri | null): Promise<TaskTemplate[]> {
  if (!vibekanUri) return [];
  const templatesDir = vscode.Uri.joinPath(vibekanUri, '_templates');

  try {
    const entries = await vscode.workspace.fs.readDirectory(templatesDir);
    const templates: TaskTemplate[] = [];
    for (const [name, type] of entries) {
      if (type === vscode.FileType.File && name.endsWith('.md')) {
        const content = await readTextIfExists(vscode.Uri.joinPath(templatesDir, name));
        if (content) {
          templates.push({ name: name.replace(/\.md$/, ''), content });
        }
      }
    }
    templates.sort((a, b) => a.name.localeCompare(b.name));
    return templates;
  } catch {
    return [];
  }
}

export async function loadContextData(): Promise<ContextData> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) return { phases: [], agents: [], contexts: [], templates: withDefaultTemplate([]) };

  const phases = await listFilesWithoutExtension(vscode.Uri.joinPath(vibekanUri, '_context', 'phases'));
  const agents = await listFilesWithoutExtension(vscode.Uri.joinPath(vibekanUri, '_context', 'agents'));
  const contextsDir = vscode.Uri.joinPath(vibekanUri, '_context', 'custom');
  const customContexts = await listFilesWithoutExtension(contextsDir);
  const contexts = ['architecture', ...customContexts];
  const templates = withDefaultTemplate(await loadTemplates(vibekanUri));

  return { phases, agents, contexts, templates };
}

export async function createPhaseFile(vibekanUri: vscode.Uri, name: string, content?: string): Promise<string> {
  const slug = slugify(name);
  const target = vscode.Uri.joinPath(vibekanUri, '_context', 'phases', `${slug}.md`);
  const now = new Date().toISOString();
  const body =
    content && content.trim().length > 0
      ? content
      : `# ${name}\n\nDescribe the goals, scope, and constraints for this phase.\n\n_Last updated: ${now}_\n`;
  await createTemplateFile(target, body);
  return slug;
}

export async function createAgentFile(vibekanUri: vscode.Uri, name: string, content?: string): Promise<string> {
  const slug = slugify(name);
  const target = vscode.Uri.joinPath(vibekanUri, '_context', 'agents', `${slug}.md`);
  const body =
    content && content.trim().length > 0
      ? content
      : `# Agent: ${name}\n\n- Role: Describe responsibilities.\n- Voice & Style: Crisp, actionable.\n- Preferred Tools: List tools or stack.\n- Constraints: Note any boundaries.\n`;
  await createTemplateFile(target, body);
  return slug;
}

export async function createContextFile(vibekanUri: vscode.Uri, name: string, content?: string): Promise<string> {
  const slug = slugify(name);
  const target = vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${slug}.md`);
  const body =
    content && content.trim().length > 0
      ? content
      : `# Context: ${name}\n\nAdd design notes, requirements, or specs relevant to attached tasks.\n`;
  await createTemplateFile(target, body);
  return slug;
}
