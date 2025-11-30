import * as vscode from 'vscode';
import { Stage, Task } from '../types/task';
import { broadcastTasks, broadcastContextData, broadcastThemeSettings } from './viewManager';
import { loadTasksList, createTaskFile, duplicateTask } from '../services/taskService';
import { handleMoveTask, handleReorderTasks } from '../services/taskMoveService';
import { handleReadTaskFile, handleSaveTaskFile, handleForceSaveTaskFile, TaskMetadataUpdate } from '../services/taskFileService';
import { handleCopyPrompt } from '../services/promptService';
import { loadContextData, createAgentFile, createPhaseFile, createContextFile } from '../services/contextService';
import { updateThemeSettingsConfig, ThemeSettingName } from '../settings';
import { handleOpenArchitecture, handleOpenRoadmap, handleOpenTemplatesFolder, openFileInEditor } from '../commands';
import { scaffoldVibekanWorkspace } from '../workspace';

export async function handleWebviewMessage(
  source: 'board' | 'sidebar',
  webview: vscode.Webview,
  message: any
) {
  switch (message.command) {
    case 'generateVibekan':
      await handleGenerateVibekan(webview);
      break;
    case 'openBoard':
      if (source === 'sidebar') {
        vscode.commands.executeCommand('vibekan.openBoard');
      }
      break;
    case 'openSettings':
      vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
      break;
    case 'checkState':
      await handleCheckState(webview);
      break;
    case 'loadTasks':
      await handleLoadTasks(webview);
      break;
    case 'moveTask': {
      const result = await handleMoveTask(
        message.taskId,
        message.fromStage as Stage,
        message.toStage as Stage,
        message.targetOrder
      );
      webview.postMessage({ type: 'taskMoved', ...result });
      if (result.ok) {
        await broadcastLatestTasks();
      }
      break;
    }
    case 'copyPrompt':
      await handleCopyPrompt(message.taskId, message.mode, webview);
      break;
    case 'reorderTasks': {
      const success = await handleReorderTasks(message.stage as Stage, message.taskOrder);
      if (success) {
        await broadcastLatestTasks();
      }
      break;
    }
    case 'openTaskFile':
      await openFileInEditor(message.filePath);
      break;
    case 'openRoadmap':
      await handleOpenRoadmap();
      break;
    case 'openArchitecture':
      await handleOpenArchitecture();
      break;
    case 'openTemplatesFolder':
      await handleOpenTemplatesFolder();
      break;
    case 'loadContextData':
      await sendContextData(webview);
      break;
    case 'createTask':
      await handleCreateTask(webview, message.payload);
      break;
    case 'createAgent':
      await handleCreateAgent(webview, message.payload ?? { name: message.name });
      break;
    case 'createPhase':
      await handleCreatePhase(webview, message.payload ?? { name: message.name });
      break;
    case 'createContext':
      await handleCreateContext(webview, message.payload ?? { name: message.name });
      break;
    case 'deleteTask':
      await handleDeleteTask(message.taskId);
      break;
    case 'duplicateTask':
      await handleDuplicateTask(webview, message.taskId);
      break;
    case 'archiveTask':
      await handleArchiveTask(webview, message.taskId);
      break;
    case 'unarchiveTask':
      await handleUnarchiveTask(webview, message.taskId);
      break;
    case 'readTaskFile':
      await handleReadTaskFile(webview, message.filePath);
      break;
    case 'saveTaskFile': {
      const ok = await handleSaveTaskFile(webview, message.filePath, message.content, message.close, message.metadata as TaskMetadataUpdate);
      if (ok) {
        await broadcastLatestTasks();
      }
      break;
    }
    case 'forceSaveTaskFile': {
      const ok = await handleForceSaveTaskFile(webview, message.filePath, message.content, message.close, message.metadata as TaskMetadataUpdate);
      if (ok) {
        await broadcastLatestTasks();
      }
      break;
    }
    case 'showInfo':
      vscode.window.showInformationMessage(message.message);
      break;
    case 'setThemeSettings':
      await updateThemeSettingsConfig(message.theme as ThemeSettingName, !!message.reducedMotion);
      await broadcastThemeSettings();
      break;
    default:
      console.warn('[Vibekan] Unknown webview command', message.command);
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
    webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: 'Workspace already exists' });
  } catch {
    try {
      await scaffoldVibekanWorkspace(vibekanUri);
      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: true });
      webview.postMessage({ type: 'state', exists: true });
      const contextData = await loadContextData();
      broadcastContextData(contextData);
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

