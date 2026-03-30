# Canvas Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sticky notes, freehand drawing, and undo/redo to the canvas.

**Architecture:** Three new localStorage entities (StickyNote, Stroke) with matching hooks following the existing useComponents pattern. A useUndoRedo hook implements the command pattern with two stacks. Drawing uses an SVG layer in the canvas transform div. Canvas.jsx gains a mode selector (pointer/draw) and integrates all new elements.

**Tech Stack:** React, localStorage, SVG paths, existing pointer event patterns from ComponentWindow.

---

### Task 1: Add StickyNote and Stroke entities to localStorage client

**Files:**
- Modify: `src/api/localStorageClient.js`

- [ ] **Step 1: Add entities**

Add `StickyNote` and `Stroke` to the `base44.entities` object:

```js
export const base44 = {
  entities: {
    Folder: createEntity('canvas_folders'),
    Component: createEntity('canvas_components'),
    Comment: createEntity('canvas_comments'),
    StickyNote: createEntity('canvas_sticky_notes'),
    Stroke: createEntity('canvas_strokes'),
  },
};
```

- [ ] **Step 2: Verify**

Run: `npx vite build --logLevel error`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/localStorageClient.js
git commit -m "feat: add StickyNote and Stroke entities to localStorage"
```

---

### Task 2: Create useStickyNotes and useStrokes hooks

**Files:**
- Create: `src/hooks/useStickyNotes.js`
- Create: `src/hooks/useStrokes.js`

- [ ] **Step 1: Create useStickyNotes hook**

```js
// src/hooks/useStickyNotes.js
import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStickyNotes() {
  const queryClient = useQueryClient();

  const { data: stickyNotes = [] } = useQuery({
    queryKey: ['stickyNotes'],
    queryFn: () => base44.entities.StickyNote.list(),
    initialData: [],
  });

  const createStickyNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.StickyNote.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }),
  });

  const deleteStickyNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.StickyNote.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['stickyNotes'] });
      const prev = queryClient.getQueryData(['stickyNotes']);
      queryClient.setQueryData(['stickyNotes'], (old) => old ? old.filter(n => n.id !== id) : []);
      return { prev };
    },
    onError: (err, id, ctx) => queryClient.setQueryData(['stickyNotes'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['stickyNotes'] }),
  });

  const createStickyNote = (data) => createStickyNoteMutation.mutate(data);
  const deleteStickyNote = (id) => deleteStickyNoteMutation.mutate(id);
  const silentUpdateStickyNote = (id, data) => base44.entities.StickyNote.update(id, data);
  const silentCreateStickyNote = (data) => base44.entities.StickyNote.create(data);
  const silentDeleteStickyNote = (id) => base44.entities.StickyNote.delete(id);

  return {
    stickyNotes,
    createStickyNote,
    deleteStickyNote,
    silentUpdateStickyNote,
    silentCreateStickyNote,
    silentDeleteStickyNote,
    createStickyNoteMutation,
  };
}
```

- [ ] **Step 2: Create useStrokes hook**

```js
// src/hooks/useStrokes.js
import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStrokes() {
  const queryClient = useQueryClient();

  const { data: strokes = [] } = useQuery({
    queryKey: ['strokes'],
    queryFn: () => base44.entities.Stroke.list(),
    initialData: [],
  });

  const createStrokeMutation = useMutation({
    mutationFn: (data) => base44.entities.Stroke.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strokes'] }),
  });

  const deleteStrokeMutation = useMutation({
    mutationFn: (id) => base44.entities.Stroke.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['strokes'] });
      const prev = queryClient.getQueryData(['strokes']);
      queryClient.setQueryData(['strokes'], (old) => old ? old.filter(s => s.id !== id) : []);
      return { prev };
    },
    onError: (err, id, ctx) => queryClient.setQueryData(['strokes'], ctx.prev),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['strokes'] }),
  });

  const createStroke = (data) => createStrokeMutation.mutate(data);
  const deleteStroke = (id) => deleteStrokeMutation.mutate(id);
  const silentCreateStroke = (data) => base44.entities.Stroke.create(data);
  const silentDeleteStroke = (id) => base44.entities.Stroke.delete(id);

  return {
    strokes,
    createStroke,
    deleteStroke,
    silentCreateStroke,
    silentDeleteStroke,
  };
}
```

- [ ] **Step 3: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStickyNotes.js src/hooks/useStrokes.js
git commit -m "feat: add useStickyNotes and useStrokes hooks"
```

