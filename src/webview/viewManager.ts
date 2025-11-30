import * as vscode from 'vscode';
import { Task } from '../types/task';
import { ContextData } from '../services';
import { getCopySettings, getThemeSettings } from '../settings';

let boardWebview: vscode.Webview | null = null;
let sidebarWebview: vscode.Webview | null = null;

export function setBoardWebview(webview: vscode.Webview | null) {
  boardWebview = webview;
}

export function setSidebarWebview(webview: vscode.Webview | null) {
  sidebarWebview = webview;
}

export function getBoardWebview(): vscode.Webview | null {
  return boardWebview;
}

export function getSidebarWebview(): vscode.Webview | null {
  return sidebarWebview;
}

export async function sendCopySettings(webview: vscode.Webview) {
  const settings = getCopySettings();
  webview.postMessage({ type: 'copySettings', settings });
}

export async function sendThemeSettings(webview: vscode.Webview) {
  const settings = getThemeSettings();
  webview.postMessage({ type: 'themeSettings', settings });
}

export async function broadcastCopySettings() {
  if (sidebarWebview) {
    await sendCopySettings(sidebarWebview);
  }
  if (boardWebview) {
    await sendCopySettings(boardWebview);
  }
}

export async function broadcastThemeSettings() {
  if (sidebarWebview) {
    await sendThemeSettings(sidebarWebview);
  }
  if (boardWebview) {
    await sendThemeSettings(boardWebview);
  }
}

export function broadcastTasks(tasks: Task[]): void {
  if (sidebarWebview) {
    sidebarWebview.postMessage({ type: 'tasks', tasks });
  }
  if (boardWebview) {
    boardWebview.postMessage({ type: 'tasks', tasks });
  }
}

export function broadcastContextData(data: ContextData): void {
  if (sidebarWebview) {
    sidebarWebview.postMessage({ type: 'contextData', data });
  }
  if (boardWebview) {
    boardWebview.postMessage({ type: 'contextData', data });
  }
}