async function broadcastLatestTasks() {
  const tasks = await loadTasksList();
  if (!tasks) return;
  broadcastTasks(tasks);
}

async function handleCreateTask(webview: vscode.Webview, payload: any) {
  try {
    const created = await createTaskFile({
      title: payload?.title ?? '',
      stage: payload?.stage as Stage,
      phase: payload?.phase,
      agent: payload?.agent,
      contexts: payload?.contexts,
      tags: payload?.tags,
      content: payload?.content,
      templateName: payload?.templateName,
    });

    if (!created) return;

    webview.postMessage({ type: 'taskCreated', task: created });
    await broadcastLatestTasks();
    const contextData = await loadContextData();
    broadcastContextData(contextData);
    await openFileInEditor(created.filePath);
  } catch (err) {
    console.error('Failed to create task:', err);
    vscode.window.showErrorMessage(`Failed to create task: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function handleCreateAgent(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await validateWorkspace();
  if (!vibekanUri) return;
  const slug = await createAgentFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'agentCreated', agent: slug });
  const data = await loadContextData();
  broadcastContextData(data);
}

async function handleCreatePhase(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await validateWorkspace();
  if (!vibekanUri) return;
  const slug = await createPhaseFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'phaseCreated', phase: slug });
  const data = await loadContextData();
  broadcastContextData(data);
}

async function handleCreateContext(webview: vscode.Webview, payload: { name: string; content?: string }) {
  const vibekanUri = await validateWorkspace();
  if (!vibekanUri) return;
  const slug = await createContextFile(vibekanUri, payload.name, payload.content);
  webview.postMessage({ type: 'contextCreated', context: slug });
  const data = await loadContextData();
  broadcastContextData(data);
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
    await broadcastLatestTasks();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    vscode.window.showErrorMessage(message);
  }
}

async function handleDuplicateTask(webview: vscode.Webview, taskId: string) {
  const created = await duplicateTask(taskId);
  if (!created) return;
  webview.postMessage({ type: 'taskCreated', task: created });
  await broadcastLatestTasks();
}

async function handleArchiveTask(webview: vscode.Webview, taskId: string) {
  await handleArchiveToggle(webview, taskId, 'completed', 'archive', 'archived');
}

async function handleUnarchiveTask(webview: vscode.Webview, taskId: string) {
  await handleArchiveToggle(webview, taskId, 'archive', 'completed', 'unarchived');
}

async function handleArchiveToggle(
  webview: vscode.Webview,
  taskId: string,
  expectedStage: Stage,
  targetStage: Stage,
  successVerb: string
) {
  const tasks = await loadTasksList();
  if (!tasks) return;
  const existing = tasks.find((t) => t.id === taskId);
  if (!existing) return;

  if (existing.stage !== expectedStage) {
    vscode.window.showWarningMessage(`Only ${expectedStage} tasks can be ${successVerb}.`);
    return;
  }

  const result = await handleMoveTask(taskId, existing.stage, targetStage);
  webview.postMessage({ type: 'taskMoved', ...result });
  if (result.ok) {
    vscode.window.showInformationMessage(`Task "${existing.title}" ${successVerb}.`);
    await broadcastLatestTasks();
  } else if (result.message) {
    vscode.window.showErrorMessage(result.message);
  }
}

async function validateWorkspace(): Promise<vscode.Uri | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace open');
    return null;
  }
  const vibekanUri = vscode.Uri.joinPath(workspaceFolders[0].uri, '.vibekan');
  try {
    await vscode.workspace.fs.stat(vibekanUri);
    return vibekanUri;
  } catch {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return null;
  }
}
