import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface Task {
  id: string;
  title: string;
  stage: string;
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

interface ParsedFrontmatter {
  [key: string]: string | string[] | undefined;
}

const STAGES = ['chat', 'queue', 'plan', 'code', 'audit', 'completed'];

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

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, 'board');

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
            await handleMoveTask(panel.webview, message.taskId, message.fromStage, message.toStage, message.targetOrder);
            break;
          case 'copyPrompt':
            await handleCopyPrompt(message.taskId);
            break;
          case 'reorderTasks':
            await handleReorderTasks(panel.webview, message.stage, message.taskOrder);
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

class VibekanSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');

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
      const dirs = ['tasks/chat', 'tasks/queue', 'tasks/plan', 'tasks/code', 'tasks/audit', 'tasks/completed', '_context/stages', '_context/phases', '_context/agents'];
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

      for (const file of files) {
        const target = vscode.Uri.joinPath(vibekanUri, file.path);
        await vscode.workspace.fs.writeFile(target, Buffer.from(file.contents, 'utf8'));
      }

      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: true });
      // Also send state update
      webview.postMessage({ type: 'state', exists: true });
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
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'tasksError', message: 'No workspace open' });
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  const tasksUri = vscode.Uri.joinPath(vibekanUri, 'tasks');

  try {
    await vscode.workspace.fs.stat(vibekanUri);
  } catch {
    webview.postMessage({ type: 'tasksError', message: 'No .vibekan workspace found. Generate one first.' });
    return;
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
      
      // Sort tasks by order field (undefined sorts to end), with stable fallback to id
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
      // Stage folder may not exist or be empty
    }
  }

  webview.postMessage({ type: 'tasks', tasks });
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
  const keyOrder = ['id', 'title', 'stage', 'type', 'phase', 'agent', 'tags', 'order', 'created', 'updated'];
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

async function parseTaskFile(fileUri: vscode.Uri, stage: string): Promise<Task | null> {
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
    
    const task: Task = {
      id: typeof parsed.id === 'string' ? parsed.id : fileName,
      title: typeof parsed.title === 'string' ? parsed.title : fileName.replace(/-/g, ' '),
      stage: typeof parsed.stage === 'string' ? parsed.stage : stage,
      created: typeof parsed.created === 'string' ? parsed.created : fallbackCreated,
      updated: typeof parsed.updated === 'string' ? parsed.updated : fallbackUpdated,
      filePath: fileUri.fsPath,
    };
    
    if (typeof parsed.type === 'string') task.type = parsed.type;
    if (typeof parsed.phase === 'string') task.phase = parsed.phase;
    if (typeof parsed.agent === 'string') task.agent = parsed.agent;
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

async function handleMoveTask(webview: vscode.Webview, taskId: string, fromStage: string, toStage: string, targetOrder?: number) {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    webview.postMessage({ type: 'taskMoved', ok: false, message: `Failed to move task: ${errorMessage}` });
  }
}

async function handleReorderTasks(webview: vscode.Webview, stage: string, taskOrder: string[]) {
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
  }
}

async function handleCopyPrompt(taskId: string) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open');
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  const tasksUri = vscode.Uri.joinPath(vibekanUri, 'tasks');
  const contextUri = vscode.Uri.joinPath(vibekanUri, '_context');

  // Find the task
  let task: Task | null = null;
  let taskContent = '';

  for (const stage of STAGES) {
    const stageUri = vscode.Uri.joinPath(tasksUri, stage);
    try {
      const files = await vscode.workspace.fs.readDirectory(stageUri);
      for (const [fileName, fileType] of files) {
        if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
          const fileUri = vscode.Uri.joinPath(stageUri, fileName);
          const parsedTask = await parseTaskFile(fileUri, stage);
          if (parsedTask && parsedTask.id === taskId) {
            task = parsedTask;
            const content = await vscode.workspace.fs.readFile(fileUri);
            taskContent = Buffer.from(content).toString('utf8');
            break;
          }
        }
      }
      if (task) break;
    } catch {
      // Stage may not exist
    }
  }

  if (!task) {
    vscode.window.showErrorMessage('Task not found');
    return;
  }

  // Build the prompt with context
  let prompt = `# Task: ${task.title}\n\n`;
  prompt += taskContent + '\n\n';

  // Add architecture context
  try {
    const archUri = vscode.Uri.joinPath(contextUri, 'architecture.md');
    const archContent = await vscode.workspace.fs.readFile(archUri);
    prompt += `---\n\n## Architecture Context\n\n${Buffer.from(archContent).toString('utf8')}\n\n`;
  } catch {
    // No architecture file
  }

  // Add stage context
  if (task.stage) {
    try {
      const stageContextUri = vscode.Uri.joinPath(contextUri, 'stages', `${task.stage}.md`);
      const stageContent = await vscode.workspace.fs.readFile(stageContextUri);
      prompt += `---\n\n## Stage Context: ${task.stage}\n\n${Buffer.from(stageContent).toString('utf8')}\n\n`;
    } catch {
      // No stage context
    }
  }

  // Add phase context
  if (task.phase) {
    try {
      const phaseContextUri = vscode.Uri.joinPath(contextUri, 'phases', `${task.phase}.md`);
      const phaseContent = await vscode.workspace.fs.readFile(phaseContextUri);
      prompt += `---\n\n## Phase Context: ${task.phase}\n\n${Buffer.from(phaseContent).toString('utf8')}\n\n`;
    } catch {
      // No phase context
    }
  }

  // Add agent context
  if (task.agent) {
    try {
      const agentContextUri = vscode.Uri.joinPath(contextUri, 'agents', `${task.agent}.md`);
      const agentContent = await vscode.workspace.fs.readFile(agentContextUri);
      prompt += `---\n\n## Agent Context: ${task.agent}\n\n${Buffer.from(agentContent).toString('utf8')}\n\n`;
    } catch {
      // No agent context
    }
  }

  await vscode.env.clipboard.writeText(prompt);
  vscode.window.showInformationMessage(`Copied prompt for "${task.title}" (${prompt.length} chars)`);
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

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' https: http: ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">`;
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
