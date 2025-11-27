import '@testing-library/jest-dom';

// JSDOM does not implement document.queryCommandSupported, which Monaco checks for clipboard support.
if (typeof document !== 'undefined' && !(document as any).queryCommandSupported) {
  (document as any).queryCommandSupported = () => false;
}