---

### Task 3: Create useUndoRedo hook

**Files:**
- Create: `src/hooks/useUndoRedo.js`

- [ ] **Step 1: Create the hook**

```js
// src/hooks/useUndoRedo.js
import { useState, useCallback, useEffect } from 'react';

const MAX_HISTORY = 50;

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const push = useCallback((action) => {
    // action: { type: string, undo: () => void, redo: () => void }
    setUndoStack((prev) => {
      const next = [...prev, action];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const action = next.pop();
      action.undo();
      setRedoStack((r) => [...r, action]);
      return next;
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const action = next.pop();
      action.redo();
      setUndoStack((u) => [...u, action]);
      return next;
    });
  }, []);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if focus is inside CodeMirror
      if (e.target.closest('.cm-editor')) return;

      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return { push, undo, redo, canUndo, canRedo };
}
```

- [ ] **Step 2: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUndoRedo.js
git commit -m "feat: add useUndoRedo hook with keyboard shortcuts"
```

---

### Task 4: Create StickyNote component

**Files:**
- Create: `src/components/canvas/StickyNote.jsx`

- [ ] **Step 1: Create the component**

```jsx
// src/components/canvas/StickyNote.jsx
import { useState, useRef, useEffect, memo } from 'react';
import { X } from 'lucide-react';

const NOTE_COLORS = {
  yellow: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  blue:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  green:  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  pink:   { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  purple: { bg: '#f3e8ff', text: '#6b21a8', border: '#c4b5fd' },
};

const COLOR_KEYS = Object.keys(NOTE_COLORS);

const StickyNote = memo(function StickyNote({ note, onUpdate, onDelete, onBringToFront, scale = 1, onDragEnd, onMoveStart, onMoveEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dragInfo = useRef({ startX: 0, startY: 0, initialPos: { x: 0, y: 0 } });
  const resizeInfo = useRef({ startX: 0, startY: 0, initialSize: { width: 0, height: 0 } });
  const rafRef = useRef(null);
  const pendingRef = useRef(null);
  const textareaRef = useRef(null);

  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

  const handleDragStart = (e) => {
    if (isEditing) return;
    onBringToFront(note.id);
    setIsDragging(true);
    if (onMoveStart) onMoveStart(note.id, { ...note.position });
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...note.position },
    };
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    onBringToFront(note.id);
    setIsResizing(true);
    resizeInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialSize: { ...note.size },
    };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const handlePointerMove = (e) => {
      let updates;
      if (isDragging) {
        const dx = (e.clientX - dragInfo.current.startX) / scale;
        const dy = (e.clientY - dragInfo.current.startY) / scale;
        updates = { position: { x: dragInfo.current.initialPos.x + dx, y: dragInfo.current.initialPos.y + dy } };
      }
      if (isResizing) {
        const dx = (e.clientX - resizeInfo.current.startX) / scale;
        const dy = (e.clientY - resizeInfo.current.startY) / scale;
        updates = { size: { width: Math.max(120, resizeInfo.current.initialSize.width + dx), height: Math.max(120, resizeInfo.current.initialSize.height + dy) } };
      }
      pendingRef.current = updates;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingRef.current) {
            onUpdate(note.id, pendingRef.current);
            pendingRef.current = null;
          }
          rafRef.current = null;
        });
      }
    };

    const handlePointerUp = () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (pendingRef.current) { onUpdate(note.id, pendingRef.current); pendingRef.current = null; }
      if (isDragging && onMoveEnd) onMoveEnd(note.id, { ...note.position });
      if (onDragEnd) onDragEnd();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging, isResizing, note.id, scale, onUpdate, onDragEnd, onMoveEnd]);

  return (
    <div
      className="absolute group"
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        zIndex: note.zIndex,
        willChange: isDragging || isResizing ? 'left, top, width, height' : 'auto',
      }}
      onPointerDown={handleDragStart}
    >
      <div
        className="w-full h-full rounded-lg overflow-hidden border flex flex-col"
        style={{ background: colors.bg, borderColor: colors.border, color: colors.text, cursor: isDragging ? 'move' : 'default' }}
      >
        {/* Delete + Color picker on hover */}
        <div className="flex items-center justify-between px-2 pt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <div className="flex gap-1">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                className="w-4 h-4 rounded-full border border-black/10"
                style={{ background: NOTE_COLORS[c].border }}
                onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { color: c }); }}
              />
            ))}
          </div>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="flex-1 w-full bg-transparent resize-none outline-none px-3 pb-3 pt-1 text-sm leading-relaxed placeholder:opacity-40"
          style={{ color: colors.text }}
          placeholder="Type something..."
          value={note.text}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-10"
        onPointerDown={handleResizeStart}
      >
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-b-2 rounded-br-sm opacity-30 group-hover:opacity-60 transition-opacity" style={{ borderColor: colors.text }} />
      </div>
    </div>
  );
});

