import { createSignal, createEffect, onCleanup, For } from 'solid-js';
import { createStore } from 'solid-js/store';

const [panels, setPanels] = createStore([]);
const [browserPosition, setBrowserPosition] = createSignal({ x: 0, y: 0 });

const channel = new BroadcastChannel('panel-management');

const createPanel = (type, x, y) => {
  const newPanel = { 
    id: Date.now() + Math.random(),
    type,
    x: x,
    y: y
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
    startX = e.clientX - props.x;
    startY = e.clientY - props.y;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const newX = e.clientX - startX;
    const newY = e.clientY - startY;
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
        left: `${props.type === 'absolute' ? props.x : props.x - browserPosition().x}px`,
        top: `${props.type === 'absolute' ? props.y : props.y - browserPosition().y}px`,
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
  createEffect(() => {
    const updatePosition = () => {
      setBrowserPosition({ x: window.screenX, y: window.screenY });
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
      <button onClick={() => createPanel('relative', window.screenX + 50, window.screenY + 50)}>Create Relative Panel</button>
      <button onClick={() => createPanel('absolute', 100, 100)}>Create Absolute Panel</button>
      <For each={panels}>{(panel) => <Panel {...panel} />}</For>
    </div>
  );
};

export default App;