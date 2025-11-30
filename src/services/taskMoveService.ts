import * as vscode from 'vscode';
import { ALL_STAGES, Stage, Task } from '../types/task';
import { LEGACY_STAGE_ALIASES, parseFrontmatterDocument, stringifyDocument, getBaseSlug } from '../core';
import { parseTaskFile } from './taskService';
import { ensureDirectory } from './fileSystem';

export async function ensureUniqueTaskId(baseSlug: string, tasksRoot: vscode.Uri): Promise<string> {
  const stageDirs = [
    ...ALL_STAGES,
    ...Object.keys(LEGACY_STAGE_ALIASES),
  ].map((s) => vscode.Uri.joinPath(tasksRoot, s));

  const baseId = `${Date.now()}-${baseSlug}`;
  let uniqueId = baseId;
  let counter = 1;

  const idExists = async (candidate: string) => {
    for (const dir of stageDirs) {
      const candidateUri = vscode.Uri.joinPath(dir, `${candidate}.md`);
      try {
        await vscode.workspace.fs.stat(candidateUri);
        return true;
      } catch {
        // not found in this stage
      }
    }
    return false;
  };

  while (await idExists(uniqueId)) {
    uniqueId = `${baseId}-${counter}`;
    counter += 1;
  }

  return uniqueId;
}

export interface TaskMoveResult {
  ok: boolean;
  message?: string;
  taskId?: string;
  toStage?: Stage;
  newFilePath?: string;
}

export async function handleMoveTask(
  taskId: string,
  fromStage: Stage,
  toStage: Stage,
  targetOrder?: number
): Promise<TaskMoveResult> {
  if (fromStage === toStage) {
    return { ok: true, taskId, toStage };
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return { ok: false, message: 'No workspace open' };
  }

  const rootUri = workspaceFolders[0].uri;
  const tasksUri = vscode.Uri.joinPath(rootUri, '.vibekan', 'tasks');

  const fromStageUri = vscode.Uri.joinPath(tasksUri, fromStage);
  const toStageUri = vscode.Uri.joinPath(tasksUri, toStage);

  try {
    await ensureDirectory(toStageUri);

    // Find the task file
    const files = await vscode.workspace.fs.readDirectory(fromStageUri);
    let taskFileName: string | null = null;
    let sourceTask: Task | null = null;

    for (const [fileName, fileType] of files) {
      if (fileType === vscode.FileType.File && fileName.endsWith('.md')) {
        const fileUri = vscode.Uri.joinPath(fromStageUri, fileName);
        const task = await parseTaskFile(fileUri, fromStage);
        if (task && task.id === taskId) {
          taskFileName = fileName;
          sourceTask = task;
          break;
        }
      }
    }

    if (!taskFileName) {
      return { ok: false, message: 'Task file not found' };
    }

    const sourceUri = vscode.Uri.joinPath(fromStageUri, taskFileName);
    const targetUri = vscode.Uri.joinPath(toStageUri, taskFileName);

    // Avoid clobbering an existing task in the destination stage
    try {
      await vscode.workspace.fs.stat(targetUri);
      return { ok: false, message: 'A task with the same filename already exists in the destination stage.' };
    } catch {
      // Safe to move
    }

    // Get file stats for timestamp preservation
    let sourceStats: vscode.FileStat | null = null;
    try {
      sourceStats = await vscode.workspace.fs.stat(sourceUri);
    } catch {
      sourceStats = null;
    }

    // Read file content
    const content = await vscode.workspace.fs.readFile(sourceUri);
    const text = Buffer.from(content).toString('utf8');

    // Calculate new order for the moved task
    const destFiles = await vscode.workspace.fs.readDirectory(toStageUri);
    let newOrder: number;

    if (targetOrder !== undefined) {
      newOrder = targetOrder;

      // Increment order of tasks at or after targetOrder
      for (const [destFileName, destFileType] of destFiles) {
        if (destFileType === vscode.FileType.File && destFileName.endsWith('.md')) {
          const destFileUri = vscode.Uri.joinPath(toStageUri, destFileName);
          const destTask = await parseTaskFile(destFileUri, toStage);
          if (destTask && destTask.order !== undefined && destTask.order >= targetOrder) {
            const destContent = await vscode.workspace.fs.readFile(destFileUri);
            const destText = Buffer.from(destContent).toString('utf8');
            const destParsed = parseFrontmatterDocument(destText);
            const updatedFm = { ...destParsed.data };
            updatedFm.order = (destTask.order ?? targetOrder) + 1;
            updatedFm.updated = new Date().toISOString();
            updatedFm.stage = toStage;
            const newDestText = stringifyDocument(destParsed.content, updatedFm);
            await vscode.workspace.fs.writeFile(destFileUri, Buffer.from(newDestText, 'utf8'));
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
      newOrder = maxOrder >= 0 ? maxOrder + 1 : taskCount;
    }

    const fallbackCreated = sourceStats ? new Date(sourceStats.ctime).toISOString() : new Date().toISOString();
    const fallbackUpdated = sourceStats ? new Date(sourceStats.mtime).toISOString() : new Date().toISOString();
    const fileBaseName = taskFileName.replace(/\.md$/, '');
    const fallbackId = sourceTask?.id ?? fileBaseName;
    const fallbackTitle = sourceTask?.title ?? getBaseSlug(fileBaseName).replace(/-/g, ' ');

    const parsedDoc = parseFrontmatterDocument(text);
    const parsedFm = { ...parsedDoc.data };
    parsedFm.id = typeof parsedFm.id === 'string' ? parsedFm.id : fallbackId;
    parsedFm.stage = toStage;
    parsedFm.updated = new Date().toISOString();
    parsedFm.order = newOrder;
    if (!parsedFm.created) {
      parsedFm.created = fallbackCreated;
    }
    if (!parsedFm.title) {
      parsedFm.title = fallbackTitle;
    }

    const newText = stringifyDocument(parsedDoc.content, parsedFm);

    await vscode.workspace.fs.writeFile(targetUri, Buffer.from(newText, 'utf8'));
    await vscode.workspace.fs.delete(sourceUri);

    return { ok: true, taskId, newFilePath: targetUri.fsPath, toStage };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, message: `Failed to move task: ${errorMessage}` };
  }
}

export async function handleReorderTasks(stage: Stage, taskOrder: string[]): Promise<boolean> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return false;
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
          
          const parsedDoc = parseFrontmatterDocument(text);
          const parsedFm = { ...parsedDoc.data };
          parsedFm.order = orderIndex;
          parsedFm.updated = new Date().toISOString();
          if (!parsedFm.id) {
            parsedFm.id = task.id;
          }
          if (!parsedFm.title) {
            parsedFm.title = task.title;
          }
          if (!parsedFm.stage) {
            parsedFm.stage = stage;
          }
          if (!parsedFm.created) {
            parsedFm.created = fileStats ? new Date(fileStats.ctime).toISOString() : new Date().toISOString();
          }
          if (!parsedFm.updated && fileStats) {
            parsedFm.updated = new Date(fileStats.mtime).toISOString();
          }

          const newText = stringifyDocument(parsedDoc.content, parsedFm);
          
          await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newText, 'utf8'));
          break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return false;
  }

  return true;
}
