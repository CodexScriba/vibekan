import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Task, STAGES, Stage } from './types/task';
import { CopyMode, CopySettings } from './types/copy';
import { PromptBuilder } from './utils/promptBuilder';

interface ParsedFrontmatter {
  [key: string]: string | string[] | undefined;
}

let boardWebview: vscode.Webview | null = null;
let sidebarWebview: vscode.Webview | null = null;

interface ContextData {
  phases: string[];
  agents: string[];
  contexts: string[];
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

async function ensureVibekanRoot(): Promise<vscode.Uri | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }
  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  try {
    await vscode.workspace.fs.stat(vibekanUri);
    return vibekanUri;
  } catch {
    return null;
  }
}

async function listFilesWithoutExtension(dir: vscode.Uri): Promise<string[]> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dir);
    return entries
      .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
      .map(([name]) => name.replace(/\.md$/, ''))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function loadContextData(): Promise<ContextData> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) return { phases: [], agents: [], contexts: [] };

  const phases = await listFilesWithoutExtension(vscode.Uri.joinPath(vibekanUri, '_context', 'phases'));
  const agents = await listFilesWithoutExtension(vscode.Uri.joinPath(vibekanUri, '_context', 'agents'));
  const contextsDir = vscode.Uri.joinPath(vibekanUri, '_context', 'custom');
  const customContexts = await listFilesWithoutExtension(contextsDir);
  const contexts = ['architecture', ...customContexts];

  return { phases, agents, contexts };
}

function getCopySettings(): CopySettings {
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

function resolveCopyMode(mode: string | undefined, fallback: CopyMode): CopyMode {
  if (mode === 'task' || mode === 'context' || mode === 'full') {
    return mode;
  }
  return fallback;
}

async function sendCopySettings(webview: vscode.Webview) {
  const settings = getCopySettings();
  webview.postMessage({ type: 'copySettings', settings });
}

async function broadcastCopySettings() {
  if (sidebarWebview) {
    await sendCopySettings(sidebarWebview);
  }
  if (boardWebview) {
    await sendCopySettings(boardWebview);
  }
}

async function readContextDirectory(dir: vscode.Uri): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const entries = await vscode.workspace.fs.readDirectory(dir);
    for (const [name, type] of entries) {
      if (type === vscode.FileType.File && name.endsWith('.md')) {
        const content = await readTextIfExists(vscode.Uri.joinPath(dir, name));
        if (content) {
          map[name.replace(/\.md$/, '')] = content;
        }
      }
    }
  } catch {
    // Directory may not exist; ignore.
  }
  return map;
}

function extractUserNotes(content: string): string {
  const match = content.match(/<!-- USER CONTENT -->\s*([\s\S]*)/);
  return match ? match[1].trim() : '';
}

export function activate(context: vscode.ExtensionContext) {
  // Register the Sidebar View Provider
  const sidebarProvider = new VibekanSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('vibekanView', sidebarProvider)
  );

  // Register a command to open the Vibekan board
  const disposable = vscode.commands.registerCommand('vibekan.openBoard', () => {
    const panel = vscode.window.createWebviewPanel(
      'vibekanBoard',
      'Vibekan Board',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist'),
          vscode.Uri.joinPath(context.extensionUri, 'media')
        ]
      }
    );

    boardWebview = panel.webview;
    panel.onDidDispose(() => {
      boardWebview = null;
    });

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, 'board');
    sendCopySettings(panel.webview);

    // Handle messages from the board
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'generateVibekan':
            await handleGenerateVibekan(panel.webview);
            break;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
            break;
          case 'checkState':
            await handleCheckState(panel.webview);
            break;
          case 'loadTasks':
            await handleLoadTasks(panel.webview);
            break;
          case 'moveTask':
            await handleMoveTask(
              panel.webview,
              message.taskId,
              message.fromStage as Stage,
              message.toStage as Stage,
              message.targetOrder
            );
            break;
          case 'copyPrompt':
            await handleCopyPrompt(message.taskId, message.mode, panel.webview);
            break;
          case 'reorderTasks':
            await handleReorderTasks(panel.webview, message.stage as Stage, message.taskOrder);
            break;
          case 'openTaskFile':
            await openFileInEditor(message.filePath);
            break;
          case 'openRoadmap':
            await handleOpenRoadmap();
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);

  const copyFullCommand = vscode.commands.registerCommand('vibekan.copyTaskFullContext', async () => {
    await quickCopyPrompt('full');
  });
  const copyTaskOnlyCommand = vscode.commands.registerCommand('vibekan.copyTaskOnly', async () => {
    await quickCopyPrompt('task');
  });
  const copyContextOnlyCommand = vscode.commands.registerCommand('vibekan.copyContextOnly', async () => {
    await quickCopyPrompt('context');
  });

  context.subscriptions.push(copyFullCommand, copyTaskOnlyCommand, copyContextOnlyCommand);

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('vibekan.copyMode')) {
      broadcastCopySettings();
    }
  });

  context.subscriptions.push(configListener);
}

