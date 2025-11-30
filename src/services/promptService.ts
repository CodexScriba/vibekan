import * as vscode from 'vscode';
import { CopyMode } from '../types/copy';
import { STAGES, Task } from '../types/task';
import { extractUserNotes, readTextIfExists } from '../core';
import { loadTasksList } from './taskService';
import { getCopySettings, resolveCopyMode } from '../settings';
import { PromptBuilder } from '../utils/promptBuilder';
import { readContextDirectory } from './fileSystem';
import { ensureVibekanRoot } from '../workspace';

export async function handleCopyPrompt(taskId: string, requestedMode?: CopyMode, sourceWebview?: vscode.Webview) {
  const tasks = await loadTasksList();
  if (!tasks || tasks.length === 0) {
    vscode.window.showErrorMessage('No tasks found. Create a task first.');
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: 'No tasks available.' });
    }
    return;
  }

  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    if (sourceWebview) {
      sourceWebview.postMessage({ type: 'copyError', error: 'No .vibekan workspace found.' });
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
    const customContexts: Record<string, string> = {};
    if (task.contexts && task.contexts.length > 0) {
      for (const ctx of task.contexts) {
        const content = await readTextIfExists(
          vscode.Uri.joinPath(vibekanUri, '_context', 'custom', `${ctx}.md`)
        );
        if (content) {
          customContexts[ctx] = content;
        }
      }
    }
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
        customContexts,
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

export async function quickCopyPrompt(mode: CopyMode) {
  const tasks = await loadTasksList();
  if (!tasks || tasks.length === 0) {
    vscode.window.showErrorMessage('No tasks available to copy.');
    return;
  }

  const pick = await vscode.window.showQuickPick<{ label: string; description?: string; taskId: string }>(
    tasks.map((task: Task) => ({
      label: task.title,
      description: [task.stage, task.phase, task.agent].filter(Boolean).join(' • '),
      taskId: task.id,
    })),
    { placeHolder: 'Select a task to copy' }
  );

  if (!pick) return;

  await handleCopyPrompt(pick.taskId, mode);
}
