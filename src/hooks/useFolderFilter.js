import { useState, useCallback } from 'react';

export function useFolderFilter(folders) {
  const [visibleFolderIds, setVisibleFolderIds] = useState(
    () => new Set(['ALL'])
  );

  const toggleFolderVisibility = useCallback(
    (folderId) => {
      setVisibleFolderIds((prev) => {
        const next = new Set(prev);

        if (folderId === 'ALL') {
          // Toggle between everything visible and nothing visible
          if (next.has('ALL')) {
            return new Set();
          }
          return new Set(['ALL']);
        }

        // When ALL is selected, switch to "all except clicked"
        if (next.has('ALL')) {
          return new Set(folders.filter((f) => f.id !== folderId).map((f) => f.id));
        }

        // Normal toggle for individual folders
        if (next.has(folderId)) {
          next.delete(folderId);
        } else {
          next.add(folderId);
        }

        // If all folders are now individually selected, collapse back to ALL
        if (folders.length > 0 && folders.every((f) => next.has(f.id))) {
          return new Set(['ALL']);
        }

        return next;
      });
    },
    [folders]
  );

  const isComponentVisible = useCallback(
    (component) => {
      return (
        visibleFolderIds.has('ALL') ||
        visibleFolderIds.has(component.folder_id)
      );
    },
    [visibleFolderIds]
  );

  return { visibleFolderIds, toggleFolderVisibility, isComponentVisible };
}
