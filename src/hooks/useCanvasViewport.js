import { useState, useRef, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { ZOOM_LIMITS, ZOOM_SENSITIVITY } from '@/constants/canvas';

export function useCanvasViewport(containerRef) {
  const [zoom, setZoom] = useState(() => { try { const v = sessionStorage.getItem('canvas_zoom'); return v ? parseFloat(v) : 1; } catch { return 1; } });
  const [pan, setPan] = useState(() => { try { const v = sessionStorage.getItem('canvas_pan'); return v ? JSON.parse(v) : { x: 0, y: 0 }; } catch { return { x: 0, y: 0 }; } });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keep refs in sync with state
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const debouncedPersist = useRef(
    debounce((z, p) => {
      sessionStorage.setItem('canvas_zoom', String(z));
      sessionStorage.setItem('canvas_pan', JSON.stringify(p));
    }, 300)
  ).current;

  useEffect(() => {
    debouncedPersist(zoom, pan);
  }, [zoom, pan]);

  useEffect(() => {
    return () => debouncedPersist.flush();
  }, []);

  // Wheel handler for zoom and scroll-pan
  const handleWheel = useCallback(
    (e) => {
      if (!containerRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;
        const delta = -e.deltaY * ZOOM_SENSITIVITY;
        const newZoom = Math.min(
          Math.max(ZOOM_LIMITS.min, currentZoom + delta),
          ZOOM_LIMITS.max
        );
        const zoomFactor = newZoom / currentZoom;
        const newPan = {
          x: mouseX - (mouseX - currentPan.x) * zoomFactor,
          y: mouseY - (mouseY - currentPan.y) * zoomFactor,
        };
        setZoom(newZoom);
        setPan(newPan);
      } else {
        e.preventDefault();
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [containerRef]
  );

  // Attach wheel listener to window
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Gesture prevention (Safari pinch-to-zoom)
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('gesturestart', prevent);
    window.addEventListener('gesturechange', prevent);
    window.addEventListener('gestureend', prevent);
    return () => {
      window.removeEventListener('gesturestart', prevent);
      window.removeEventListener('gesturechange', prevent);
      window.removeEventListener('gestureend', prevent);
    };
  }, []);

  // Message handler for cross-frame commands
  useEffect(() => {
    const handleMessage = (e) => {
      const { type, data } = e.data || {};

      if (type === 'CANVAS_ZOOM') {
        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;
        const mouseX = window.innerWidth / 2;
        const mouseY = window.innerHeight / 2;
        const delta = (data?.delta ?? 0);
        const newZoom = Math.min(
          Math.max(ZOOM_LIMITS.min, currentZoom + delta),
          ZOOM_LIMITS.max
        );
        const zoomFactor = newZoom / currentZoom;
        const newPan = {
          x: mouseX - (mouseX - currentPan.x) * zoomFactor,
          y: mouseY - (mouseY - currentPan.y) * zoomFactor,
        };
        setZoom(newZoom);
        setPan(newPan);
      }

      if (type === 'SPACE_DOWN') {
        setIsSpacePressed(true);
      }

      if (type === 'SPACE_UP') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Keyboard handler for space-to-pan
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse handlers for click-drag panning
  const handleMouseDown = useCallback((e, canvasRef) => {
    if (
      e.target === canvasRef.current ||
      e.target.closest('.pan-area')
    ) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    isSpacePressed,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
