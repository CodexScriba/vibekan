import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, viewType: 'sidebar' | 'board'): string {
  const indexHtmlPath = path.join(extensionUri.fsPath, 'dist', 'index.html');
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  } catch (e) {
    console.error('Could not read index.html', e);
    return `<!DOCTYPE html><html><body>Error loading Webview: Could not read dist/index.html</body></html>`;
  }

  const nonce = getNonce();

  // Replace script src
  htmlContent = htmlContent.replace(
    /src="\/assets\/([^"]+)"/g,
    (_match, p1) => `src="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', p1))}"`
  );

  // Replace css href
  htmlContent = htmlContent.replace(
    /href="\/assets\/([^"]+)"/g,
    (_match, p1) => `href="${webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', p1))}"`
  );

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource} blob:; worker-src blob:; font-src ${webview.cspSource} data:; img-src ${webview.cspSource} https: data:;">`;
  const contextScript = `<script nonce="${nonce}">window.vibekanViewType = '${viewType}';</script>`;

  htmlContent = htmlContent.replace('<head>', `<head>${cspMeta}`);
  htmlContent = htmlContent.replace('<body>', `<body>${contextScript}`);
  htmlContent = htmlContent.replace(/<script(?![^>]*\bnonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`);

  return htmlContent;
}