export function deactivate() {}

class VibekanSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    sidebarWebview = webviewView.webview;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');
    sendCopySettings(webviewView.webview);

      webviewView.webview.onDidReceiveMessage(async (data) => {
        switch (data.command) {
          case 'generateVibekan':
            await handleGenerateVibekan(webviewView.webview);
            break;
          case 'openBoard':
            vscode.commands.executeCommand('vibekan.openBoard');
            break;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
            break;
          case 'checkState':
            await handleCheckState(webviewView.webview);
            break;
          case 'loadContextData':
            await sendContextData(webviewView.webview);
            break;
          case 'createTask':
            await handleCreateTask(webviewView.webview, data.payload);
            break;
          case 'createAgent':
            await handleCreateAgent(webviewView.webview, data.payload ?? { name: data.name });
            break;
          case 'createPhase':
            await handleCreatePhase(webviewView.webview, data.payload ?? { name: data.name });
            break;
          case 'createContext':
            await handleCreateContext(webviewView.webview, data.payload ?? { name: data.name });
            break;
          case 'openArchitecture':
            await handleOpenArchitecture();
            break;
          case 'deleteTask':
            await handleDeleteTask(data.taskId);
            break;
          case 'duplicateTask':
            await handleDuplicateTask(webviewView.webview, data.taskId);
            break;
          case 'openTaskFile':
            await openFileInEditor(data.filePath);
            break;
          case 'openRoadmap':
            await handleOpenRoadmap();
            break;
          case 'copyPrompt':
            await handleCopyPrompt(data.taskId, data.mode, webviewView.webview);
            break;
          case 'moveTask':
            await handleMoveTask(
              webviewView.webview,
              data.taskId,
              data.fromStage as Stage,
              data.toStage as Stage,
              data.targetOrder
            );
            break;
          case 'loadTasks':
            await handleLoadTasks(webviewView.webview);
            break;
        }
      });
    }
}

async function handleGenerateVibekan(webview: vscode.Webview) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: 'No workspace open' });
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');

  try {
    await vscode.workspace.fs.stat(vibekanUri);
    // If stat succeeds, folder exists
    webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: 'Workspace already exists' });
  } catch {
    // If stat fails, folder likely doesn't exist, proceed to create
    try {
      await vscode.workspace.fs.createDirectory(vibekanUri);
      // Scaffold subdirectories
      const dirs = ['tasks/chat', 'tasks/queue', 'tasks/plan', 'tasks/code', 'tasks/audit', 'tasks/completed', '_context/stages', '_context/phases', '_context/agents', '_context/custom'];
      for (const dir of dirs) {
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(vibekanUri, dir));
      }

      // Create default context files (minimal placeholders for roadmap alignment)
      const files: Array<{ path: string; contents: string }> = [
        {
          path: '_context/architecture.md',
          contents: '# Architecture\n\nDescribe your project architecture here. This file is referenced by Vibekan.\n',
        },
      ];

      for (const stage of STAGES) {
        files.push({
          path: `_context/stages/${stage}.md`,
          contents: `# Stage: ${stage}\n\nDescribe how tasks should be executed in this stage.\n`,
        });
      }

      for (const file of files) {
        const target = vscode.Uri.joinPath(vibekanUri, file.path);
        await vscode.workspace.fs.writeFile(target, Buffer.from(file.contents, 'utf8'));
      }

      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: true });
      // Also send state update
      webview.postMessage({ type: 'state', exists: true });
      await broadcastContextData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: `Failed to create workspace: ${errorMessage}` });
    }
  }
}

async function handleCheckState(webview: vscode.Webview) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'state', exists: false });
    return;
  }
  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  try {
    await vscode.workspace.fs.stat(vibekanUri);
    webview.postMessage({ type: 'state', exists: true });
  } catch {
    webview.postMessage({ type: 'state', exists: false });
  }
}

async function handleLoadTasks(webview: vscode.Webview) {
  const tasks = await loadTasksList();
  if (!tasks) {
    webview.postMessage({ type: 'tasksError', message: 'No .vibekan workspace found. Generate one first.' });
    return;
  }
  webview.postMessage({ type: 'tasks', tasks });
}

