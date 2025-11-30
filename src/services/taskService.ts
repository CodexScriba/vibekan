import * as vscode from 'vscode';
import * as path from 'path';
import { Task, Stage, ALL_STAGES } from '../types/task';
import { LEGACY_STAGE_ALIASES, inferStageFromUri, parseFrontmatterDocument, slugify, stringifyDocument, ParsedFrontmatter, normalizeStage } from '../core';
import { migrateLegacyStages, ensureVibekanRoot } from '../workspace';
import { ensureDirectory, readTextIfExists } from './fileSystem';
import { ensureUniqueTaskId } from './taskMoveService';
import { withDefaultTemplate, DEFAULT_TASK_TEMPLATE, renderTemplate } from '../utils/templates';
import { loadTemplates } from './contextService';

export async function parseTaskFile(fileUri: vscode.Uri, fallbackStage?: Stage): Promise<Task | null> {
  try {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const text = Buffer.from(content).toString('utf8');
    const fileName = path.basename(fileUri.fsPath, '.md');
    const pathStage = inferStageFromUri(fileUri, fallbackStage);
    if (!pathStage) {
      console.warn('[Vibekan] Unknown stage for file:', fileUri.fsPath);
      return null;
    }
    
    let fileStat: vscode.FileStat | null = null;
    try {
      fileStat = await vscode.workspace.fs.stat(fileUri);
    } catch {
      // Ignore stat errors
    }
    
    const fallbackCreated = fileStat ? new Date(fileStat.ctime).toISOString() : new Date().toISOString();
    const fallbackUpdated = fileStat ? new Date(fileStat.mtime).toISOString() : new Date().toISOString();

    const parsedDoc = parseFrontmatterDocument(text);
    const parsed = parsedDoc.data;

    const task: Task = {
      id: typeof parsed.id === 'string' ? parsed.id : fileName,
      title: typeof parsed.title === 'string' ? parsed.title : fileName.replace(/-/g, ' '),
      stage: pathStage,
      created:
        typeof parsed.created === 'string'
          ? parsed.created
          : parsed.created instanceof Date
            ? parsed.created.toISOString()
            : fallbackCreated,
      updated:
        typeof parsed.updated === 'string'
          ? parsed.updated
          : parsed.updated instanceof Date
            ? parsed.updated.toISOString()
            : fallbackUpdated,
      filePath: fileUri.fsPath,
    };
    
    if (typeof parsed.type === 'string') task.type = parsed.type;
    if (typeof parsed.phase === 'string') task.phase = parsed.phase;
    if (typeof parsed.agent === 'string') task.agent = parsed.agent;
    if (Array.isArray(parsed.contexts)) {
      task.contexts = parsed.contexts;
    } else if (typeof parsed.context === 'string' && parsed.context.trim()) {
      task.contexts = [parsed.context];
    }
    if (Array.isArray(parsed.tags)) task.tags = parsed.tags;
    if (typeof parsed.order === 'number') {
      task.order = parsed.order;
    } else if (typeof parsed.order === 'string') {
      const maybeOrder = parseInt(parsed.order, 10);
      if (!Number.isNaN(maybeOrder)) {
        task.order = maybeOrder;
      }
    }

    const userContentMatch = parsedDoc.content.match(/<!-- USER CONTENT -->\n([\s\S]*)/);
    if (userContentMatch) {
      task.userContent = userContentMatch[1].trim();
    }

    return task;
  } catch {
    return null;
  }
}

export async function loadTasksList(): Promise<Task[] | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }

  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  const tasksUri = vscode.Uri.joinPath(vibekanUri, 'tasks');

  try {
    await vscode.workspace.fs.stat(vibekanUri);
  } catch {
    return null;
  }

  await migrateLegacyStages(vibekanUri);

  const tasks: Task[] = [];

  const stageSources: Array<{ stage: Stage; uri: vscode.Uri }> = ALL_STAGES.map((stage) => ({
    stage,
    uri: vscode.Uri.joinPath(tasksUri, stage),
  }));

  for (const [legacy, target] of Object.entries(LEGACY_STAGE_ALIASES)) {
    stageSources.push({ stage: target, uri: vscode.Uri.joinPath(tasksUri, legacy) });
  }

  try {
    const entries = await vscode.workspace.fs.readDirectory(tasksUri);
    const knownStageNames = new Set([...ALL_STAGES, ...Object.keys(LEGACY_STAGE_ALIASES)]);
    for (const [dirName, dirType] of entries) {
      if (dirType === vscode.FileType.Directory && !knownStageNames.has(dirName)) {
        console.warn('[Vibekan] Skipping unknown stage folder:', dirName);
      }
    }
  } catch {
    // Ignore scanning errors
  }

  for (const { stage, uri: stageUri } of stageSources) {
    try {
      const files = await vscode.workspace.fs.readDirectory(stageUri);
      const stageTasks: Task[] = [];
      
      for (const [fileName, fileType] of files) {
        if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
          const fileUri = vscode.Uri.joinPath(stageUri, fileName);
          const task = await parseTaskFile(fileUri, stage);
          if (task) {
            stageTasks.push(task);
          }
        }
      }
      
      stageTasks.sort((a, b) => {
        const orderA = a.order ?? Infinity;
        const orderB = b.order ?? Infinity;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.id.localeCompare(b.id);
      });
      
      tasks.push(...stageTasks);
    } catch {
      // Ignore missing folders
    }
  }

  return tasks;
}

