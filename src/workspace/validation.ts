import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface ValidationResult {
  valid: boolean;
  vibekanRoot?: string;
  error?: string;
}

export async function validateVibekanPath(filePath: string): Promise<ValidationResult> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return { valid: false, error: 'No workspace open' };
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const vibekanRoot = path.resolve(rootPath, '.vibekan');

  let vibekanRealPath: string;
  try {
    vibekanRealPath = await fs.promises.realpath(vibekanRoot);
  } catch {
    return { valid: false, error: 'No .vibekan workspace found' };
  }

  const resolvedPath = path.resolve(filePath);
  let targetRealPath = resolvedPath;
  try {
    targetRealPath = await fs.promises.realpath(resolvedPath);
  } catch {
    // File may not exist yet; fallback to resolved path (still protects traversal)
  }

  const relativePath = path.relative(vibekanRealPath, targetRealPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return { valid: false, error: 'Access denied: file is outside .vibekan directory' };
  }

  return { valid: true, vibekanRoot: vibekanRealPath };
}
