export {};

declare global {
  interface Window {
    vibekanViewType?: 'sidebar' | 'board';
    acquireVsCodeApi?: () => any;
  }
}
