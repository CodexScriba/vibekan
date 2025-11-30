import * as path from 'path';
import * as vscode from 'vscode';
import { Stage, ALL_STAGES } from '../types/task';
import { LEGACY_STAGE_ALIASES } from './constants';

export function normalizeStage(input?: string, fallback: Stage | undefined = 'idea'): Stage | undefined {
  if (!input) return fallback;
  const value = input.toLowerCase();
  if (ALL_STAGES.includes(value as Stage)) {
    return value as Stage;
  }
  if (LEGACY_STAGE_ALIASES[value]) {
    return LEGACY_STAGE_ALIASES[value];
  }
  return fallback;
}

export function inferStageFromFilePath(filePath: string, fallback?: Stage): Stage | undefined {
  const normalizedPath = filePath.split(path.sep).join('/');
  const match = normalizedPath.match(/\.vibekan\/tasks\/([^/]+)/);
  const candidate = match?.[1] ?? path.basename(path.dirname(filePath));
  const normalized = normalizeStage(candidate, undefined);
  if (normalized) {
    return normalized;
  }
  return fallback;
}

export function inferStageFromUri(fileUri: vscode.Uri, fallback?: Stage): Stage | undefined {
  return inferStageFromFilePath(fileUri.fsPath, fallback);
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

export function getBaseSlug(idOrFileName: string): string {
  const trimmed = idOrFileName.replace(/\.md$/, '');
  const lower = trimmed.toLowerCase();
  for (const stage of ALL_STAGES) {
    const prefix = `${stage}-`;
    if (lower.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  for (const legacy of Object.keys(LEGACY_STAGE_ALIASES)) {
    const prefix = `${legacy}-`;
    if (lower.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  if (lower.startsWith('task-')) {
    return trimmed.slice('task-'.length);
  }
  return trimmed;
}
