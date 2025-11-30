import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeStage, inferStageFromFilePath, parseFrontmatterDocument, stringifyDocument, getBaseSlug, ParsedFrontmatter } from '../core';
import { validateVibekanPath } from '../workspace';
import { readTextIfExists, ensureDirectory } from './fileSystem';
import { Stage } from '../types/task';

export interface TaskMetadataUpdate {
  title?: string;
  stage?: Stage;
  phase?: string;
  agent?: string;
  contexts?: string[];
  tags?: string[];
}

// Track file modification times for conflict detection
const fileMtimes = new Map<string, number>();

export async function handleReadTaskFile(webview: vscode.Webview, filePath: string): Promise<boolean> {
  try {
    const validation = await validateVibekanPath(filePath);
    if (!validation.valid) {
      webview.postMessage({
        command: 'taskFileError',
        filePath,
        error: validation.error,
      });
      return false;
    }

    const uri = vscode.Uri.file(filePath);
    const content = await readTextIfExists(uri);
    if (content !== null) {
      try {
        const stat = await vscode.workspace.fs.stat(uri);
        fileMtimes.set(filePath, stat.mtime);
      } catch {
        // Ignore stat errors
      }

      const parsedDoc = parseFrontmatterDocument(content);
      const parsedFrontmatter = parsedDoc.hasFrontmatter ? parsedDoc.data : null;

      const metadata: TaskMetadataUpdate = {};
      if (parsedFrontmatter) {
        if (typeof parsedFrontmatter.title === 'string') {
          metadata.title = parsedFrontmatter.title;
        }
        if (typeof parsedFrontmatter.stage === 'string') {
          metadata.stage = normalizeStage(parsedFrontmatter.stage, undefined);
        }
        if (typeof parsedFrontmatter.phase === 'string') {
          metadata.phase = parsedFrontmatter.phase;
        }
        if (typeof parsedFrontmatter.agent === 'string') {
          metadata.agent = parsedFrontmatter.agent;
        }
        if (Array.isArray(parsedFrontmatter.contexts)) {
          metadata.contexts = parsedFrontmatter.contexts as string[];
        } else if (typeof parsedFrontmatter.context === 'string' && parsedFrontmatter.context.trim()) {
          metadata.contexts = [parsedFrontmatter.context.trim()];
        }
        if (Array.isArray(parsedFrontmatter.tags)) {
          metadata.tags = parsedFrontmatter.tags as string[];
        }
      }

      webview.postMessage({
        command: 'taskFileContent',
        filePath,
        content,
        metadata,
      });
      return true;
    }

    webview.postMessage({
      command: 'taskFileError',
      filePath,
      error: 'File not found',
    });
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read file';
    webview.postMessage({
      command: 'taskFileError',
      filePath,
      error: message,
    });
    return false;
  }
}

