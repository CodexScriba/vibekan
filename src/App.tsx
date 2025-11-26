import React from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';

const App: React.FC = () => {
  // Determine view type from global window object injected by extension
  // Default to 'board' if undefined (e.g. during dev or if injection fails)
  const viewType = window.vibekanViewType || 'board';

  if (viewType === 'sidebar') {
    return <Sidebar />;
  }

  return <Board />;
};

export default App;
