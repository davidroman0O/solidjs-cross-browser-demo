import { render } from 'solid-js/web';
import createCrossBrowserPanelManager from './CrossBrowserPanelManager';

const App = () => {
  const renderContent = (contentId) => {
    switch (contentId) {
      case 'custom-panel':
        return (
          <div style={{ padding: '10px' }}>
            <h3>Custom Panel</h3>
            <p>This is a customizable panel.</p>
            <button onClick={() => togglePanelMode(/* panel id */)}>Toggle Mode</button>
          </div>
        );
      default:
        return <div>Default Content</div>;
    }
  };

  const { createPanel, togglePanelMode, PanelManager } = createCrossBrowserPanelManager({
    renderContent,
    gridSize: 20 // Set the grid size to 20px
  });

  const createCustomPanel = (type, x, y) => {
    createPanel(
      type,
      x,
      y,
      240,
      180,
      'custom-panel',
      {
        backgroundColor: '#f0f0f0',
        border: '2px solid #333',
        borderRadius: '8px',
        resizeHandle: {
          width: '15px',
          height: '15px',
          backgroundColor: '#333',
          borderRadius: '50%'
        }
      }
    );
  };

  return (
    <div>
      <h1>Panel Management</h1>
      <button onClick={() => createCustomPanel('absolute', window.screenX + 100, window.screenY + 100)}>
        Create Absolute Panel
      </button>
      <button onClick={() => createCustomPanel('relative', window.screenX + 200, window.screenY + 200)}>
        Create Relative Panel
      </button>
      <PanelManager />
    </div>
  );
};

export default App;