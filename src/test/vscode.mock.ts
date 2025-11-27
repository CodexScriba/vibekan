import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';

export const FileType = { File: 1, Directory: 2 } as const;
export const ViewColumn = { One: 1 } as const;
export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 } as const;

const makeUri = (fsPath: string) => ({ fsPath, path: fsPath });
const file = (p: string) => makeUri(path.resolve(p));
const joinPath = (uri: { fsPath: string }, ...parts: string[]) => makeUri(path.join(uri.fsPath, ...parts));

const stat = async (uri: { fsPath: string }) => {
  const stats = await fs.promises.stat(uri.fsPath);
  return {
    type: stats.isDirectory() ? FileType.Directory : FileType.File,
    ctime: stats.ctimeMs,
    mtime: stats.mtimeMs,
    size: stats.size,
  };
};

const createDirectory = async (uri: { fsPath: string }) => {
  await fs.promises.mkdir(uri.fsPath, { recursive: true });
};

const writeFile = async (uri: { fsPath: string }, data: Uint8Array) => {
  await fs.promises.mkdir(path.dirname(uri.fsPath), { recursive: true });
  await fs.promises.writeFile(uri.fsPath, data);
};

const readDirectory = async (uri: { fsPath: string }) => {
  const entries = await fs.promises.readdir(uri.fsPath, { withFileTypes: true });
  return entries.map((entry) => [entry.name, entry.isDirectory() ? FileType.Directory : FileType.File] as const);
};

const rename = async (oldUri: { fsPath: string }, newUri: { fsPath: string }) => {
  await fs.promises.mkdir(path.dirname(newUri.fsPath), { recursive: true });
  await fs.promises.rename(oldUri.fsPath, newUri.fsPath);
};

const copy = async (oldUri: { fsPath: string }, newUri: { fsPath: string }, opts?: { overwrite?: boolean }) => {
  await fs.promises.mkdir(path.dirname(newUri.fsPath), { recursive: true });
  if (!opts?.overwrite) {
    try {
      await fs.promises.stat(newUri.fsPath);
      throw new Error('File exists');
    } catch (err: any) {
      if (err?.code !== 'ENOENT') {
        throw err;
      }
    }
  }
  await fs.promises.copyFile(oldUri.fsPath, newUri.fsPath);
};

const remove = async (uri: { fsPath: string }, opts?: { recursive?: boolean }) => {
  await fs.promises.rm(uri.fsPath, { recursive: opts?.recursive ?? false, force: true });
};

const readFile = async (uri: { fsPath: string }) => fs.promises.readFile(uri.fsPath);

const getWorkspaceRoot = () => process.env.VIBEKAN_TEST_ROOT ?? process.cwd();
let workspaceFoldersValue: Array<{ uri: { fsPath: string } }> | null = null;

export const Uri = { joinPath, file };
export const workspace = {
  fs: { stat, createDirectory, writeFile, readDirectory, rename, copy, delete: remove, readFile },
  get workspaceFolders() {
    if (workspaceFoldersValue) return workspaceFoldersValue;
    return [{ uri: file(getWorkspaceRoot()) }];
  },
  set workspaceFolders(value: Array<{ uri: { fsPath: string } }> | null) {
    workspaceFoldersValue = value;
  },
  getConfiguration: vi.fn().mockReturnValue({ get: vi.fn(), update: vi.fn() }),
};

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  registerWebviewViewProvider: vi.fn(),
  createWebviewPanel: vi.fn(),
};

export default { workspace, Uri, window, FileType, ConfigurationTarget, ViewColumn };
