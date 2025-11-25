import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  // Register the Sidebar View Provider
  const sidebarProvider = new VibekanSidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('vibekanView', sidebarProvider)
  );

  // Register a command to open the Vibekan board
  const disposable = vscode.commands.registerCommand('vibekan.openBoard', () => {
    const panel = vscode.window.createWebviewPanel(
      'vibekanBoard',
      'Vibekan Board',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist'),
          vscode.Uri.joinPath(context.extensionUri, 'media')
        ]
      }
    );

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, 'board');

    // Handle messages from the board
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'generateVibekan':
            await handleGenerateVibekan(panel.webview);
            break;
          case 'openSettings':
            vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
            break;
          case 'checkState':
            await handleCheckState(panel.webview);
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

class VibekanSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'generateVibekan':
          await handleGenerateVibekan(webviewView.webview);
          break;
        case 'openBoard':
          vscode.commands.executeCommand('vibekan.openBoard');
          break;
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', 'vibekan');
          break;
        case 'checkState':
          await handleCheckState(webviewView.webview);
          break;
      }
    });
  }
}

async function handleGenerateVibekan(webview: vscode.Webview) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: 'No workspace open' });
    return;
  }

  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');

  try {
    await vscode.workspace.fs.stat(vibekanUri);
    // If stat succeeds, folder exists
    webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: 'Workspace already exists' });
  } catch {
    // If stat fails, folder likely doesn't exist, proceed to create
    try {
      await vscode.workspace.fs.createDirectory(vibekanUri);
      // Scaffold subdirectories
      const dirs = ['tasks/chat', 'tasks/queue', 'tasks/plan', 'tasks/code', 'tasks/audit', 'tasks/completed', '_context/stages', '_context/phases', '_context/agents'];
      for (const dir of dirs) {
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(vibekanUri, dir));
      }

      // Create default context files (minimal placeholders for roadmap alignment)
      const files: Array<{ path: string; contents: string }> = [
        {
          path: '_context/architecture.md',
          contents: '# Architecture\n\nDescribe your project architecture here. This file is referenced by Vibekan.\n',
        },
      ];

      for (const file of files) {
        const target = vscode.Uri.joinPath(vibekanUri, file.path);
        await vscode.workspace.fs.writeFile(target, Buffer.from(file.contents, 'utf8'));
      }

      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: true });
      // Also send state update
      webview.postMessage({ type: 'state', exists: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webview.postMessage({ type: 'result', command: 'generateVibekan', ok: false, message: `Failed to create workspace: ${errorMessage}` });
    }
  }
}

async function handleCheckState(webview: vscode.Webview) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    webview.postMessage({ type: 'state', exists: false });
    return;
  }
  const rootUri = workspaceFolders[0].uri;
  const vibekanUri = vscode.Uri.joinPath(rootUri, '.vibekan');
  try {
    await vscode.workspace.fs.stat(vibekanUri);
    webview.postMessage({ type: 'state', exists: true });
  } catch {
    webview.postMessage({ type: 'state', exists: false });
  }
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, viewType: 'sidebar' | 'board') {
  // Read the generated index.html and swap asset paths for webview-safe URIs
  const indexHtmlPath = path.join(extensionUri.fsPath, 'dist', 'index.html');
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  } catch (e) {
    console.error('Could not read index.html', e);
    return `<!DOCTYPE html><html><body>Error loading Webview: Could not read dist/index.html</body></html>`;
  }

  // Extract the script src and css href from the generated HTML to ensure we get the hashed filenames
  // This is a bit hacky but robust for Vite's hashing.
  // Alternatively, we can configure Vite to not hash, but hashing is good for caching.
  
  // We need to replace the paths in the HTML with webview URIs.
  // The generated HTML looks like: <script type="module" crossorigin src="/assets/index-D_t9J9.js"></script>
  // <link rel="stylesheet" crossorigin href="/assets/index-C1234.css">

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

  // Inject CSP and Context
  // We need to insert the meta tag and the script tag.
  // Let's replace the existing CSP if it exists, or insert into head.
  // Vite might not generate a CSP meta tag by default.

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' https: http: ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:;">`;
  const contextScript = `<script nonce="${nonce}">window.vibekanViewType = '${viewType}';</script>`;

  // Insert after <head>
  htmlContent = htmlContent.replace('<head>', `<head>${cspMeta}`);
  // Insert before </body> or inside head for the script? 
  // Better to put the context script before the main script.
  // The main script is usually in the body or head. 
  // Let's prepend to the body to be safe and ensure it runs before the module.
  htmlContent = htmlContent.replace('<body>', `<body>${contextScript}`);

  // Apply nonce to script tags that don't already have one
  htmlContent = htmlContent.replace(/<script(?![^>]*\bnonce=)([^>]*)>/g, `<script nonce="${nonce}"$1>`);

  return htmlContent;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
