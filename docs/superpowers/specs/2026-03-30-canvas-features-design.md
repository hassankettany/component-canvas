# Canvas Features: Sticky Notes, Drawing, Undo/Redo

## Overview

Add three canvas features: sticky notes for annotations, freehand drawing for brainstorming, and undo/redo for all canvas actions.

## Sticky Notes

### Data Model
New localStorage entity `canvas_sticky_notes`:
```
{
  id: string,
  text: string,
  position: { x: number, y: number },
  size: { width: number, height: number },
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple',
  zIndex: number
}
```

### Component: `StickyNote.jsx`
- Draggable and resizable on the canvas (same pointer event + RAF pattern as ComponentWindow)
- Colored background matching the note color
- Editable text via a textarea that auto-focuses on double-click
- Small color picker dots visible on hover (5 dots in a row at the bottom)
- Delete button (X) visible on hover at top-right
- Default size: 200x200px. Min size: 120x120px.
- Inherits zoom/pan from the canvas transform like ComponentWindow

### Default Colors
- yellow: `#fef9c3` bg, `#854d0e` text
- blue: `#dbeafe` bg, `#1e40af` text
- green: `#dcfce7` bg, `#166534` text
- pink: `#fce7f3` bg, `#9d174d` text
- purple: `#f3e8ff` bg, `#6b21a8` text

### Creation
- New "Sticky Note" button in CanvasToolbar next to "Add Component"
- Creates a note at the center of the current viewport
- Default color: yellow
- Default text: empty (cursor ready to type)

## Drawing

### Data Model
New localStorage entity `canvas_strokes`:
```
{
  id: string,
  points: [{ x: number, y: number }, ...],
  color: string,
  strokeWidth: number,
  zIndex: number
}
```

### Canvas Mode
Toolbar gets a mode selector: **Pointer** (default) | **Draw**

- **Pointer mode**: current behavior — click to select, drag to move, space to pan
- **Draw mode**: pointer down starts a stroke, pointer move adds points, pointer up ends the stroke. Pan via space+drag still works. Zoom via ctrl+wheel still works.

### Drawing Layer
- SVG element rendered inside the canvas transform div (same coordinate space as components)
- Below sticky notes and components in z-order, above the grid
- Each stroke is an SVG `<path>` element using the points array
- Path smoothing: use quadratic bezier curves between points for smooth lines

### Draw Mode Options
When draw mode is active, a small floating bar appears below the main toolbar:
- **Colors**: black, red, blue, green, orange (5 circle swatches)
- **Thickness**: thin (2px), medium (4px), thick (8px) — 3 toggle buttons
- Default: black, medium

### Stroke Interaction
- In pointer mode, clicking a stroke selects it (visual highlight)
- Press Delete/Backspace to remove selected stroke
- Selected stroke shows a subtle highlight (e.g., thicker + slight glow)

## Undo/Redo

### Hook: `useUndoRedo.js`
Command pattern with two stacks:
```
{
  undoStack: [{ type, description, undo(), redo() }, ...],
  redoStack: [{ type, description, undo(), redo() }, ...],
  push(action),   // adds to undo stack, clears redo stack
  undo(),         // pops from undo, pushes to redo, calls action.undo()
  redo(),         // pops from redo, pushes to undo, calls action.redo()
  canUndo,        // boolean
  canRedo,        // boolean
}
```

Max 50 actions in undo stack. Oldest actions drop off when limit is reached.

### Keyboard Shortcuts
- `Cmd+Z` (Mac) / `Ctrl+Z` (Win): undo
- `Cmd+Shift+Z` / `Ctrl+Shift+Z`: redo
- Registered on the window, but ignored when focus is inside CodeMirror (it has its own undo)

### Undoable Actions
| Action | undo() | redo() |
|--------|--------|--------|
| Add component | delete it | re-create it |
| Delete component | re-create it | delete it |
| Move component | restore old position | apply new position |
| Resize component | restore old size | apply new size |
| Add sticky note | delete it | re-create it |
| Delete sticky note | re-create it | delete it |
| Move sticky note | restore old position | apply new position |
| Edit sticky note text | restore old text | apply new text |
| Add stroke | delete it | re-create it |
| Delete stroke | re-create it | delete it |

### Recording Timing
- Move/resize: recorded on pointerUp (one action per drag, not per frame)
- Sticky note text: recorded on blur (one action per edit session)
- Add/delete: recorded immediately

## Canvas.jsx Integration

### New State
- `stickyNotes` / `setStickyNotes` — local array synced from localStorage
- `strokes` / `setStrokes` — local array synced from localStorage
- `canvasMode` — 'pointer' | 'draw'
- `selectedStrokeId` — for stroke deletion
- `drawColor` / `drawThickness` — current drawing options

### New Hooks
- `useUndoRedo()` — the undo/redo stack
- `useStickyNotes()` — CRUD for sticky notes (same pattern as useComponents)
- `useStrokes()` — CRUD for strokes (same pattern as useComponents)

### New Components
- `StickyNote.jsx` — individual sticky note (drag, resize, edit, color)
- `DrawingLayer.jsx` — SVG layer for all strokes + active drawing
- `DrawToolbar.jsx` — color/thickness options when in draw mode

### Toolbar Updates
- CanvasToolbar gets: mode selector (Pointer/Draw), Sticky Note button
- Undo/Redo buttons in the toolbar (in addition to keyboard shortcuts)

## Files to Create
- `src/components/canvas/StickyNote.jsx`
- `src/components/canvas/DrawingLayer.jsx`
- `src/components/canvas/DrawToolbar.jsx`
- `src/hooks/useUndoRedo.js`
- `src/hooks/useStickyNotes.js`
- `src/hooks/useStrokes.js`

## Files to Modify
- `src/pages/Canvas.jsx` — integrate new state, hooks, components, keyboard shortcuts
- `src/components/canvas/CanvasToolbar.jsx` — add mode selector, sticky note button, undo/redo buttons
- `src/api/localStorageClient.js` — add StickyNote and Stroke entities

## What Stays the Same
- ComponentWindow, CodeEditor, PreviewPane — untouched
- Dashboard view — untouched
- All existing hooks and data layer — untouched
- UI design language — new components follow the same minimalist style
