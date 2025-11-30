import * as vscode from 'vscode';
import * as path from 'path';

// Lightweight shared file helpers used by workspace/services layers.
export async function readTextIfExists(uri: vscode.Uri): Promise<string | null> {
  try {
    const buf = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(buf).toString('utf8');
  } catch {
    return null;
  }
}

export async function ensureDirectory(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.stat(uri);
  } catch {
    await vscode.workspace.fs.createDirectory(uri);
  }
}

export async function createTemplateFile(target: vscode.Uri, contents: string): Promise<void> {
  const dir = vscode.Uri.file(path.dirname(target.fsPath));
  await ensureDirectory(dir);
  await vscode.workspace.fs.writeFile(target, Buffer.from(contents, 'utf8'));
}