export { NOTE_COLORS };
export default StickyNote;
```

- [ ] **Step 2: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/StickyNote.jsx
git commit -m "feat: add StickyNote canvas component"
```

---

### Task 5: Create DrawingLayer component

**Files:**
- Create: `src/components/canvas/DrawingLayer.jsx`
- Create: `src/components/canvas/DrawToolbar.jsx`

- [ ] **Step 1: Create DrawingLayer**

```jsx
// src/components/canvas/DrawingLayer.jsx
import { useState, useRef, useCallback } from 'react';

function pointsToPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = (points[i].x + points[i + 1].x) / 2;
    const cy = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${cx} ${cy}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export default function DrawingLayer({ strokes, scale, isDrawMode, drawColor, drawThickness, onStrokeComplete, selectedStrokeId, onSelectStroke }) {
  const [activePoints, setActivePoints] = useState([]);
  const isDrawing = useRef(false);
  const svgRef = useRef(null);

  const getCanvasPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const handlePointerDown = (e) => {
    if (!isDrawMode) return;
    isDrawing.current = true;
    const pt = getCanvasPoint(e);
    setActivePoints([pt]);
    e.stopPropagation();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing.current) return;
    const pt = getCanvasPoint(e);
    setActivePoints((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (activePoints.length >= 2 && onStrokeComplete) {
      onStrokeComplete({
        points: activePoints,
        color: drawColor,
        strokeWidth: drawThickness,
      });
    }
    setActivePoints([]);
  };

  const handleStrokeClick = (e, strokeId) => {
    if (isDrawMode) return;
    e.stopPropagation();
    onSelectStroke(strokeId);
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 overflow-visible"
      style={{ zIndex: 1, pointerEvents: isDrawMode ? 'auto' : 'none', cursor: isDrawMode ? 'crosshair' : 'default' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Persisted strokes */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={pointsToPath(stroke.points)}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: isDrawMode ? 'none' : 'stroke', cursor: 'pointer' }}
          onClick={(e) => handleStrokeClick(e, stroke.id)}
          strokeOpacity={selectedStrokeId === stroke.id ? 1 : 0.85}
          filter={selectedStrokeId === stroke.id ? 'drop-shadow(0 0 3px rgba(37,99,235,.5))' : undefined}
        />
      ))}

      {/* Active drawing stroke */}
      {activePoints.length >= 2 && (
        <path
          d={pointsToPath(activePoints)}
          fill="none"
          stroke={drawColor}
          strokeWidth={drawThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Create DrawToolbar**

```jsx
// src/components/canvas/DrawToolbar.jsx
import { motion } from 'framer-motion';