export interface CreateTaskPayload {
  title: string;
  stage: Stage;
  phase?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
  content?: string;
  templateName?: string;
  templateContent?: string;
  applyTemplate?: boolean;
}

export async function createTaskFile(payload: CreateTaskPayload): Promise<Task | null> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return null;
  }

  const normalizedStage = normalizeStage(payload.stage, 'idea') ?? 'idea';
  const tasksRoot = vscode.Uri.joinPath(vibekanUri, 'tasks');
  const stageUri = vscode.Uri.joinPath(tasksRoot, normalizedStage);
  await ensureDirectory(stageUri);

  const now = new Date().toISOString();
  const baseSlug = slugify(payload.title);
  const uniqueId = await ensureUniqueTaskId(baseSlug, tasksRoot);

  const stageFiles = await vscode.workspace.fs.readDirectory(stageUri);
  let maxOrder = -1;
  let taskCount = 0;
  for (const [fileName, fileType] of stageFiles) {
    if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
      taskCount += 1;
      const fileUri = vscode.Uri.joinPath(stageUri, fileName);
      const existing = await parseTaskFile(fileUri, normalizedStage);
      if (existing && typeof existing.order === 'number' && existing.order > maxOrder) {
        maxOrder = existing.order;
      }
    }
  }
  const order = maxOrder >= 0 ? maxOrder + 1 : taskCount;

  const fm: ParsedFrontmatter = {
    id: uniqueId,
    title: payload.title,
    stage: normalizedStage,
    type: 'task',
    created: now,
    updated: now,
    order: String(order),
  };

  if (payload.phase) fm.phase = payload.phase;
  if (payload.agent) fm.agent = payload.agent;
  if (payload.contexts && payload.contexts.length > 0) fm.contexts = payload.contexts;
  if (payload.tags && payload.tags.length > 0) fm.tags = payload.tags;

  const templateList = withDefaultTemplate(await loadTemplates(vibekanUri));
  const matchedTemplate = payload.templateName
    ? templateList.find((t) => t.name.toLowerCase() === payload.templateName?.toLowerCase())
    : templateList[0];
  const templateBody = payload.applyTemplate === false
    ? null
    : payload.templateContent ?? matchedTemplate?.content ?? DEFAULT_TASK_TEMPLATE;

  const stageContext = await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'stages', `${normalizedStage}.md`));
  const phaseContext = payload.phase
    ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'phases', `${payload.phase}.md`))
    : null;
  const agentContext = payload.agent
    ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'agents', `${payload.agent}.md`))
    : null;
  const customContexts: Array<{ name: string; content: string }> = [];
  if (payload.contexts && payload.contexts.length > 0) {
    for (const ctx of payload.contexts) {
      const content = await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${ctx}.md`));
      if (content) {
        customContexts.push({ name: ctx, content });
      }
    }
  }
  const architectureContext = await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'architecture.md'));

  const managedSections = [
    '<!-- MANAGED: DO NOT EDIT BELOW THIS LINE -->',
    `## 🎯 Stage: ${normalizedStage}\n${stageContext ?? 'Add stage guidance in _context/stages/' + normalizedStage + '.md'}`,
  ];

  if (phaseContext && payload.phase) {
    managedSections.push(`\n## 📦 Phase: ${payload.phase}\n${phaseContext}`);
  }
  if (agentContext && payload.agent) {
    managedSections.push(`\n## 🤖 Agent: ${payload.agent}\n${agentContext}`);
  }
  for (const ctx of customContexts) {
    managedSections.push(`\n## 📄 Context: ${ctx.name}\n${ctx.content}`);
  }
  if (architectureContext) {
    managedSections.push(`\n## 🌍 Architecture\n${architectureContext}`);
  }

  managedSections.push('');

  const userContent = templateBody
    ? renderTemplate(templateBody, {
        title: payload.title,
        stage: normalizedStage,
        phase: payload.phase,
        agent: payload.agent,
        contexts: payload.contexts,
        tags: payload.tags,
        content: payload.content ?? '',
      }).trim()
    : (payload.content ?? '').trim();
  const body = `\n${managedSections.join('\n')}\n<!-- USER CONTENT -->\n${userContent}\n`;
  const fileText = stringifyDocument(body, fm);

  const targetUri = vscode.Uri.joinPath(stageUri, `${uniqueId}.md`);
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(fileText, 'utf8'));

  const createdTask = await parseTaskFile(targetUri, normalizedStage);
  return createdTask;
}

export async function duplicateTask(taskId: string): Promise<Task | null> {
  const tasks = await loadTasksList();
  if (!tasks) return null;
  const existing = tasks.find((t) => t.id === taskId);
  if (!existing) return null;

  const dupTitle = `${existing.title} Copy`;
  const created = await createTaskFile({
    title: dupTitle,
    stage: existing.stage,
    phase: existing.phase,
    agent: existing.agent,
    contexts: existing.contexts,
    tags: existing.tags,
    content: existing.userContent ?? '',
    applyTemplate: false,
  });

  return created;
}