async function sendContextData(webview: vscode.Webview) {
  const data = await loadContextData();
  webview.postMessage({ type: 'contextData', data });
}

async function loadTasksList(): Promise<Task[] | null> {
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

  const tasks: Task[] = [];

  for (const stage of STAGES) {
    const stageUri = vscode.Uri.joinPath(tasksUri, stage);
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

async function broadcastTasks() {
  const tasks = await loadTasksList();
  if (!tasks) return;

  if (sidebarWebview) {
    sidebarWebview.postMessage({ type: 'tasks', tasks });
  }

  if (boardWebview) {
    boardWebview.postMessage({ type: 'tasks', tasks });
  }
}

async function broadcastContextData() {
  const data = await loadContextData();
  if (sidebarWebview) {
    sidebarWebview.postMessage({ type: 'contextData', data });
  }
  if (boardWebview) {
    boardWebview.postMessage({ type: 'contextData', data });
  }
}

async function openFileInEditor(filePath: string) {
  try {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri, { preview: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open file';
    vscode.window.showErrorMessage(message);
  }
}

async function ensureDirectory(uri: vscode.Uri) {
  try {
    await vscode.workspace.fs.stat(uri);
  } catch {
    await vscode.workspace.fs.createDirectory(uri);
  }
}

async function createTemplateFile(target: vscode.Uri, contents: string) {
  const dir = vscode.Uri.file(path.dirname(target.fsPath));
  await ensureDirectory(dir);
  await vscode.workspace.fs.writeFile(target, Buffer.from(contents, 'utf8'));
}

async function createPhaseFile(vibekanUri: vscode.Uri, name: string, content?: string) {
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

async function createAgentFile(vibekanUri: vscode.Uri, name: string, content?: string) {
  const slug = slugify(name);
  const target = vscode.Uri.joinPath(vibekanUri, '_context', 'agents', `${slug}.md`);
  const body =
    content && content.trim().length > 0
      ? content
      : `# Agent: ${name}\n\n- Role: Describe responsibilities.\n- Voice & Style: Crisp, actionable.\n- Preferred Tools: List tools or stack.\n- Constraints: Note any boundaries.\n`;
  await createTemplateFile(target, body);
  return slug;
}

async function createContextFile(vibekanUri: vscode.Uri, name: string, content?: string) {
  const slug = slugify(name);
  const target = vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${slug}.md`);
  const body =
    content && content.trim().length > 0
      ? content
      : `# Context: ${name}\n\nAdd design notes, requirements, or specs relevant to attached tasks.\n`;
  await createTemplateFile(target, body);
  return slug;
}

async function readTextIfExists(uri: vscode.Uri): Promise<string | null> {
  try {
    const buf = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(buf).toString('utf8');
  } catch {
    return null;
  }
}

async function createTaskFile(payload: {
  title: string;
  stage: Stage;
  phase?: string;
  agent?: string;
  context?: string;
  tags?: string[];
  content?: string;
}): Promise<Task | null> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return null;
  }

  const stage: Stage = STAGES.includes(payload.stage) ? payload.stage : 'chat';
  const tasksRoot = vscode.Uri.joinPath(vibekanUri, 'tasks');
  const stageUri = vscode.Uri.joinPath(tasksRoot, stage);
  await ensureDirectory(stageUri);

  const now = new Date().toISOString();
  const baseId = `task-${slugify(payload.title)}`;
  let uniqueId = baseId;
  let counter = 1;

  while (true) {
    const candidateUri = vscode.Uri.joinPath(stageUri, `${uniqueId}.md`);
    try {
      await vscode.workspace.fs.stat(candidateUri);
      counter += 1;
      uniqueId = `${baseId}-${counter}`;
    } catch {
      break;
    }
  }

  const stageFiles = await vscode.workspace.fs.readDirectory(stageUri);
  let maxOrder = -1;
  let taskCount = 0;
  for (const [fileName, fileType] of stageFiles) {
    if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
      taskCount += 1;
      const fileUri = vscode.Uri.joinPath(stageUri, fileName);
      const existing = await parseTaskFile(fileUri, stage);
      if (existing && typeof existing.order === 'number' && existing.order > maxOrder) {
        maxOrder = existing.order;
      }
    }
  }
  const order = maxOrder >= 0 ? maxOrder + 1 : taskCount;

  const fm: ParsedFrontmatter = {
    id: uniqueId,
    title: payload.title,
    stage,
    type: 'task',
    created: now,
    updated: now,
    order: String(order),
  };

  if (payload.phase) fm.phase = payload.phase;
  if (payload.agent) fm.agent = payload.agent;
  if (payload.context) fm.context = payload.context;
  if (payload.tags && payload.tags.length > 0) fm.tags = payload.tags;

  const stageContext = await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'stages', `${stage}.md`));
  const phaseContext = payload.phase
    ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'phases', `${payload.phase}.md`))
    : null;
  const agentContext = payload.agent
    ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'agents', `${payload.agent}.md`))
    : null;
  const customContext = payload.context
    ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${payload.context}.md`))
    : null;
  const architectureContext = await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'architecture.md'));

  const managedSections = [
    '<!-- MANAGED: DO NOT EDIT BELOW THIS LINE -->',
    `## 🎯 Stage: ${stage}\n${stageContext ?? 'Add stage guidance in _context/stages/' + stage + '.md'}`,
  ];

  if (phaseContext && payload.phase) {
    managedSections.push(`\n## 📦 Phase: ${payload.phase}\n${phaseContext}`);
  }
  if (agentContext && payload.agent) {
    managedSections.push(`\n## 🤖 Agent: ${payload.agent}\n${agentContext}`);
  }
  if (customContext && payload.context) {
    managedSections.push(`\n## 📄 Context: ${payload.context}\n${customContext}`);
  }
  if (architectureContext) {
    managedSections.push(`\n## 🌍 Architecture\n${architectureContext}`);
  }

  managedSections.push('');

  const userContent = payload.content?.trim() ?? '';
  const fileText = `---\n${serializeFrontmatter(fm)}\n---\n\n${managedSections.join('\n')}\n<!-- USER CONTENT -->\n${userContent}\n`;

  const targetUri = vscode.Uri.joinPath(stageUri, `${uniqueId}.md`);
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(fileText, 'utf8'));

  const createdTask = await parseTaskFile(targetUri, stage);
  return createdTask;
}

