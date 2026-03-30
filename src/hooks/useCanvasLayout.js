import { useCallback } from 'react';
import {
  DEFAULT_COMPONENT_SIZE,
  LAYOUT_GAP,
  LAYOUT_START,
  LAYOUT_MAX_PER_ROW,
} from '@/constants/canvas';

export function useCanvasLayout({
  folders,
  localComponents,
  setLocalComponents,
  batchUpdateComponents,
}) {
  const reorganizeLayout = useCallback(() => {
    const sortedFolders = [...folders].sort((a, b) => a.order - b.order);

    const updates = [];
    let currentX = LAYOUT_START.x;
    let currentY = LAYOUT_START.y;

    for (const folder of sortedFolders) {
      const folderComponents = localComponents
        .filter((c) => c.folder_id === folder.id)
        .sort((a, b) => a.order - b.order);

      folderComponents.forEach((comp, index) => {
        const col = index % LAYOUT_MAX_PER_ROW;
        const row = Math.floor(index / LAYOUT_MAX_PER_ROW);

        const targetX =
          currentX + col * (DEFAULT_COMPONENT_SIZE.width + LAYOUT_GAP.x);
        const targetY =
          currentY + row * (DEFAULT_COMPONENT_SIZE.height + LAYOUT_GAP.y);

        const positionChanged =
          comp.position?.x !== targetX || comp.position?.y !== targetY;
        const sizeChanged =
          comp.size?.width !== DEFAULT_COMPONENT_SIZE.width ||
          comp.size?.height !== DEFAULT_COMPONENT_SIZE.height;

        if (positionChanged || sizeChanged) {
          updates.push({
            id: comp.id,
            data: {
              position: { x: targetX, y: targetY },
              size: { ...DEFAULT_COMPONENT_SIZE },
            },
          });
        }
      });

      // Advance currentY past this folder's rows
      const rowCount = Math.ceil(
        folderComponents.length / LAYOUT_MAX_PER_ROW
      );
      if (rowCount > 0) {
        currentY +=
          rowCount * (DEFAULT_COMPONENT_SIZE.height + LAYOUT_GAP.y);
      }
    }

    if (updates.length === 0) return;

    // Apply locally first
    setLocalComponents((prev) =>
      prev.map((comp) => {
        const update = updates.find((u) => u.id === comp.id);
        if (!update) return comp;
        return {
          ...comp,
          position: update.data.position,
          size: update.data.size,
        };
      })
    );

    // Persist to backend
    batchUpdateComponents(updates);
  }, [folders, localComponents, setLocalComponents, batchUpdateComponents]);

  return { reorganizeLayout };
}
