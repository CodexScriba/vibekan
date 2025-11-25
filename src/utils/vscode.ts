// Define the WebviewApi interface locally since 'vscode-webview' is not available
interface WebviewApi<StateType> {
  postMessage(message: unknown): void;
  getState(): StateType | undefined;
  setState(newState: StateType): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VSCodeApi = WebviewApi<any>;

let vscodeApi: VSCodeApi | undefined;

export const getVsCodeApi = (): VSCodeApi | undefined => {
  if (!vscodeApi && typeof window.acquireVsCodeApi === 'function') {
    vscodeApi = window.acquireVsCodeApi();
  }
  return vscodeApi;
};

