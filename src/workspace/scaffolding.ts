import * as vscode from 'vscode';
import { ALL_STAGES } from '../types/task';

export async function ensureVibekanRoot(): Promise<vscode.Uri | null> {
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

export async function scaffoldVibekanWorkspace(vibekanUri: vscode.Uri) {
  await vscode.workspace.fs.createDirectory(vibekanUri);

  const stageDirs = ALL_STAGES.map((stage) => `tasks/${stage}`);
  const dirs = [...stageDirs, '_context/stages', '_context/phases', '_context/agents', '_context/custom', '_templates'];
  for (const dir of dirs) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(vibekanUri, dir));
  }

  const files: Array<{ path: string; contents: string }> = [
    {
      path: '_context/architecture.md',
      contents: '# Architecture\n\nDescribe your project architecture here. This file is referenced by Vibekan.\n',
    },
  ];

  for (const stage of ALL_STAGES) {
    files.push({
      path: `_context/stages/${stage}.md`,
      contents: `# Stage: ${stage}\n\nDescribe how tasks should be executed in this stage.\n`,
    });
  }

  files.push({
    path: '_templates/feature.md',
    contents: `# Feature: {{title}}\n\n## Goal\n{{content}}\n\n- Stage: {{stage}}\n- Phase: {{phase}}\n- Agent: {{agent}}\n- Contexts: {{contexts}}\n- Tags: {{tags}}\n`,
  });

  files.push({
    path: '_templates/bug.md',
    contents: `# Bug: {{title}}\n\n## Expected\n\n## Actual\n\n## Steps\n1. \n2. \n\nContext: {{contexts}}\nAgent: {{agent}}\nTags: {{tags}}\n`,
  });

  for (const file of files) {
    const target = vscode.Uri.joinPath(vibekanUri, file.path);
    await vscode.workspace.fs.writeFile(target, Buffer.from(file.contents, 'utf8'));
  }
}
