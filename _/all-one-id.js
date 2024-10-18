import { createSignal, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';

const [panels, setPanels] = createStore([]);
const [browserPosition, setBrowserPosition] = createSignal({ x: window.screenLeft, y: window.screenTop });

const channel = new BroadcastChannel('panel-management');
const browserId = Date.now() + Math.random(); 

const createPanel = (type, x, y) => {
  const newPanel = { 
    id: Date.now() + Math.random(),
    type,
    x,
    y
  };
  setPanels(panels => [...panels, newPanel]);
  channel.postMessage({ action: 'create', panel: newPanel, sender: browserId });
};

const updatePanelPosition = (id, x, y) => {
  setPanels(panel => panel.id === id, { x, y });
  channel.postMessage({ action: 'update', panel: { id, x, y }, sender: browserId });
};

const togglePanelMode = (id) => {
  setPanels(panel => panel.id === id, panel => ({
    ...panel,
    type: panel.type === 'relative' ? 'absolute' : 'relative'
  }));
  const updatedPanel = panels.find(p => p.id === id);
  channel.postMessage({ action: 'update', panel: updatedPanel, sender: browserId });
};

const Panel = (props) => {
  let startX, startY;

  const handleMouseDown = (e) => {
    e.preventDefault();
    startX = e.clientX + window.screenLeft - props.x;
    startY = e.clientY + window.screenTop - props.y;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newX = e.clientX + window.screenLeft - startX;
    const newY = e.clientY + window.screenTop - startY;
    updatePanelPosition(props.id, newX, newY);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        width: '100px',
        height: '100px',
        backgroundColor: props.type === 'absolute' ? 'lightblue' : 'lightgreen',
        cursor: 'move',
        position: props.type === 'absolute' ? 'fixed' : 'absolute',
        left: `${props.type === 'absolute' ? props.x - browserPosition().x : props.x - window.screenLeft}px`,
        top: `${props.type === 'absolute' ? props.y - browserPosition().y : props.y - window.screenTop}px`,
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
    >
      <div>{props.type} Panel</div>
      <button onClick={() => togglePanelMode(props.id)}>Toggle Mode</button>
    </div>
  );
};

const App = () => {
  let lastBrowserPosition = { x: window.screenLeft, y: window.screenTop };

  createEffect(() => {
    const updatePosition = () => {
      setBrowserPosition({ x: window.screenX, y: window.screenTop });
      const currentPosition = { x: window.screenX, y: window.screenTop };
      const dx = currentPosition.x - lastBrowserPosition.x;
      const dy = currentPosition.y - lastBrowserPosition.y;

      if (dx !== 0 || dy !== 0) {
        setPanels(
          panel => panel.type === 'relative',
          panel => ({
            ...panel,
            x: panel.x + dx,
            y: panel.y + dy
          })
        );
      }

      lastBrowserPosition = currentPosition;
      requestAnimationFrame(updatePosition);
    };
    updatePosition();
    return () => cancelAnimationFrame(updatePosition);
  });

  createEffect(() => {
    channel.onmessage = (event) => {
      const { action, panel, sender } = event.data;
      if (sender === browserId) return; // Ignore messages from self

      if (action === 'create') {
        setPanels(panels => [...panels, panel]);
      } else if (action === 'update') {
        setPanels(p => p.id === panel.id, panel);
      }
    };

    return () => channel.close();
  });

  return (
    <div>
      <h1>Panel Management</h1>
      <button onClick={() => createPanel('absolute', window.screenLeft + 100, window.screenTop + 100)}>Create Absolute Panel</button>
      <button onClick={() => createPanel('relative', window.screenLeft + 200, window.screenTop + 200)}>Create Relative Panel</button>
      <For each={panels}>{(panel) => <Panel {...panel} />}</For>
    </div>
  );
};

export default App;
