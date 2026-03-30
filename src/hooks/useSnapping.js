import { useState, useCallback } from 'react';
import { SNAP_THRESHOLD } from '@/constants/canvas';

export function useSnapping() {
  const [guides, setGuides] = useState([]);

  const clearGuides = useCallback(() => setGuides([]), []);

  const calculateSnap = useCallback((id, updates, components) => {
    const newGuides = [];
    let snappedUpdates = { ...updates };

    if (!updates.position || components.length <= 1) {
      return { snappedUpdates, newGuides };
    }

    const currentComp = components.find((c) => c.id === id);
    if (!currentComp) {
      return { snappedUpdates, newGuides };
    }

    const w = updates.size?.width ?? currentComp.size?.width ?? 0;
    const h = updates.size?.height ?? currentComp.size?.height ?? 0;
    let { x, y } = updates.position;

    // Edges of the dragged component
    const myEdgesX = [x, x + w / 2, x + w];
    const myEdgesY = [y, y + h / 2, y + h];

    let snappedX = null;
    let snappedY = null;

    for (const other of components) {
      if (other.id === id) continue;

      const ow = other.size?.width ?? 0;
      const oh = other.size?.height ?? 0;
      const ox = other.position?.x ?? 0;
      const oy = other.position?.y ?? 0;

      const otherEdgesX = [ox, ox + ow / 2, ox + ow];
      const otherEdgesY = [oy, oy + oh / 2, oy + oh];

      // Check X alignment
      for (const myEx of myEdgesX) {
        for (const otherEx of otherEdgesX) {
          if (Math.abs(myEx - otherEx) < SNAP_THRESHOLD && snappedX === null) {
            const offset = otherEx - myEx;
            snappedX = x + offset;
            newGuides.push({
              type: 'vertical',
              pos: otherEx,
              start: Math.min(y, oy),
              end: Math.max(y + h, oy + oh),
            });
          }
        }
      }

      // Check Y alignment
      for (const myEy of myEdgesY) {
        for (const otherEy of otherEdgesY) {
          if (Math.abs(myEy - otherEy) < SNAP_THRESHOLD && snappedY === null) {
            const offset = otherEy - myEy;
            snappedY = y + offset;
            newGuides.push({
              type: 'horizontal',
              pos: otherEy,
              start: Math.min(x, ox),
              end: Math.max(x + w, ox + ow),
            });
          }
        }
      }
    }

    snappedUpdates = {
      ...updates,
      position: {
        x: snappedX !== null ? snappedX : x,
        y: snappedY !== null ? snappedY : y,
      },
    };

    return { snappedUpdates, newGuides };
  }, []);

  return { guides, setGuides, clearGuides, calculateSnap };
}
