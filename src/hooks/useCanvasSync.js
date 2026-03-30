import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localStorageClient';

const SYNC_INTERVAL = 2000; // poll every 2 seconds
const SYNC_URL = '/__canvas/state';

export function useCanvasSync() {
  const queryClient = useQueryClient();
  const lastSyncedRef = useRef('');
  const isSyncingRef = useRef(false);

  // Push local state to file
  const pushState = useCallback(async () => {
    try {
      const state = {
        folders: await base44.entities.Folder.list(),
        components: await base44.entities.Component.list(),
        stickyNotes: await base44.entities.StickyNote.list(),
        strokes: await base44.entities.Stroke.list(),
        _lastModified: Date.now(),
      };
      const json = JSON.stringify(state);
      lastSyncedRef.current = json;
      await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      });
    } catch {
      // silently fail — sync is best-effort
    }
  }, []);

  // Pull external changes from file
  const pullState = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      const res = await fetch(SYNC_URL);
      const json = await res.text();
      if (!json || json === '{}' || json === lastSyncedRef.current) return;

      isSyncingRef.current = true;
      const state = JSON.parse(json);
      lastSyncedRef.current = json;

      // Write external data to localStorage
      if (state.folders) {
        localStorage.setItem('canvas_folders', JSON.stringify(state.folders));
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      }
      if (state.components) {
        localStorage.setItem('canvas_components', JSON.stringify(state.components));
        queryClient.invalidateQueries({ queryKey: ['components'] });
      }
      if (state.stickyNotes) {
        localStorage.setItem('canvas_sticky_notes', JSON.stringify(state.stickyNotes));
        queryClient.invalidateQueries({ queryKey: ['stickyNotes'] });
      }
      if (state.strokes) {
        localStorage.setItem('canvas_strokes', JSON.stringify(state.strokes));
        queryClient.invalidateQueries({ queryKey: ['strokes'] });
      }

      isSyncingRef.current = false;
    } catch {
      isSyncingRef.current = false;
    }
  }, [queryClient]);

  // Push state on mount (initial sync)
  useEffect(() => {
    pushState();
  }, []);

  // Poll for external changes
  useEffect(() => {
    const interval = setInterval(pullState, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [pullState]);

  return { pushState, pullState };
}