function parseFrontmatter(frontmatterText: string): ParsedFrontmatter {
  const result: ParsedFrontmatter = {};
  const lines = frontmatterText.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (match) {
      const [, key, rawValue] = match;
      let value = rawValue.trim();
      
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse array: [tag1, tag2]
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1);
        result[key] = inner.split(',').map(t => {
          let item = t.trim();
          if ((item.startsWith('"') && item.endsWith('"')) ||
              (item.startsWith("'") && item.endsWith("'"))) {
            item = item.slice(1, -1);
          }
          return item;
        }).filter(t => t.length > 0);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

function serializeFrontmatter(data: ParsedFrontmatter): string {
  const lines: string[] = [];
  const keyOrder = ['id', 'title', 'stage', 'type', 'phase', 'agent', 'context', 'tags', 'order', 'created', 'updated'];
  const processedKeys = new Set<string>();
  
  for (const key of keyOrder) {
    if (data[key] !== undefined) {
      processedKeys.add(key);
      const value = data[key];
      if (Array.isArray(value)) {
        lines.push(`${key}: [${value.join(', ')}]`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }
  
  // Add any remaining keys not in keyOrder
  for (const [key, value] of Object.entries(data)) {
    if (!processedKeys.has(key) && value !== undefined) {
      if (Array.isArray(value)) {
        lines.push(`${key}: [${value.join(', ')}]`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }
  
  return lines.join('\n');
}

async function parseTaskFile(fileUri: vscode.Uri, stage: Stage): Promise<Task | null> {
  try {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const text = Buffer.from(content).toString('utf8');
    const fileName = path.basename(fileUri.fsPath, '.md');
    
    // Get file stats for fallback timestamps
    let fileStat: vscode.FileStat | null = null;
    try {
      fileStat = await vscode.workspace.fs.stat(fileUri);
    } catch {
      // Ignore stat errors
    }
    
    const fallbackCreated = fileStat ? new Date(fileStat.ctime).toISOString() : new Date().toISOString();
    const fallbackUpdated = fileStat ? new Date(fileStat.mtime).toISOString() : new Date().toISOString();
    
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      // Create a basic task from filename if no frontmatter, use file stats for timestamps
      return {
        id: fileName,
        title: fileName.replace(/-/g, ' '),
        stage,
        created: fallbackCreated,
        updated: fallbackUpdated,
        filePath: fileUri.fsPath,
      };
    }

    const parsed = parseFrontmatter(frontmatterMatch[1]);
    const parsedStage =
      typeof parsed.stage === 'string' && STAGES.includes(parsed.stage as Stage)
        ? (parsed.stage as Stage)
        : stage;
    
    const task: Task = {
      id: typeof parsed.id === 'string' ? parsed.id : fileName,
      title: typeof parsed.title === 'string' ? parsed.title : fileName.replace(/-/g, ' '),
      stage: parsedStage,
      created: typeof parsed.created === 'string' ? parsed.created : fallbackCreated,
      updated: typeof parsed.updated === 'string' ? parsed.updated : fallbackUpdated,
      filePath: fileUri.fsPath,
    };
    
    if (typeof parsed.type === 'string') task.type = parsed.type;
    if (typeof parsed.phase === 'string') task.phase = parsed.phase;
    if (typeof parsed.agent === 'string') task.agent = parsed.agent;
    if (typeof parsed.context === 'string') task.context = parsed.context;
    if (Array.isArray(parsed.tags)) task.tags = parsed.tags;
    if (typeof parsed.order === 'string') task.order = parseInt(parsed.order, 10);

    // Extract user content
    const userContentMatch = text.match(/<!-- USER CONTENT -->\n([\s\S]*)/);
    if (userContentMatch) {
      task.userContent = userContentMatch[1].trim();
    }

    return task;
  } catch {
    return null;
  }
}

async function handleMoveTask(webview: vscode.Webview, taskId: string, fromStage: Stage, toStage: Stage, targetOrder?: number) {
  if (fromStage === toStage) {
    webview.postMessage({ type: 'taskMoved', ok: true, taskId, toStage });
    return;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'taskMoved', ok: false, message: 'No workspace open' });
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const tasksUri = vscode.Uri.joinPath(rootUri, '.vibekan', 'tasks');

  const fromStageUri = vscode.Uri.joinPath(tasksUri, fromStage);
  const toStageUri = vscode.Uri.joinPath(tasksUri, toStage);

  try {
    // Ensure destination folder exists
    try {
      await vscode.workspace.fs.stat(toStageUri);
    } catch {
      await vscode.workspace.fs.createDirectory(toStageUri);
    }

    // Find the task file
    const files = await vscode.workspace.fs.readDirectory(fromStageUri);
    let taskFileName: string | null = null;

    for (const [fileName, fileType] of files) {
      if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
        const fileUri = vscode.Uri.joinPath(fromStageUri, fileName);
        const task = await parseTaskFile(fileUri, fromStage);
        if (task && task.id === taskId) {
          taskFileName = fileName;
          break;
        }
      }
    }

    if (!taskFileName) {
      webview.postMessage({ type: 'taskMoved', ok: false, message: 'Task file not found' });
      return;
    }

    const sourceUri = vscode.Uri.joinPath(fromStageUri, taskFileName);
    const targetUri = vscode.Uri.joinPath(toStageUri, taskFileName);

    // Get file stats for timestamp preservation
    let sourceStats: vscode.FileStat | null = null;
    try {
      sourceStats = await vscode.workspace.fs.stat(sourceUri);
    } catch {
      // Ignore
    }

    // Read file content
    const content = await vscode.workspace.fs.readFile(sourceUri);
    const text = Buffer.from(content).toString('utf8');
    
    // Calculate new order for the moved task
    const destFiles = await vscode.workspace.fs.readDirectory(toStageUri);
    let newOrder: number;
    
    if (targetOrder !== undefined) {
      // Use the specified target order and shift existing tasks
      newOrder = targetOrder;
      
      // Increment order of tasks at or after targetOrder
      for (const [destFileName, destFileType] of destFiles) {
        if (destFileType === vscode.FileType.File && destFileName.endsWith('.md')) {
          const destFileUri = vscode.Uri.joinPath(toStageUri, destFileName);
          const destTask = await parseTaskFile(destFileUri, toStage);
          if (destTask && destTask.order !== undefined && destTask.order >= targetOrder) {
            // Shift this task's order up by 1
            const destContent = await vscode.workspace.fs.readFile(destFileUri);
            const destText = Buffer.from(destContent).toString('utf8');
            const destFmMatch = destText.match(/^---\n([\s\S]*?)\n---/);
            if (destFmMatch) {
              const parsed = parseFrontmatter(destFmMatch[1]);
              parsed.order = String(destTask.order + 1);
              parsed.updated = new Date().toISOString();
              const newFm = serializeFrontmatter(parsed);
              const bodyStart = destFmMatch[0].length;
              const newDestText = `---\n${newFm}\n---${destText.slice(bodyStart)}`;
              await vscode.workspace.fs.writeFile(destFileUri, Buffer.from(newDestText, 'utf8'));
            }
          }
        }
      }
    } else {
      // Append to end: find max order or use task count as fallback
      let maxOrder = -1;
      let taskCount = 0;
      for (const [destFileName, destFileType] of destFiles) {
        if (destFileType === vscode.FileType.File && destFileName.endsWith('.md')) {
          taskCount++;
          const destFileUri = vscode.Uri.joinPath(toStageUri, destFileName);
          const destTask = await parseTaskFile(destFileUri, toStage);
          if (destTask && destTask.order !== undefined && destTask.order > maxOrder) {
            maxOrder = destTask.order;
          }
        }
      }
      // If no tasks have order defined, use taskCount; otherwise use maxOrder + 1
      newOrder = maxOrder >= 0 ? maxOrder + 1 : taskCount;
    }
    
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
    let newText: string;
    
    if (frontmatterMatch) {
      // Parse existing frontmatter and update stage/updated/order
      const parsed = parseFrontmatter(frontmatterMatch[1]);
      parsed.stage = toStage;
      parsed.updated = new Date().toISOString();
      parsed.order = String(newOrder);
      
      const newFrontmatter = serializeFrontmatter(parsed);
      const bodyStart = frontmatterMatch[0].length;
      newText = `---\n${newFrontmatter}\n---${text.slice(bodyStart)}`;
    } else {
      // No frontmatter, create one preserving file timestamps
      const fileName = path.basename(sourceUri.fsPath, '.md');
      const fallbackCreated = sourceStats ? new Date(sourceStats.ctime).toISOString() : new Date().toISOString();
      const fallbackUpdated = sourceStats ? new Date(sourceStats.mtime).toISOString() : new Date().toISOString();
      
      const newFrontmatter = serializeFrontmatter({
        id: fileName,
        title: fileName.replace(/-/g, ' '),
        stage: toStage,
        created: fallbackCreated,
        updated: fallbackUpdated,
        order: String(newOrder),
      });
      newText = `---\n${newFrontmatter}\n---\n\n${text}`;
    }

    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(newText, 'utf8'));
    await vscode.workspace.fs.delete(sourceUri);

    webview.postMessage({ type: 'taskMoved', ok: true, taskId, toStage });
    await broadcastTasks();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    webview.postMessage({ type: 'taskMoved', ok: false, message: `Failed to move task: ${errorMessage}` });
  }
}

async function handleReorderTasks(webview: vscode.Webview, stage: Stage, taskOrder: string[]) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const stageUri = vscode.Uri.joinPath(rootUri, '.vibekan', 'tasks', stage);

  try {
    const files = await vscode.workspace.fs.readDirectory(stageUri);
    
    for (let orderIndex = 0; orderIndex < taskOrder.length; orderIndex++) {
      const taskId = taskOrder[orderIndex];
      
      for (const [fileName, fileType] of files) {
        if (fileType !== vscode.FileType.File || !fileName.endsWith('.md')) continue;
        
        const fileUri = vscode.Uri.joinPath(stageUri, fileName);
        const task = await parseTaskFile(fileUri, stage);
        
        if (task && task.id === taskId) {
          // Get file stats for timestamp preservation
          let fileStats: vscode.FileStat | null = null;
          try {
            fileStats = await vscode.workspace.fs.stat(fileUri);
          } catch {
            // Ignore
          }
          
          // Update order in frontmatter
          const content = await vscode.workspace.fs.readFile(fileUri);
          const text = Buffer.from(content).toString('utf8');
          
          const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
          let newText: string;
          
          if (frontmatterMatch) {
            const parsed = parseFrontmatter(frontmatterMatch[1]);
            parsed.order = String(orderIndex);
            parsed.updated = new Date().toISOString();
            
            const newFrontmatter = serializeFrontmatter(parsed);
            const bodyStart = frontmatterMatch[0].length;
            newText = `---\n${newFrontmatter}\n---${text.slice(bodyStart)}`;
          } else {
            // No frontmatter, create one preserving file timestamps
            const fallbackCreated = fileStats ? new Date(fileStats.ctime).toISOString() : new Date().toISOString();
            const fallbackUpdated = fileStats ? new Date(fileStats.mtime).toISOString() : new Date().toISOString();
            
            const newFrontmatter = serializeFrontmatter({
              id: task.id,
              title: task.title,
              stage: stage,
              created: fallbackCreated,
              updated: fallbackUpdated,
              order: String(orderIndex),
            });
            newText = `---\n${newFrontmatter}\n---\n\n${text}`;
          }
          
          await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newText, 'utf8'));
          break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return;
  }

  await broadcastTasks();
}

async function handleCopyPrompt(taskId: string, requestedMode?: CopyMode, sourceWebview?: vscode.Webview) {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: 'No .vibekan workspace found.' });
    }
    return;
  }

  const tasks = await loadTasksList();
  if (!tasks || tasks.length === 0) {
    vscode.window.showErrorMessage('No tasks found. Create a task first.');
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: 'No tasks available.' });
    }
    return;
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    vscode.window.showErrorMessage('Task not found');
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: 'Task not found.' });
    }
    return;
  }

  const taskFileUri = vscode.Uri.file(task.filePath);
  let taskContent = '';
  try {
    const buf = await vscode.workspace.fs.readFile(taskFileUri);
    taskContent = Buffer.from(buf).toString('utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to read task file.';
    vscode.window.showErrorMessage(message);
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: message });
    }
    return;
  }

  const copySettings = getCopySettings();
  const mode = resolveCopyMode(requestedMode, copySettings.defaultMode);
  const builder = new PromptBuilder(copySettings);

  try {
    const stageContext = await readTextIfExists(
      vscode.Uri.joinPath(vibekanUri, '_context', 'stages', `${task.stage}.md`)
    );
    const phaseContext = task.phase
      ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'phases', `${task.phase}.md`))
      : null;
    const agentContext = task.agent
      ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'agents', `${task.agent}.md`))
      : null;
    const customContext = task.context
      ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${task.context}.md`))
      : null;
    const architecture = copySettings.includeArchitecture
      ? await readTextIfExists(vscode.Uri.joinPath(vibekanUri, '_context', 'architecture.md'))
      : null;
    const userNotes = extractUserNotes(taskContent);

    let prompt = '';

    if (mode === 'full') {
      prompt = builder.buildFullContext({
        task,
        stageContext: stageContext ?? undefined,
        phaseContext,
        agentContext,
        customContext,
        architecture,
        userNotes,
      });
    } else if (mode === 'task') {
      prompt = builder.buildTaskOnly({
        task,
        userNotes,
      });
    } else {
      const stageContexts: Record<string, string> = {};
      for (const stage of STAGES) {
        const content = await readTextIfExists(
          vscode.Uri.joinPath(vibekanUri, '_context', 'stages', `${stage}.md`)
        );
        stageContexts[stage] = content ?? `Add stage guidance in _context/stages/${stage}.md`;
      }

      const phaseContexts = await readContextDirectory(vscode.Uri.joinPath(vibekanUri, '_context', 'phases'));
      const agentContexts = await readContextDirectory(vscode.Uri.joinPath(vibekanUri, '_context', 'agents'));

      prompt = builder.buildContextOnly({
        architecture,
        stages: stageContexts,
        phases: phaseContexts,
        agents: agentContexts,
      });
    }

    await vscode.env.clipboard.writeText(prompt);

    const payload = {
      type: 'copySuccess',
      characterCount: prompt.length,
      mode,
      duration: copySettings.toastDuration,
      showToast: copySettings.showToast,
    };

    if (sourceWebview) {
      sourceWebview.postMessage(payload);
    } else if (copySettings.showToast) {
      vscode.window.showInformationMessage(
        `Copied ${prompt.length} characters (${mode} mode) for "${task.title}".`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to copy prompt.';
    vscode.window.showErrorMessage(message);
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: message });
    }
  }
}

async function quickCopyPrompt(mode: CopyMode) {
  const tasks = await loadTasksList();
  if (!tasks || tasks.length === 0) {
    vscode.window.showErrorMessage('No tasks available to copy.');
    return;
  }

  const pick = await vscode.window.showQuickPick<{ label: string; description?: string; taskId: string }>(
    tasks.map((task) => ({
      label: task.title,
      description: [task.stage, task.phase, task.agent].filter(Boolean).join(' • '),
      taskId: task.id,
    })),
    { placeHolder: 'Select a task to copy' }
  );

  if (!pick) return;

  await handleCopyPrompt(pick.taskId, mode);
}

async function handleCreateTask(webview: vscode.Webview, payload: any) {
  try {
    const created = await createTaskFile({
      title: payload?.title ?? '',
      stage: (payload?.stage as Stage) ?? 'chat',
      phase: payload?.phase,
      agent: payload?.agent,
      context: payload?.context,
      tags: payload?.tags,
      content: payload?.content,
    });

    if (!created) return;

    webview.postMessage({ type: 'taskCreated', task: created });
    await broadcastTasks();
    await broadcastContextData();
    await openFileInEditor(created.filePath);
  } catch (err) {
    console.error('Failed to create task:', err);
    vscode.window.showErrorMessage(`Failed to create task: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleCreateAgent(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }
  const slug = await createAgentFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'agentCreated', agent: slug });
  await broadcastContextData();
}

