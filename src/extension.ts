import * as vscode from 'vscode';
import {
  VibekanSidebarProvider,
  getWebviewContent,
  setBoardWebview,
  broadcastCopySettings,
  broadcastThemeSettings,
  sendCopySettings,
  sendThemeSettings,
} from './webview';
import { quickCopyPrompt } from './services/promptService';
import { handleWebviewMessage } from './webview/messageRouter';
import { normalizeStage, getBaseSlug } from './core';
import { scaffoldVibekanWorkspace } from './workspace';
import { ensureUniqueTaskId, handleMoveTask } from './services/taskMoveService';
import { createTaskFile, loadTasksList, duplicateTask } from './services/taskService';
import { handleSaveTaskFile } from './services/taskFileService';
import { loadContextData } from './services/contextService';

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new VibekanSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('vibekanView', sidebarProvider)
  );

  const openBoardDisposable = vscode.commands.registerCommand('vibekan.openBoard', () => {
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

    setBoardWebview(panel.webview);
    panel.onDidDispose(() => setBoardWebview(null));

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, 'board');
    sendCopySettings(panel.webview);
    sendThemeSettings(panel.webview);

    panel.webview.onDidReceiveMessage(async (message) => {
      await handleWebviewMessage('board', panel.webview, message);
    });
  });

  context.subscriptions.push(openBoardDisposable);

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
    if (event.affectsConfiguration('vibekan.theme') || event.affectsConfiguration('vibekan.reducedMotion')) {
      broadcastThemeSettings();
    }
  });

  context.subscriptions.push(configListener);
}

export function deactivate() {}

// Exposed for unit tests only
export const TEST_API = {
  scaffoldVibekanWorkspace,
  normalizeStage,
  getBaseSlug,
  ensureUniqueTaskId,
  createTaskFile,
  handleMoveTask,
  handleSaveTaskFile,
  loadTasksList,
  loadContextData,
  handleDuplicateTask: duplicateTask,
};
