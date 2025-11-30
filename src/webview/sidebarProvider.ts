import * as vscode from 'vscode';
import { getWebviewContent } from './contentProvider';
import { setSidebarWebview, sendCopySettings, sendThemeSettings } from './viewManager';
import { handleWebviewMessage } from './messageRouter';

export class VibekanSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    setSidebarWebview(webviewView.webview);
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist'),
        vscode.Uri.joinPath(this._extensionUri, 'media')
      ]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri, 'sidebar');
    sendCopySettings(webviewView.webview);
    sendThemeSettings(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      await handleWebviewMessage('sidebar', webviewView.webview, data);
    });
  }
}
