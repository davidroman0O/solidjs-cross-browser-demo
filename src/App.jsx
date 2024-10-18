import { render } from 'solid-js/web';
import { createSignal, createEffect } from 'solid-js';
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

  const { createPanel, togglePanelMode, setSnapGrid, gridConfig, PanelManager } = createCrossBrowserPanelManager({
    renderContent,
    gridSize: 20 // Set the initial grid size to 20px
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

  const [gridType, setGridType] = createSignal(gridConfig().type);
  const [gridSize, setGridSize] = createSignal(gridConfig().size);

  createEffect(() => {
    setGridType(gridConfig().type);
    setGridSize(gridConfig().size);
  });

  const updateGridConfig = () => {
    setSnapGrid({
      type: gridType(),
      size: Number(gridSize()),
    });
  };

  const toggleSnapGrid = () => {
    setSnapGrid({ enabled: !gridConfig().enabled });
  };

  const buttonStyle = (active) => ({
    padding: '5px 10px',
    margin: '0 5px',
    backgroundColor: active ? '#4CAF50' : '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  });

  return (
    <div>
      <h1>Panel Management</h1>
      <button onClick={() => createCustomPanel('absolute', window.screenX + 100, window.screenY + 100)}>
        Create Absolute Panel
      </button>
      <button onClick={() => createCustomPanel('relative', window.screenX + 200, window.screenY + 200)}>
        Create Relative Panel
      </button>
      <div style={{ marginTop: '20px' }}>
        <label>
          Grid Type:
          <select 
            value={gridType()} 
            onChange={(e) => {
              setGridType(e.target.value);
              updateGridConfig();
            }}
          >
            <option value="pixel">Pixel</option>
            <option value="percentage">Percentage</option>
          </select>
        </label>
        <label style={{ marginLeft: '10px' }}>
          Grid Size:
          <input 
            type="number" 
            value={gridSize()} 
            onInput={(e) => {
              setGridSize(e.target.value);
              updateGridConfig();
            }} 
            style={{ width: '50px' }} 
          />
        </label>
        <button 
          onClick={toggleSnapGrid} 
          style={buttonStyle(gridConfig().enabled)}
        >
          Snap Grid: {gridConfig().enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <PanelManager />
    </div>
  );
};

export default App;