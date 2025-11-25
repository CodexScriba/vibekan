import React from 'react';
import './index.css';
import { Sidebar } from './components/Sidebar';

const App: React.FC = () => {
  // Determine view type from global window object injected by extension
  // Default to 'board' if undefined (e.g. during dev or if injection fails)
  const viewType = window.vibekanViewType || 'board';

  if (viewType === 'sidebar') {
    return <Sidebar />;
  }

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'var(--text-primary)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1>Vibekan Board</h1>
      <p>Glassmorphic UI placeholder – Phase B implementation pending.</p>
    </div>
  );
};

export default App;