const DRAW_COLORS = [
  { id: 'black', value: '#171717' },
  { id: 'red', value: '#dc2626' },
  { id: 'blue', value: '#2563eb' },
  { id: 'green', value: '#16a34a' },
  { id: 'orange', value: '#ea580c' },
];

const THICKNESSES = [
  { id: 'thin', value: 2, label: 'S' },
  { id: 'medium', value: 4, label: 'M' },
  { id: 'thick', value: 8, label: 'L' },
];

export default function DrawToolbar({ color, thickness, onColorChange, onThicknessChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-[68px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
    >
      <div className="flex items-center gap-2 bg-white border border-[#e5e5e5] rounded-lg px-3 py-1.5">
        {/* Colors */}
        <div className="flex gap-1.5">
          {DRAW_COLORS.map((c) => (
            <button
              key={c.id}
              className="w-5 h-5 rounded-full border-2 transition-transform"
              style={{
                background: c.value,
                borderColor: color === c.value ? c.value : 'transparent',
                transform: color === c.value ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={() => onColorChange(c.value)}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-[#e5e5e5] mx-1" />

        {/* Thickness */}
        <div className="flex gap-1">
          {THICKNESSES.map((t) => (
            <button
              key={t.id}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors"
              style={{
                background: thickness === t.value ? '#f5f5f5' : 'transparent',
                color: thickness === t.value ? '#171717' : '#a3a3a3',
              }}
              onClick={() => onThicknessChange(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/DrawingLayer.jsx src/components/canvas/DrawToolbar.jsx
git commit -m "feat: add DrawingLayer and DrawToolbar components"
```

---

### Task 6: Update CanvasToolbar with mode selector, sticky note button, undo/redo

**Files:**
- Modify: `src/components/canvas/CanvasToolbar.jsx`

- [ ] **Step 1: Rewrite CanvasToolbar**

Add new props and UI elements: mode selector (Pointer/Draw), sticky note button, undo/redo buttons. Keep all existing functionality. Full replacement of the file — read current file first then write the updated version with:

New props added to the component signature:
```
canvasMode, setCanvasMode, addStickyNote, undo, redo, canUndo, canRedo
```

New imports:
```
import { MousePointer2, Pencil, StickyNote, Undo2, Redo2 } from 'lucide-react';
import { motion } from 'framer-motion';
```

Add to the center toolbar (after the existing buttons, before the search button):
- A divider
- Mode selector: two buttons (Pointer/Draw) with animated indicator using `motion.div` and `layoutId="canvas-mode-indicator"`
- A divider
- Sticky Note button

Add to the right actions (before zoom controls):
- Undo button (disabled when `!canUndo`, color `#a3a3a3` when disabled)
- Redo button (disabled when `!canRedo`)

- [ ] **Step 2: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/CanvasToolbar.jsx
git commit -m "feat: add mode selector, sticky note, undo/redo to toolbar"
```

---

### Task 7: Integrate everything into Canvas.jsx

**Files:**
- Modify: `src/pages/Canvas.jsx`

- [ ] **Step 1: Add imports and hooks**

Add to imports:
```js
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { useStrokes } from '@/hooks/useStrokes';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import StickyNote from '../components/canvas/StickyNote';
import DrawingLayer from '../components/canvas/DrawingLayer';
import DrawToolbar from '../components/canvas/DrawToolbar';
import { AnimatePresence } from 'framer-motion';
```

Add hooks inside the component:
```js
const { stickyNotes: dbStickyNotes, createStickyNote, deleteStickyNote: deleteStickyNoteMutation, silentUpdateStickyNote, silentCreateStickyNote, silentDeleteStickyNote } = useStickyNotes();
const { strokes: dbStrokes, createStroke, deleteStroke: deleteStrokeMutation, silentCreateStroke, silentDeleteStroke } = useStrokes();
const { push: pushUndo, undo, redo, canUndo, canRedo } = useUndoRedo();
```

Add new state:
```js
const [localStickyNotes, setLocalStickyNotes] = useState([]);
const [localStrokes, setLocalStrokes] = useState([]);
const [canvasMode, setCanvasMode] = useState('pointer');
const [drawColor, setDrawColor] = useState('#171717');
const [drawThickness, setDrawThickness] = useState(4);
const [selectedStrokeId, setSelectedStrokeId] = useState(null);
```

Add sync effects for sticky notes and strokes (same pattern as components):
```js
useEffect(() => {
  if (dbStickyNotes) setLocalStickyNotes(dbStickyNotes);
}, [dbStickyNotes]);

useEffect(() => {
  if (dbStrokes) setLocalStrokes(dbStrokes);
}, [dbStrokes]);
```

- [ ] **Step 2: Add handlers**

Sticky note handlers:
```js
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
  createStickyNote(noteData);
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
      undo: () => { silentCreateStickyNote(note).then(() => /* refetch handled by mutation */null); createStickyNote(note); },
      redo: () => { deleteStickyNoteMutation(id); },
    });
  }
}, [deleteStickyNoteMutation, pushUndo, silentCreateStickyNote, createStickyNote, localStickyNotes]);

const bringStickyToFront = useCallback((id) => {
  setLocalStickyNotes((prev) => {
    const maxZ = Math.max(...prev.map(n => n.zIndex || 0), maxZIndex, 0) + 1;
    silentUpdateStickyNote(id, { zIndex: maxZ });
    return prev.map(n => n.id === id ? { ...n, zIndex: maxZ } : n);
  });
}, [silentUpdateStickyNote, maxZIndex]);
```

Stroke handlers:
```js
const handleStrokeComplete = useCallback((strokeData) => {
  createStroke({ ...strokeData, zIndex: 0 });
}, [createStroke]);

const handleDeleteSelectedStroke = useCallback(() => {
  if (!selectedStrokeId) return;
  const stroke = localStrokes.find(s => s.id === selectedStrokeId);
  setLocalStrokes((prev) => prev.filter(s => s.id !== selectedStrokeId));
  deleteStrokeMutation(selectedStrokeId);
  setSelectedStrokeId(null);
}, [selectedStrokeId, deleteStrokeMutation, localStrokes]);
```

Delete key listener for strokes:
```js
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
```

Deselect stroke when clicking canvas background:
```js
// In the existing handleMouseDown, add:
setSelectedStrokeId(null);
```

- [ ] **Step 3: Update the JSX**

Pass new props to CanvasToolbar:
```jsx
<CanvasToolbar
  // ...existing props...
  canvasMode={canvasMode}
  setCanvasMode={setCanvasMode}
  addStickyNote={addStickyNote}
  undo={undo}
  redo={redo}
  canUndo={canUndo}
  canRedo={canRedo}
/>
```

Add DrawToolbar (conditionally rendered):
```jsx
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
```

Inside the canvas transform div, add DrawingLayer before ComponentWindows:
```jsx
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
```

After ComponentWindows, render sticky notes:
```jsx
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
```

Update the empty state condition:
```jsx
{localComponents.length === 0 && localStickyNotes.length === 0 && localStrokes.length === 0 && <CanvasEmptyState />}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 5: Commit**

```bash
git add src/pages/Canvas.jsx
git commit -m "feat: integrate sticky notes, drawing, and undo/redo into canvas"
```

---

### Task 8: Wire undo/redo into existing component actions

**Files:**
- Modify: `src/pages/Canvas.jsx`

- [ ] **Step 1: Add undo/redo to addComponent**

In `addComponent`, after `createComponent(newComponent)`, the component gets created with a new ID. We need to capture that ID for undo. Since `createComponent` uses a mutation, we can wrap it:

Replace `createComponent(newComponent)` with:
```js
const created = await base44.entities.Component.create(newComponent);
// Trigger refetch
createComponent.__skip = true; // We already created it
queryClient.invalidateQueries({ queryKey: ['components'] });
pushUndo({
  type: 'add-component',
  undo: () => deleteComponentMutation(created.id),
  redo: () => createComponent({ ...newComponent, id: created.id }),
});
```

Actually, simpler approach — just track the undo after the mutation succeeds. For add/delete, the simplest reliable pattern is to directly call the localStorage API and invalidate:

```js
// In addComponent, replace createComponent(newComponent) with:
base44.entities.Component.create(newComponent).then((created) => {
  queryClient.invalidateQueries({ queryKey: ['components'] });
  pushUndo({
    type: 'add-component',
    undo: () => { base44.entities.Component.delete(created.id); queryClient.invalidateQueries({ queryKey: ['components'] }); },
    redo: () => { base44.entities.Component.create({ ...newComponent }); queryClient.invalidateQueries({ queryKey: ['components'] }); },
  });
});
```

Add `useQueryClient` import and `const queryClient = useQueryClient();` at the top of the component (import from `@tanstack/react-query`).

- [ ] **Step 2: Add undo/redo to deleteComponent**

```js
const deleteComponent = useCallback(
  (id) => {
    const comp = localComponentsRef.current.find(c => c.id === id);
    setLocalComponents((prev) => prev.filter((c) => c.id !== id));
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
```

- [ ] **Step 3: Add undo/redo to move/resize (record on save)**

In `handleSaveComponent`, record the position/size change. This requires capturing the "before" state. Update `handleComponentUpdate` to store the pre-move state when a drag starts, and `handleSaveComponent` to push the undo action:

Add a ref to track pre-interaction state:
```js
const preInteractionRef = useRef({});
```

In ComponentWindow, `onMoveStart` and `onResizeStart` props already exist (or add them). Actually, simpler: capture the state in `handleComponentUpdate` on the first position/size update:

Add to Canvas.jsx state:
```js
const preInteractionRef = useRef({});
```

Modify `handleComponentUpdate`:
```js
const handleComponentUpdate = useCallback((id, updates) => {
  // Capture pre-interaction state on first position/size change
  if ((updates.position || updates.size) && !preInteractionRef.current[id]) {
    const comp = localComponentsRef.current.find(c => c.id === id);
    if (comp) preInteractionRef.current[id] = { position: { ...comp.position }, size: { ...comp.size } };
  }
  // ... rest of existing logic
}, [calculateSnap, setGuides, silentUpdate]);
```

Modify `handleSaveComponent`:
```js
const handleSaveComponent = useCallback((id) => {
  const comp = localComponentsRef.current.find((c) => c.id === id);
  if (comp) {
    silentUpdate(id, comp);
    // Push undo if we have pre-interaction state
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
```

- [ ] **Step 4: Verify build**

Run: `npx vite build --logLevel error`

- [ ] **Step 5: Full test**

1. Add component → Cmd+Z removes it → Cmd+Shift+Z brings it back
2. Move component → Cmd+Z moves it back
3. Delete component → Cmd+Z restores it
4. Add sticky note → Cmd+Z removes it
5. Draw a stroke → Cmd+Z removes it

- [ ] **Step 6: Commit**

```bash
git add src/pages/Canvas.jsx
git commit -m "feat: wire undo/redo into component and sticky note actions"
```

---

### Task 9: Final push to GitHub

- [ ] **Step 1: Push all changes**

```bash
git push
```

- [ ] **Step 2: Verify deployment**

Check https://hassankettany.github.io/component-canvas/ — should auto-deploy in ~1 minute.