async function handleCreatePhase(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }
  const slug = await createPhaseFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'phaseCreated', phase: slug });
  await broadcastContextData();
}

async function handleCreateContext(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }
  const slug = await createContextFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'contextCreated', context: slug });
  await broadcastContextData();
}

async function handleOpenArchitecture() {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }
  const archUri = vscode.Uri.joinPath(vibekanUri, '_context', 'architecture.md');
  await openFileInEditor(archUri.fsPath);
}

async function handleOpenRoadmap() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open');
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const roadmapUri = vscode.Uri.joinPath(rootUri, 'roadmap.md');

  try {
    await vscode.workspace.fs.stat(roadmapUri);
  } catch {
    const template = '# Roadmap\n\nOutline milestones, priorities, and target dates here.\n';
    await vscode.workspace.fs.writeFile(roadmapUri, Buffer.from(template, 'utf8'));
  }

  await openFileInEditor(roadmapUri.fsPath);
}

async function handleDeleteTask(taskId: string) {
  const tasks = await loadTasksList();
  if (!tasks) return;

  const target = tasks.find((t) => t.id === taskId);
  if (!target) return;

  const choice = await vscode.window.showWarningMessage(
    `Delete task "${target.title}"?`,
    { modal: true },
    'Delete'
  );
  if (choice !== 'Delete') return;

  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(target.filePath));
    await broadcastTasks();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    vscode.window.showErrorMessage(message);
  }
}

