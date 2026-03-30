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
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { useStrokes } from '@/hooks/useStrokes';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import StickyNote from '../components/canvas/StickyNote';
import DrawingLayer from '../components/canvas/DrawingLayer';
import DrawToolbar from '../components/canvas/DrawToolbar';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const { stickyNotes: dbStickyNotes, createStickyNote, deleteStickyNote: deleteStickyNoteMutation, silentUpdateStickyNote } = useStickyNotes();
  const { strokes: dbStrokes, createStroke, deleteStroke: deleteStrokeMutation } = useStrokes();
  const { push: pushUndo, undo, redo, canUndo, canRedo } = useUndoRedo();

  // --- Refs ---
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const localComponentsRef = useRef([]);
  const preInteractionRef = useRef({});

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
  const [localStickyNotes, setLocalStickyNotes] = useState([]);
  const [localStrokes, setLocalStrokes] = useState([]);
  const [canvasMode, setCanvasMode] = useState('pointer');
  const [drawColor, setDrawColor] = useState('#171717');
  const [drawThickness, setDrawThickness] = useState(4);
  const [selectedStrokeId, setSelectedStrokeId] = useState(null);

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

  useEffect(() => {
    if (dbStickyNotes) setLocalStickyNotes(dbStickyNotes);
  }, [dbStickyNotes]);

  useEffect(() => {
    if (dbStrokes) setLocalStrokes(dbStrokes);
  }, [dbStrokes]);

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
    if ((updates.position || updates.size) && !preInteractionRef.current[id]) {
      const comp = localComponentsRef.current.find(c => c.id === id);
      if (comp) preInteractionRef.current[id] = { position: { ...comp.position }, size: { ...comp.size } };
    }
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
      const before = preInteractionRef.current[id];
      if (before) {
        const after = { position: { ...comp.position }, size: { ...comp.size } };
        pushUndo({
          type: 'move-component',
          undo: () => { silentUpdate(id, before); setLocalComponents(prev => prev.map(c => c.id === id ? { ...c, ...before } : c)); },
          redo: () => { silentUpdate(id, after); setLocalComponents(prev => prev.map(c => c.id === id ? { ...c, ...after } : c)); },
        });
        delete preInteractionRef.current[id];
      }
    }
  }, [silentUpdate, pushUndo]);

  const deleteComponent = useCallback(
    (id) => {
      const comp = localComponentsRef.current.find(c => c.id === id);
      setLocalComponents((prev) => prev.filter((comp) => comp.id !== id));
      deleteComponentMutation(id);
      if (comp) {
        pushUndo({
          type: 'delete-component',
          undo: () => { base44.entities.Component.create(comp); queryClient.invalidateQueries({ queryKey: ['components'] }); },
          redo: () => { deleteComponentMutation(id); },
        });
      }
    },
    [deleteComponentMutation, pushUndo, queryClient]
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

  // --- Sticky Note Handlers ---

  const addStickyNote = () => {
    const centerX = (-pan.x + window.innerWidth / 2) / zoom - 100;
    const centerY = (-pan.y + window.innerHeight / 2) / zoom - 100;
    const noteData = {
      text: '',
      position: { x: centerX, y: centerY },
      size: { width: 200, height: 200 },
      color: 'yellow',
      zIndex: maxZIndex + 1,
    };
    base44.entities.StickyNote.create(noteData).then((created) => {
      queryClient.invalidateQueries({ queryKey: ['stickyNotes'] });
      pushUndo({
        type: 'add-sticky',
        undo: () => { base44.entities.StickyNote.delete(created.id); queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }); },
        redo: () => { base44.entities.StickyNote.create(noteData); queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }); },
      });
    });
    setMaxZIndex((p) => p + 1);
  };

  const handleStickyNoteUpdate = useCallback((id, updates) => {
    setLocalStickyNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n));
    silentUpdateStickyNote(id, updates);
  }, [silentUpdateStickyNote]);

  const handleDeleteStickyNote = useCallback((id) => {
    const note = localStickyNotes.find(n => n.id === id);
    setLocalStickyNotes((prev) => prev.filter((n) => n.id !== id));
    deleteStickyNoteMutation(id);
    if (note) {
      pushUndo({
        type: 'delete-sticky',
        undo: () => { base44.entities.StickyNote.create(note); queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }); },
        redo: () => { base44.entities.StickyNote.delete(note.id); queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }); },
      });
    }
  }, [deleteStickyNoteMutation, pushUndo, queryClient, localStickyNotes]);

  const bringStickyToFront = useCallback((id) => {
    setLocalStickyNotes((prev) => {
      const maxZ = Math.max(...prev.map(n => n.zIndex || 0), maxZIndex, 0) + 1;
      silentUpdateStickyNote(id, { zIndex: maxZ });
      return prev.map(n => n.id === id ? { ...n, zIndex: maxZ } : n);
    });
  }, [silentUpdateStickyNote, maxZIndex]);

  // --- Stroke Handlers ---

  const handleStrokeComplete = useCallback((strokeData) => {
    base44.entities.Stroke.create({ ...strokeData, zIndex: 0 }).then((created) => {
      queryClient.invalidateQueries({ queryKey: ['strokes'] });
      pushUndo({
        type: 'add-stroke',
        undo: () => { base44.entities.Stroke.delete(created.id); queryClient.invalidateQueries({ queryKey: ['strokes'] }); },
        redo: () => { base44.entities.Stroke.create(strokeData); queryClient.invalidateQueries({ queryKey: ['strokes'] }); },
      });
    });
  }, [queryClient, pushUndo]);

  const handleDeleteSelectedStroke = useCallback(() => {
    if (!selectedStrokeId) return;
    const stroke = localStrokes.find(s => s.id === selectedStrokeId);
    setLocalStrokes((prev) => prev.filter(s => s.id !== selectedStrokeId));
    deleteStrokeMutation(selectedStrokeId);
    if (stroke) {
      pushUndo({
        type: 'delete-stroke',
        undo: () => { base44.entities.Stroke.create(stroke); queryClient.invalidateQueries({ queryKey: ['strokes'] }); },
        redo: () => { base44.entities.Stroke.delete(stroke.id); queryClient.invalidateQueries({ queryKey: ['strokes'] }); },
      });
    }
    setSelectedStrokeId(null);
  }, [selectedStrokeId, deleteStrokeMutation, pushUndo, queryClient, localStrokes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStrokeId && !e.target.closest('input, textarea, .cm-editor')) {
        e.preventDefault();
        handleDeleteSelectedStroke();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStrokeId, handleDeleteSelectedStroke]);

  const handleMouseDown = (e) => {
    setSelectedStrokeId(null);
    // Don't start panning when in draw mode
    if (canvasMode === 'draw') return;
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
        canvasMode={canvasMode}
        setCanvasMode={setCanvasMode}
        addStickyNote={addStickyNote}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <AnimatePresence>
        {canvasMode === 'draw' && (
          <DrawToolbar
            color={drawColor}
            thickness={drawThickness}
            onColorChange={setDrawColor}
            onThicknessChange={setDrawThickness}
          />
        )}
      </AnimatePresence>

      {/* Canvas Area */}
      <div
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <DrawingLayer
          strokes={localStrokes}
          scale={zoom}
          isDrawMode={canvasMode === 'draw'}
          drawColor={drawColor}
          drawThickness={drawThickness}
          onStrokeComplete={handleStrokeComplete}
          selectedStrokeId={selectedStrokeId}
          onSelectStroke={setSelectedStrokeId}
        />

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

        {localStickyNotes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onUpdate={handleStickyNoteUpdate}
            onDelete={handleDeleteStickyNote}
            onBringToFront={bringStickyToFront}
            scale={zoom}
            onDragEnd={clearGuides}
          />
        ))}

        {localComponents.length === 0 && localStickyNotes.length === 0 && localStrokes.length === 0 && <CanvasEmptyState />}
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
