import * as vscode from 'vscode';
import { ensureDirectory, readTextIfExists, createTemplateFile } from '../core';

export { ensureDirectory, readTextIfExists, createTemplateFile };

export async function listFilesWithoutExtension(dir: vscode.Uri): Promise<string[]> {
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

export async function readContextDirectory(dir: vscode.Uri): Promise<Record<string, string>> {
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