async function handleDuplicateTask(webview: vscode.Webview, taskId: string) {
  const tasks = await loadTasksList();
  if (!tasks) return;
  const existing = tasks.find((t) => t.id === taskId);
  if (!existing) return;

  const content = await readTextIfExists(vscode.Uri.file(existing.filePath));
  if (!content) return;

  const dupTitle = `${existing.title} Copy`;
  const created = await createTaskFile({
    title: dupTitle,
    stage: existing.stage,
    phase: existing.phase,
    agent: existing.agent,
    context: existing.context,
    tags: existing.tags,
    content: existing.userContent ?? '',
  });

  if (!created) return;

  webview.postMessage({ type: 'taskCreated', task: created });
  await broadcastTasks();
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, viewType: 'sidebar' | 'board') {
  // Read the generated index.html and swap asset paths for webview-safe URIs
  const indexHtmlPath = path.join(extensionUri.fsPath, 'dist', 'index.html');
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  } catch (e) {
    console.error('Could not read index.html', e);
    return `<!DOCTYPE html><html><body>Error loading Webview: Could not read dist/index.html</body></html>`;
  }

  // Extract the script src and css href from the generated HTML to ensure we get the hashed filenames
  // This is a bit hacky but robust for Vite's hashing.
  // Alternatively, we can configure Vite to not hash, but hashing is good for caching.
  
  // We need to replace the paths in the HTML with webview URIs.
  // The generated HTML looks like: <script type="module" crossorigin src="/assets/index-D_t9J9.js"></script>
  // <link rel="stylesheet" crossorigin href="/assets/index-C1234.css">

  const nonce = getNonce();

  // Replace script src
  htmlContent = htmlContent.replace(
    /src="\/assets\/([^"]+)"/g,
    (_match, p1) => `src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', p1))}"`
  );

  // Replace css href
  htmlContent = htmlContent.replace(
    /href="\/assets\/([^"]+)"/g,
    (_match, p1) => `href="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', p1))}"`
  );

  // Inject CSP and Context
  // We need to insert the meta tag and the script tag.
  // Let's replace the existing CSP if it exists, or insert into head.
  // Vite might not generate a CSP meta tag by default.

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">`;
  const contextScript = `<script nonce="${nonce}">window.vibekanViewType = '${viewType}';</script>`;

  // Insert after <head>
  htmlContent = htmlContent.replace('<head>', `<head>${cspMeta}`);
  // Insert before </body> or inside head for the script? 
  // Better to put the context script before the main script.
  // The main script is usually in the body or head. 
  // Let's prepend to the body to be safe and ensure it runs before the module.
  htmlContent = htmlContent.replace('<body>', `<body>${contextScript}`);

  // Apply nonce to script tags that don't already have one
  htmlContent = htmlContent.replace(/<script(?![^>]*\bnonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`);

  return htmlContent;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
