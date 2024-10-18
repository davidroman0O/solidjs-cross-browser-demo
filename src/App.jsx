import { render } from 'solid-js/web';
import createCrossBrowserPanelManager from './CrossBrowserPanelManager';

const App = () => {
  const { createPanel, PanelManager } = createCrossBrowserPanelManager();

  return (
    <div>
      <h1>Panel Management</h1>
      <button onClick={() => createPanel('absolute', window.screenX + 100, window.screenY + 100)}>
        Create Absolute Panel
      </button>
      <button onClick={() => createPanel('relative', window.screenX + 200, window.screenY + 200)}>
        Create Relative Panel
      </button>
      <PanelManager />
    </div>
  );
};


export default App;