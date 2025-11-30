import * as vscode from 'vscode';
import { ensureVibekanRoot } from '../workspace';
import { ensureDirectory } from '../services';

export async function openFileInEditor(filePath: string): Promise<void> {
  try {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri, { preview: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open file';
    vscode.window.showErrorMessage(message);
  }
}

export async function handleOpenArchitecture(): Promise<void> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }
  const archUri = vscode.Uri.joinPath(vibekanUri, '_context', 'architecture.md');
  await openFileInEditor(archUri.fsPath);
}

export async function handleOpenRoadmap(): Promise<void> {
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

export async function handleOpenTemplatesFolder(): Promise<void> {
  const vibekanUri = await ensureVibekanRoot();
  if (!vibekanUri) {
    vscode.window.showErrorMessage('No .vibekan workspace found. Generate Vibekan first.');
    return;
  }

  const templatesUri = vscode.Uri.joinPath(vibekanUri, '_templates');
  await ensureDirectory(templatesUri);
  await vscode.commands.executeCommand('revealFileInOS', templatesUri);
}
