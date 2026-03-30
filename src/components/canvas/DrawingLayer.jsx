import React, { useState, useRef, useCallback, memo } from 'react';

function pointsToPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const cx = (points[i].x + points[i + 1].x) / 2;
    const cy = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${cx} ${cy}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

const DrawingLayer = memo(function DrawingLayer({
  strokes,
  scale,
  isDrawMode,
  drawColor,
  drawThickness,
  onStrokeComplete,
  selectedStrokeId,
  onSelectStroke,
}) {
  const [currentPoints, setCurrentPoints] = useState([]);
  const isDrawing = useRef(false);
  const svgRef = useRef(null);

  const getCanvasPoint = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const handlePointerDown = useCallback((e) => {
    if (!isDrawMode) return;
    isDrawing.current = true;
    const pt = getCanvasPoint(e);
    setCurrentPoints([pt]);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isDrawMode, getCanvasPoint]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return;
    const pt = getCanvasPoint(e);
    setCurrentPoints((prev) => [...prev, pt]);
  }, [getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    setCurrentPoints((prev) => {
      if (prev.length >= 2 && onStrokeComplete) {
        onStrokeComplete({
          points: prev,
          color: drawColor,
          strokeWidth: drawThickness,
        });
      }
      return [];
    });
  }, [drawColor, drawThickness, onStrokeComplete]);

  const handleStrokeClick = useCallback((e, strokeId) => {
    if (isDrawMode) return;
    e.stopPropagation();
    if (onSelectStroke) onSelectStroke(strokeId);
  }, [isDrawMode, onSelectStroke]);

  const currentPath = pointsToPath(currentPoints);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 overflow-visible"
      style={{
        zIndex: 1,
        pointerEvents: isDrawMode ? 'auto' : 'none',
        cursor: isDrawMode ? 'crosshair' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Transparent hit area — SVG only receives events on drawn content without this */}
      {isDrawMode && <rect x="-999999" y="-999999" width="1999998" height="1999998" fill="transparent" />}

      {/* Selection highlight filter */}
      <defs>
        <filter id="selected-stroke-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.6" />
        </filter>
      </defs>

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
          style={{
            pointerEvents: isDrawMode ? 'none' : 'stroke',
            cursor: isDrawMode ? 'crosshair' : 'pointer',
            filter: selectedStrokeId === stroke.id ? 'url(#selected-stroke-shadow)' : 'none',
          }}
          onPointerDown={(e) => handleStrokeClick(e, stroke.id)}
        />
      ))}

      {/* Current stroke being drawn */}
      {currentPath && (
        <path
          d={currentPath}
          fill="none"
          stroke={drawColor}
          strokeWidth={drawThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
});

export default DrawingLayer;