export async function handleSaveTaskFile(
  webview: vscode.Webview,
  filePath: string,
  content: string,
  closeAfter: boolean,
  metadata?: TaskMetadataUpdate
): Promise<boolean> {
  try {
    const validation = await validateVibekanPath(filePath);
    if (!validation.valid) {
      webview.postMessage({
        command: 'taskFileSaveError',
        filePath,
        error: validation.error,
      });
      return false;
    }

    const uri = vscode.Uri.file(filePath);

    // Check for conflict (file modified externally)
    const storedMtime = fileMtimes.get(filePath);
    if (storedMtime !== undefined) {
      try {
        const currentStat = await vscode.workspace.fs.stat(uri);
        if (currentStat.mtime !== storedMtime) {
          webview.postMessage({
            command: 'taskFileConflict',
            filePath,
            message: 'File was modified externally. Overwrite changes?',
          });
          return false;
        }
      } catch {
        // File may have been deleted, proceed with save
      }
    }

    const pathStage = inferStageFromFilePath(filePath, undefined);
    if (!pathStage) {
      webview.postMessage({
        command: 'taskFileSaveError',
        filePath,
        error: 'Could not determine stage from file path.',
      });
      return false;
    }

    const parsedDoc = parseFrontmatterDocument(content);
    const parsedFrontmatter: ParsedFrontmatter = parsedDoc.hasFrontmatter ? { ...parsedDoc.data } : {};
    const bodyContent = parsedDoc.content;

    if (metadata) {
      if (metadata.title !== undefined) {
        parsedFrontmatter.title = metadata.title;
      }
      if (metadata.stage !== undefined) {
        parsedFrontmatter.stage = metadata.stage;
      }
      if (metadata.phase !== undefined) {
        if (metadata.phase) {
          parsedFrontmatter.phase = metadata.phase;
        } else {
          delete parsedFrontmatter.phase;
        }
      }
      if (metadata.agent !== undefined) {
        if (metadata.agent) {
          parsedFrontmatter.agent = metadata.agent;
        } else {
          delete parsedFrontmatter.agent;
        }
      }
      if (metadata.contexts !== undefined) {
        if (metadata.contexts.length > 0) {
          parsedFrontmatter.contexts = metadata.contexts;
          delete (parsedFrontmatter as any).context;
        } else {
          delete parsedFrontmatter.contexts;
          delete (parsedFrontmatter as any).context;
        }
      }
      if (metadata.tags !== undefined) {
        if (metadata.tags.length > 0) {
          parsedFrontmatter.tags = metadata.tags;
        } else {
          delete parsedFrontmatter.tags;
        }
      }
    }

    const currentStage = normalizeStage(
      typeof parsedFrontmatter.stage === 'string' ? parsedFrontmatter.stage : undefined,
      pathStage
    );

    let contentToPersist = content;
    let targetStageUri: vscode.Uri | null = null;
    const stageChanged = currentStage && pathStage && currentStage !== pathStage;
    const fileBaseName = path.basename(filePath, '.md');
    const fallbackId = (parsedFrontmatter?.id as string | undefined) ?? fileBaseName;

    let existingStat: vscode.FileStat | null = null;
    try {
      existingStat = await vscode.workspace.fs.stat(uri);
    } catch {
      existingStat = null;
    }

    if (stageChanged) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        const rootUri = workspaceFolders[0].uri;
        const tasksUri = vscode.Uri.joinPath(rootUri, '.vibekan', 'tasks');
        targetStageUri = vscode.Uri.joinPath(tasksUri, currentStage);
        await ensureDirectory(targetStageUri);

        const destEntries = await vscode.workspace.fs.readDirectory(targetStageUri);
        let maxOrder = -1;
        let destCount = 0;
        for (const [destName, destType] of destEntries) {
          if (destType !== vscode.FileType.File || !destName.endsWith('.md')) continue;
          destCount += 1;
          const destUri = vscode.Uri.joinPath(targetStageUri, destName);
          const destContent = await readTextIfExists(destUri);
          if (destContent) {
            const destParsed = parseFrontmatterDocument(destContent);
            const parsedOrder =
              typeof destParsed.data.order === 'number'
                ? destParsed.data.order
                : typeof destParsed.data.order === 'string'
                  ? parseInt(destParsed.data.order, 10)
                  : undefined;
            if (typeof parsedOrder === 'number' && !Number.isNaN(parsedOrder) && parsedOrder > maxOrder) {
              maxOrder = parsedOrder;
            }
          }
        }
        const newOrder = maxOrder >= 0 ? maxOrder + 1 : destCount;
        const createdFallback =
          typeof parsedFrontmatter?.created === 'string'
            ? parsedFrontmatter.created
            : existingStat
              ? new Date(existingStat.ctime).toISOString()
              : new Date().toISOString();

        const updatedFrontmatter: ParsedFrontmatter = parsedFrontmatter ? { ...parsedFrontmatter } : {};
        updatedFrontmatter.id = fallbackId;
        updatedFrontmatter.stage = currentStage;
        updatedFrontmatter.updated = new Date().toISOString();
        updatedFrontmatter.order = newOrder;
        if (!updatedFrontmatter.title) {
          updatedFrontmatter.title = getBaseSlug(fileBaseName).replace(/-/g, ' ');
        }
        if (!updatedFrontmatter.created) {
          updatedFrontmatter.created = createdFallback;
        }

        contentToPersist = stringifyDocument(bodyContent, updatedFrontmatter);
      }
    } else if (metadata) {
      if (!parsedFrontmatter.stage) {
        parsedFrontmatter.stage = currentStage ?? pathStage ?? 'idea';
      }
      if (!parsedFrontmatter.id) {
        parsedFrontmatter.id = fallbackId;
      }
      if (!parsedFrontmatter.created) {
        parsedFrontmatter.created = existingStat
          ? new Date(existingStat.ctime).toISOString()
          : new Date().toISOString();
      }
      parsedFrontmatter.updated = new Date().toISOString();
      contentToPersist = stringifyDocument(bodyContent, parsedFrontmatter);
    }

    const encoder = new TextEncoder();
    await vscode.workspace.fs.writeFile(uri, encoder.encode(contentToPersist));

    let finalFilePath = filePath;
    let fileMoved = false;
    let moveErrorMessage: string | null = null;
    const fileNameWithExtension = path.basename(filePath);

    try {
      const newStat = await vscode.workspace.fs.stat(uri);
      fileMtimes.set(filePath, newStat.mtime);
    } catch {
      fileMtimes.delete(filePath);
    }

    if (stageChanged && targetStageUri && currentStage && pathStage && currentStage !== pathStage) {
      const newFileUri = vscode.Uri.joinPath(targetStageUri, fileNameWithExtension);

      try {
        await vscode.workspace.fs.rename(uri, newFileUri, { overwrite: false });
        fileMtimes.delete(filePath);
        finalFilePath = newFileUri.fsPath;
        fileMoved = true;
        try {
          const movedStat = await vscode.workspace.fs.stat(newFileUri);
          fileMtimes.set(finalFilePath, movedStat.mtime);
        } catch {
          fileMtimes.delete(finalFilePath);
        }
      } catch (moveError) {
        const moveMessage = moveError instanceof Error ? moveError.message : 'Unknown move error';
        const isCrossDevice = typeof moveMessage === 'string' && moveMessage.includes('EXDEV');

        if (isCrossDevice) {
          try {
            await vscode.workspace.fs.copy(uri, newFileUri, { overwrite: false });
            await vscode.workspace.fs.delete(uri);
            fileMtimes.delete(filePath);
            finalFilePath = newFileUri.fsPath;
            fileMoved = true;
            try {
              const movedStat = await vscode.workspace.fs.stat(newFileUri);
              fileMtimes.set(finalFilePath, movedStat.mtime);
            } catch {
              fileMtimes.delete(finalFilePath);
            }
          } catch (copyError) {
            moveErrorMessage = copyError instanceof Error ? copyError.message : moveMessage;
          }
        } else {
          moveErrorMessage = moveMessage;
        }

        if (!fileMoved && parsedDoc.hasFrontmatter && pathStage) {
          try {
            const revertedFrontmatter: ParsedFrontmatter = parsedFrontmatter ? { ...parsedFrontmatter } : {};
            revertedFrontmatter.stage = pathStage;
            revertedFrontmatter.id = fallbackId;
            if (parsedFrontmatter && parsedFrontmatter.order) {
              revertedFrontmatter.order = parsedFrontmatter.order;
            } else {
              delete revertedFrontmatter.order;
            }

            const revertedText = stringifyDocument(bodyContent, revertedFrontmatter);
            await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(revertedText));
            try {
              const revertedStat = await vscode.workspace.fs.stat(uri);
              fileMtimes.set(filePath, revertedStat.mtime);
            } catch {
              fileMtimes.delete(filePath);
            }
          } catch (revertError) {
            console.error('Failed to revert stage after move failure:', revertError);
            fileMtimes.delete(filePath);
          }
        }
      }
    }

    if (moveErrorMessage) {
      webview.postMessage({
        command: 'taskFileSaveError',
        filePath,
        error: `Failed to move file to stage "${currentStage ?? 'unknown'}": ${moveErrorMessage}. Stage kept as "${pathStage ?? 'unknown'}".`,
      });
      return false;
    }

    webview.postMessage({
      command: 'taskFileSaved',
      filePath: finalFilePath,
      originalFilePath: filePath,
      close: closeAfter,
      moved: fileMoved,
    });

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save file';
    webview.postMessage({
      command: 'taskFileSaveError',
      filePath,
      error: message,
    });
    return false;
  }
}

export async function handleForceSaveTaskFile(
  webview: vscode.Webview,
  filePath: string,
  content: string,
  closeAfter: boolean,
  metadata?: TaskMetadataUpdate
): Promise<boolean> {
  fileMtimes.delete(filePath);
  return handleSaveTaskFile(webview, filePath, content, closeAfter, metadata);
}

export function clearFileMtimes(): void {
  fileMtimes.clear();
}
