import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useComponents } from '@/hooks/useComponents';
import { useCanvasViewport } from '@/hooks/useCanvasViewport';
import { useSnapping } from '@/hooks/useSnapping';
import { useCanvasLayout } from '@/hooks/useCanvasLayout';
import { useFolderFilter } from '@/hooks/useFolderFilter';
import ComponentWindow from '../components/canvas/ComponentWindow';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import CanvasGuides from '../components/canvas/CanvasGuides';
import CanvasEmptyState from '../components/canvas/CanvasEmptyState';
import FindReplaceDialog from '../components/common/FindReplaceDialog';
import ModeSwitcher from '../components/common/ModeSwitcher';
import { GRID_SIZE, DEFAULT_COMPONENT_SIZE, LAYOUT_START } from '@/constants/canvas';
import { DEFAULT_COMPONENT_HTML } from '@/constants/templates';
import { base44 } from '@/api/localStorageClient';

export default function Canvas() {
  // --- Data hooks ---
  const { folders, createFolder } = useFolders();
  const {
    components: dbComponents,
    createComponent,
    batchUpdateComponents,
    deleteComponent: deleteComponentMutation,
    silentUpdate,
    silentBatchUpdate,
  } = useComponents();

  // --- Refs ---
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const localComponentsRef = useRef([]);

  // --- Canvas engine hooks ---
  const {
    zoom,
    setZoom,
    pan,
    isPanning,
    isSpacePressed,
    handleMouseDown: viewportMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasViewport(containerRef);

  const { guides, clearGuides, calculateSnap, setGuides } = useSnapping();
  const { visibleFolderIds, toggleFolderVisibility, isComponentVisible } =
    useFolderFilter(folders);

  // --- Local state ---
  const [localComponents, setLocalComponents] = useState([]);
  const [globalMode, setGlobalMode] = useState('preview');
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);

  // --- Effects ---

  // Keep ref in sync with local components (for snapping calculations)
  useEffect(() => {
    localComponentsRef.current = localComponents;
  }, [localComponents]);

  // Sync DB components into local optimistic state
  useEffect(() => {
    if (dbComponents) {
      setLocalComponents(dbComponents);
      if (dbComponents.length > 0) {
        setMaxZIndex(Math.max(...dbComponents.map((c) => c.zIndex || 0)));
      }
    }
  }, [dbComponents]);

  // --- Layout hook ---
  const { reorganizeLayout } = useCanvasLayout({
    folders,
    localComponents,
    setLocalComponents,
    batchUpdateComponents,
  });

  // --- Handlers ---

  const addComponent = async () => {
    let targetFolder = folders?.find((f) => f.name === 'General') || folders?.[0];
    if (!targetFolder) {
      targetFolder = await base44.entities.Folder.create({ name: 'General' });
    }
    const newComponent = {
      name: `Component ${localComponents.length + 1}`,
      folder_id: targetFolder.id,
      position: {
        x: LAYOUT_START.x + localComponents.length * 30,
        y: LAYOUT_START.y + localComponents.length * 30,
      },
      size: { ...DEFAULT_COMPONENT_SIZE },
      mode: 'preview',
      code: DEFAULT_COMPONENT_HTML,
      zIndex: maxZIndex + 1,
    };
    createComponent(newComponent);
    setMaxZIndex((prev) => prev + 1);
  };

  const handleComponentUpdate = useCallback((id, updates) => {
    const components = localComponentsRef.current;
    const { snappedUpdates, newGuides } = calculateSnap(id, updates, components);
    setGuides(newGuides);
    setLocalComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, ...snappedUpdates } : comp))
    );
    // Persist non-drag changes immediately (mode, folder_id, name)
    if (!updates.position && !updates.size) {
      silentUpdate(id, snappedUpdates);
    }
  }, [calculateSnap, setGuides, silentUpdate]);

  const handleSaveComponent = useCallback((id) => {
    const comp = localComponentsRef.current.find((c) => c.id === id);
    if (comp) {
      silentUpdate(id, comp);
    }
  }, [silentUpdate]);

  const deleteComponent = useCallback(
    (id) => {
      setLocalComponents((prev) => prev.filter((comp) => comp.id !== id));
      deleteComponentMutation(id);
    },
    [deleteComponentMutation]
  );

  const bringToFront = useCallback(
    (id) => {
      setLocalComponents((prev) => {
        const maxZ = Math.max(...prev.map((c) => c.zIndex || 0), 0) + 1;
        silentUpdate(id, { zIndex: maxZ });
        return prev.map((c) => (c.id === id ? { ...c, zIndex: maxZ } : c));
      });
    },
    [silentUpdate]
  );

  const handleBatchUpdate = (updates) => {
    setLocalComponents((prev) => {
      const next = [...prev];
      updates.forEach((u) => {
        const index = next.findIndex((c) => c.id === u.id);
        if (index !== -1) {
          next[index] = { ...next[index], ...u.data };
        }
      });
      return next;
    });
    silentBatchUpdate(updates);
  };

  const handleToggleGlobalMode = () => {
    const newMode = globalMode === 'preview' ? 'edit' : 'preview';
    setGlobalMode(newMode);
    const updates = localComponents.map((c) => ({
      id: c.id,
      data: { mode: newMode },
    }));
    setLocalComponents((prev) => prev.map((c) => ({ ...c, mode: newMode })));
    silentBatchUpdate(updates);
  };

  const handleMouseDown = (e) => {
    viewportMouseDown(e, canvasRef);
  };

  // --- Render ---
  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#fafafa]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Spacebar Panning Overlay */}
      {isSpacePressed && (
        <div
          className="absolute inset-0 z-[9999] cursor-grab active:cursor-grabbing pan-area"
          onMouseDown={(e) => viewportMouseDown(e, canvasRef)}
        />
      )}

      {/* Dot Grid Background */}
      <div
        ref={canvasRef}
        className="absolute inset-0 pan-area cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,.08) ${0.8 * zoom}px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          opacity: 0.4,
        }}
      />

      {/* Navigation */}
      <ModeSwitcher currentMode="canvas" />

      {/* Toolbar + Actions */}
      <CanvasToolbar
        folders={folders}
        visibleFolderIds={visibleFolderIds}
        toggleFolderVisibility={toggleFolderVisibility}
        reorganizeLayout={reorganizeLayout}
        globalMode={globalMode}
        onToggleGlobalMode={handleToggleGlobalMode}
        zoom={zoom}
        setZoom={setZoom}
        addComponent={addComponent}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
      />

      {/* Canvas Area */}
      <div
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {localComponents.filter(isComponentVisible).map((component) => (
          <ComponentWindow
            key={component.id}
            component={component}
            folderColor={folders?.find((f) => f.id === component.folder_id)?.color}
            onUpdate={handleComponentUpdate}
            onSave={handleSaveComponent}
            onDelete={deleteComponent}
            onBringToFront={bringToFront}
            scale={zoom}
            onDragEnd={clearGuides}
          />
        ))}

        <CanvasGuides guides={guides} zoom={zoom} />

        {localComponents.length === 0 && <CanvasEmptyState />}
      </div>

      <FindReplaceDialog
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        components={localComponents}
        onBatchUpdate={handleBatchUpdate}
      />
    </div>
  );
}
