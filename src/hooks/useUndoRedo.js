import { useState, useEffect, useCallback } from 'react';

const MAX_STACK_SIZE = 50;

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const push = useCallback((action) => {
    setUndoStack((prev) => {
      const next = [...prev, action];
      if (next.length > MAX_STACK_SIZE) next.shift();
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

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.closest('.cm-editor')) return;

      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;

      e.preventDefault();

      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    undoStack,
    redoStack,
  };
}
