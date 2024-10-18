import { createSignal, createEffect, For } from 'solid-js';
import { createStore } from 'solid-js/store';

const createCrossBrowserPanelManager = (options = {}) => {
  const [panels, setPanels] = createStore([]);
  const [browserPosition, setBrowserPosition] = createSignal({ x: window.screenX, y: window.screenY });

  const channel = new BroadcastChannel('panel-management');
  const browserId = Date.now() + Math.random();

  const gridSize = options.gridSize || 20; // Default grid size of 20px

  const snapToGrid = (value) => Math.round(value / gridSize) * gridSize;

  const createPanel = (type, x, y, width = 200, height = 150, contentId, styles = {}) => {
    const newPanel = { 
      id: Date.now() + Math.random(),
      type,
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: snapToGrid(width),
      height: snapToGrid(height),
      contentId,
      styles: JSON.stringify(styles)
    };
    setPanels(panels => [...panels, newPanel]);
    channel.postMessage({ 
      action: 'create', 
      panel: { ...newPanel, styles: undefined }, 
      sender: browserId 
    });
  };

  const updatePanelPosition = (id, x, y) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    setPanels(panel => panel.id === id, { x: snappedX, y: snappedY });
    channel.postMessage({ action: 'update', panel: { id, x: snappedX, y: snappedY }, sender: browserId });
  };

  const updatePanelSize = (id, width, height) => {
    const snappedWidth = snapToGrid(width);
    const snappedHeight = snapToGrid(height);
    setPanels(panel => panel.id === id, { width: snappedWidth, height: snappedHeight });
    channel.postMessage({ action: 'resize', panel: { id, width: snappedWidth, height: snappedHeight }, sender: browserId });
  };

  const togglePanelMode = (id) => {
    setPanels(panel => panel.id === id, panel => ({
      ...panel,
      type: panel.type === 'relative' ? 'absolute' : 'relative'
    }));
    const updatedPanel = panels.find(p => p.id === id);
    channel.postMessage({ 
      action: 'update', 
      panel: { ...updatedPanel, styles: undefined }, 
      sender: browserId 
    });
  };

  const Panel = (props) => {
    let startX, startY, startWidth, startHeight;
    const [isResizing, setIsResizing] = createSignal(false);

    const handleMouseDown = (e) => {
      if (e.target.closest('.resize-handle')) return;
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

    const handleResizeStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startX = e.clientX;
      startY = e.clientY;
      startWidth = props.width;
      startHeight = props.height;
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    };

    const handleResize = (e) => {
      if (!isResizing()) return;
      const newWidth = startWidth + e.clientX - startX;
      const newHeight = startHeight + e.clientY - startY;
      updatePanelSize(props.id, Math.max(gridSize, newWidth), Math.max(gridSize, newHeight));
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    const panelStyles = JSON.parse(props.styles || '{}');
    const defaultStyles = {
      backgroundColor: props.type === 'absolute' ? 'lightblue' : 'lightgreen',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      ...panelStyles
    };

    return (
      <div
        style={{
          width: `${props.width}px`,
          height: `${props.height}px`,
          cursor: 'move',
          position: props.type === 'absolute' ? 'fixed' : 'absolute',
          left: `${props.type === 'absolute' ? props.x - browserPosition().x : props.x - window.screenX}px`,
          top: `${props.type === 'absolute' ? props.y - browserPosition().y : props.y - window.screenY}px`,
          zIndex: 1000,
          ...defaultStyles
        }}
        onMouseDown={handleMouseDown}
      >
        {options.renderContent?.(props.contentId)}
        <div
          class="resize-handle"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'gray',
            cursor: 'se-resize',
            position: 'absolute',
            right: '0',
            bottom: '0',
            ...(panelStyles.resizeHandle || {})
          }}
          onMouseDown={handleResizeStart}
        />
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
        setPanels(panels => [...panels, { ...panel, styles: '{}' }]);
      } else if (action === 'update') {
        setPanels(p => p.id === panel.id, panel);
      } else if (action === 'resize') {
        setPanels(p => p.id === panel.id, { width: panel.width, height: panel.height });
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
    togglePanelMode,
    PanelManager: () => (
      <For each={panels}>{(panel) => <Panel {...panel} />}</For>
    )
  };
};

export default createCrossBrowserPanelManager;