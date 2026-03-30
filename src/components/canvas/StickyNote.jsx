import React, { useState, useRef, useEffect, memo } from 'react';

export const NOTE_COLORS = {
  yellow: { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  blue:   { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  green:  { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  pink:   { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  purple: { bg: '#f3e8ff', text: '#6b21a8', border: '#c4b5fd' },
};

const StickyNote = memo(function StickyNote({ note, onUpdate, onDelete, onBringToFront, scale = 1, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragInfo = useRef({ startX: 0, startY: 0, initialPos: { x: 0, y: 0 } });
  const resizeInfo = useRef({ startX: 0, startY: 0, initialSize: { width: 0, height: 0 } });
  const rafRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;

  // --- Drag ---
  const handleDragStart = (e) => {
    if (e.target.closest('.no-drag')) return;
    onBringToFront(note.id);
    setIsDragging(true);
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...note.position },
    };
  };

  // --- Resize ---
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

  // --- Pointer move / up (same RAF-batching pattern as ComponentWindow) ---
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const handlePointerMove = (e) => {
      let updates;
      if (isDragging) {
        const dx = (e.clientX - dragInfo.current.startX) / scale;
        const dy = (e.clientY - dragInfo.current.startY) / scale;
        updates = {
          position: {
            x: dragInfo.current.initialPos.x + dx,
            y: dragInfo.current.initialPos.y + dy,
          },
        };
      }
      if (isResizing) {
        const dx = (e.clientX - resizeInfo.current.startX) / scale;
        const dy = (e.clientY - resizeInfo.current.startY) / scale;
        updates = {
          size: {
            width: Math.max(120, resizeInfo.current.initialSize.width + dx),
            height: Math.max(120, resizeInfo.current.initialSize.height + dy),
          },
        };
      }

      pendingUpdateRef.current = updates;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (pendingUpdateRef.current) {
            onUpdate(note.id, pendingUpdateRef.current);
            pendingUpdateRef.current = null;
          }
          rafRef.current = null;
        });
      }
    };

    const handlePointerUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pendingUpdateRef.current) {
        onUpdate(note.id, pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }

      if (isDragging || isResizing) {
        if (onDragEnd) onDragEnd();
      }

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
  }, [isDragging, isResizing, note.id, scale, onDragEnd, onUpdate]);

  const isInteracting = isDragging || isResizing;

  return (
    <div
      className="absolute group"
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        zIndex: note.zIndex,
        cursor: isDragging ? 'move' : 'default',
        willChange: isInteracting ? 'left, top, width, height' : 'auto',
      }}
      onPointerDown={handleDragStart}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <div
        className="w-full h-full rounded-lg relative flex flex-col"
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Delete button — visible on hover */}
        {isHovered && (
          <button
            className="no-drag absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
            style={{ color: colors.text }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="2" x2="8" y2="8" />
              <line x1="8" y1="2" x2="2" y2="8" />
            </svg>
          </button>
        )}

        {/* Textarea */}
        <textarea
          className="no-drag flex-1 w-full bg-transparent border-none outline-none resize-none p-3 text-sm leading-relaxed"
          style={{ color: colors.text }}
          value={note.text}
          placeholder="Type a note..."
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />

        {/* Color picker dots — visible on hover */}
        {isHovered && (
          <div
            className="no-drag flex items-center justify-center gap-1.5 pb-2"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {Object.entries(NOTE_COLORS).map(([colorKey, colorVal]) => (
              <button
                key={colorKey}
                className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                style={{
                  backgroundColor: colorVal.border,
                  border: colorKey === note.color ? `2px solid ${colorVal.text}` : '1px solid transparent',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(note.id, { color: colorKey });
                }}
              />
            ))}
          </div>
        )}

        {/* Resize handle */}
        <div
          className="no-drag absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onPointerDown={handleResizeStart}
        >
          <div
            className="absolute bottom-2 right-2 w-3 h-3 border-r-[1.5px] border-b-[1.5px] rounded-br-[1px]"
            style={{
              borderColor: colors.text,
              opacity: 0.3,
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default StickyNote;
