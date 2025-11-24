import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  // Register a command to open the Vibekan board
  const disposable = vscode.commands.registerCommand('vibekan.openBoard', () => {
    const panel = vscode.window.createWebviewPanel(
      'vibekanBoard',
      'Vibekan Board',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'dist'))]
      }
    );

    const indexPath = path.join(context.extensionPath, 'dist', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    // Adjust script src to use webview URI
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'dist', 'assets', 'index.js')));
    html = html.replace(/<script type="module" src=".*"><\/script>/, `<script type="module" src="${scriptUri}"></script>`);
    panel.webview.html = html;
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
