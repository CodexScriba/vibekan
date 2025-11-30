import * as vscode from 'vscode';
import * as path from 'path';
import { parseFrontmatterDocument, stringifyDocument, readTextIfExists, ensureDirectory } from '../core';

export async function migrateLegacyStages(vibekanUri: vscode.Uri): Promise<void> {
  const tasksRoot = vscode.Uri.joinPath(vibekanUri, 'tasks');
  const legacyChatUri = vscode.Uri.joinPath(tasksRoot, 'chat');
  const ideaUri = vscode.Uri.joinPath(tasksRoot, 'idea');

  let legacyChatExists = false;
  try {
    await vscode.workspace.fs.stat(legacyChatUri);
    legacyChatExists = true;
  } catch {
    legacyChatExists = false;
  }

  if (legacyChatExists) {
    await ensureDirectory(ideaUri);
    const entries = await vscode.workspace.fs.readDirectory(legacyChatUri);
    for (const [fileName, fileType] of entries) {
      if (fileType !== vscode.FileType.File || !fileName.endsWith('.md')) continue;

      const source = vscode.Uri.joinPath(legacyChatUri, fileName);

      const content = await readTextIfExists(source);
      if (content) {
        const parsedDoc = parseFrontmatterDocument(content);
        const parsed = parsedDoc.data;
        if (parsed.stage === 'chat') {
          parsed.stage = 'idea';
          const nextText = stringifyDocument(parsedDoc.content, parsed);
          await vscode.workspace.fs.writeFile(source, Buffer.from(nextText, 'utf8'));
        }
      }

      let target = vscode.Uri.joinPath(ideaUri, fileName);
      const base = path.basename(fileName, '.md');
      let counter = 1;
      while (true) {
        try {
          await vscode.workspace.fs.stat(target);
          counter += 1;
          target = vscode.Uri.joinPath(ideaUri, `${base}-${counter}.md`);
        } catch {
          break;
        }
      }

      try {
        await vscode.workspace.fs.rename(source, target, { overwrite: false });
      } catch (error) {
        console.error('[Vibekan] Failed to migrate legacy chat task', fileName, error);
      }
    }

    try {
      await vscode.workspace.fs.delete(legacyChatUri, { recursive: true });
    } catch {
      // ignore delete errors
    }
  }

  const legacyStageContext = vscode.Uri.joinPath(vibekanUri, '_context', 'stages', 'chat.md');
  const ideaStageContext = vscode.Uri.joinPath(vibekanUri, '_context', 'stages', 'idea.md');

  try {
    await vscode.workspace.fs.stat(legacyStageContext);
    let ideaExists = false;
    try {
      await vscode.workspace.fs.stat(ideaStageContext);
      ideaExists = true;
    } catch {
      ideaExists = false;
    }

    if (!ideaExists) {
      await ensureDirectory(vscode.Uri.joinPath(vibekanUri, '_context', 'stages'));
      const content = await readTextIfExists(legacyStageContext);
      const updated = content?.replace(/Stage:\s*chat/i, 'Stage: idea');
      await vscode.workspace.fs.writeFile(
        ideaStageContext,
        Buffer.from(
          updated ?? '# Stage: idea\n\nDescribe how tasks should be executed in this stage.\n',
          'utf8'
        )
      );
    }
  } catch {
    // legacy stage context not found; nothing to migrate
  }
}
