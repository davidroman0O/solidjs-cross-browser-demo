import { createSignal, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';

const [panels, setPanels] = createStore([]);
const [browserPosition, setBrowserPosition] = createSignal({ x: window.screenX, y: window.screenY });

const channel = new BroadcastChannel('panel-management');

const createPanel = (type, x, y) => {
  const newPanel = { 
    id: Date.now() + Math.random(),
    type,
    x,
    y
  };
  setPanels(panels => [...panels, newPanel]);
  channel.postMessage({ action: 'create', panel: newPanel });
};

const updatePanelPosition = (id, x, y) => {
  setPanels(panel => panel.id === id, { x, y });
  channel.postMessage({ action: 'update', panel: { id, x, y } });
};

const togglePanelMode = (id) => {
  setPanels(panel => panel.id === id, panel => ({
    ...panel,
    type: panel.type === 'relative' ? 'absolute' : 'relative'
  }));
  const updatedPanel = panels.find(p => p.id === id);
  channel.postMessage({ action: 'update', panel: updatedPanel });
};

const Panel = (props) => {
  let startX, startY;

  const handleMouseDown = (e) => {
    e.preventDefault(); 
    startX = e.clientX + window.screenX - props.x;
    startY = e.clientY + window.screenY - props.y;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newX = e.clientX + window.screenX - startX;
    const newY = e.clientY + window.screenY - startY;
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
        position: 'fixed',
        left: `${props.type === 'absolute' ? props.x - browserPosition().x : props.x - window.screenX}px`,
        top: `${props.type === 'absolute' ? props.y - browserPosition().y : props.y - window.screenY}px`,
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
  let lastBrowserPosition = { x: window.screenX, y: window.screenY };

  createEffect(() => {
    const updatePosition = () => {
      setBrowserPosition({ x: window.screenX, y: window.screenY });
      const currentPosition = { x: window.screenX, y: window.screenY };
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
      const { action, panel } = event.data;
      if (action === 'create') {
        setPanels(panels => [...panels.filter(p => p.id !== panel.id), panel]);
      } else if (action === 'update') {
        setPanels(p => p.id === panel.id, panel);
      }
    };

    return () => channel.close();
  });

  return (
    <div>
      <h1>Panel Management</h1>
      <button onClick={() => createPanel('absolute', window.screenX + 100, window.screenY + 100)}>Create Absolute Panel</button>
      <button onClick={() => createPanel('relative', window.screenX + 200, window.screenY + 200)}>Create Relative Panel</button>
      <For each={panels}>{(panel) => <Panel {...panel} />}</For>
    </div>
  );
};

export default App;
