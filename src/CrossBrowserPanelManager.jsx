import { createSignal, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';

const createCrossBrowserPanelManager = () => {
  const [panels, setPanels] = createStore([]);
  const [browserPosition, setBrowserPosition] = createSignal({ x: window.screenX, y: window.screenY });

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
          position: props.type === 'absolute' ? 'fixed' : 'absolute',
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

  createEffect(() => {
    let lastBrowserPosition = { x: window.screenX, y: window.screenY };

    const updatePosition = () => {
      const currentPosition = { x: window.screenX, y: window.screenY };
      const dx = currentPosition.x - lastBrowserPosition.x;
      const dy = currentPosition.y - lastBrowserPosition.y;

      if (dx !== 0 || dy !== 0) {
        setBrowserPosition(currentPosition);

        setPanels(
          panel => panel.type === 'relative',
          panel => ({
            ...panel,
            x: panel.x + dx,
            y: panel.y + dy
          })
        );

        lastBrowserPosition = currentPosition;
      }
    };

    const intervalId = setInterval(updatePosition, 8); 

    return () => clearInterval(intervalId);
  });

  createEffect(() => {
    const handleMessage = (event) => {
      const { action, panel, sender } = event.data;
      if (sender === browserId) return; // Ignore messages from self

      if (action === 'create') {
        setPanels(panels => [...panels, panel]);
      } else if (action === 'update') {
        setPanels(p => p.id === panel.id, panel);
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  });

  return {
    createPanel,
    PanelManager: () => (
      <For each={panels}>{(panel) => <Panel {...panel} />}</For>
    )
  };
};

export default createCrossBrowserPanelManager;